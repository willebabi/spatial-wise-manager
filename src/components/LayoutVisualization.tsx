
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  getGroupsByLayoutId, 
  getLocationsByLayoutId,
  updateLocation,
  Layout, 
  Group,
  Location
} from "@/lib/database";

interface LayoutVisualizationProps {
  selectedLayout: Layout | null;
}

const LayoutVisualization: React.FC<LayoutVisualizationProps> = ({ selectedLayout }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  useEffect(() => {
    if (selectedLayout?.id) {
      loadData(selectedLayout.id);
    }
  }, [selectedLayout]);

  const loadData = async (layoutId: number) => {
    setLoading(true);
    try {
      const [loadedGroups, loadedLocations] = await Promise.all([
        getGroupsByLayoutId(layoutId),
        getLocationsByLayoutId(layoutId)
      ]);
      
      setGroups(loadedGroups);
      setLocations(loadedLocations);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load layout data");
    }
    setLoading(false);
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const toggleOccupancy = async () => {
    if (!selectedLocation?.id) return;
    
    try {
      const newIsOccupied = !selectedLocation.isOccupied;
      await updateLocation(selectedLocation.id, { isOccupied: newIsOccupied });
      
      // Update local state
      setLocations(locations.map(loc => 
        loc.id === selectedLocation.id ? { ...loc, isOccupied: newIsOccupied } : loc
      ));
      
      // Update selected location
      setSelectedLocation({ ...selectedLocation, isOccupied: newIsOccupied });
      
      toast.success(`Location ${selectedLocation.address} marked as ${newIsOccupied ? 'occupied' : 'empty'}`);
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location status");
    }
  };

  if (!selectedLayout) {
    return (
      <div className="text-center p-10 border rounded-md bg-gray-50">
        <p className="text-xl font-medium mb-2">No Layout Selected</p>
        <p className="text-gray-500">Please select or create a layout first.</p>
        <Button 
          className="mt-4"
          onClick={() => document.getElementById("layout-tab")?.click()}
        >
          Go to Layout Tab
        </Button>
      </div>
    );
  }

  // Group locations by column for visualization
  const locationsByColumn: { [key: number]: Location[] } = {};
  groups.forEach(group => {
    if (!locationsByColumn[group.column]) {
      locationsByColumn[group.column] = [];
    }
    
    const groupLocations = locations.filter(loc => loc.groupId === group.id);
    locationsByColumn[group.column] = [...locationsByColumn[group.column], ...groupLocations];
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Layout Visualization: {selectedLayout.name}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="border rounded-md p-4 bg-gray-50 layout-view">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center p-10">
                <p className="text-gray-500">No groups created yet for this layout.</p>
                <Button 
                  className="mt-4"
                  onClick={() => document.getElementById("groups-tab")?.click()}
                >
                  Create Groups
                </Button>
              </div>
            ) : (
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${selectedLayout.columns}, 1fr)` }}>
                {Array(selectedLayout.columns).fill(0).map((_, colIndex) => {
                  const columnGroups = groups.filter(g => g.column === colIndex + 1);
                  return (
                    <div key={`col-${colIndex}`} className="flex flex-col gap-6">
                      <div className="text-center font-semibold">Column {colIndex + 1}</div>
                      
                      {columnGroups.map(group => {
                        const groupLocations = locations.filter(loc => loc.groupId === group.id);
                        return (
                          <div key={`group-${group.id}`} className="group-container bg-white">
                            <h4 className="text-center font-medium mb-3">{group.name}</h4>
                            <div 
                              className="grid gap-1"
                              style={{ gridTemplateColumns: `repeat(${group.columns}, 1fr)` }}
                            >
                              {Array(group.rows).fill(0).map((_, groupRowIndex) => (
                                Array(group.columns).fill(0).map((_, groupColIndex) => {
                                  const location = groupLocations.find(
                                    loc => loc.row === groupRowIndex && loc.column === groupColIndex
                                  );
                                  
                                  return (
                                    <div 
                                      key={`loc-${groupRowIndex}-${groupColIndex}`}
                                      className={`
                                        warehouse-cell 
                                        ${location?.isOccupied ? 'cell-occupied' : 'cell-empty'} 
                                        ${selectedLocation?.id === location?.id ? 'cell-selected' : ''}
                                        cursor-pointer
                                      `}
                                      onClick={() => location && handleLocationClick(location)}
                                    >
                                      {location && (
                                        <div className="location-address">
                                          {location.address.split('-').slice(-2).join('-')}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {columnGroups.length === 0 && (
                        <div className="text-center p-4 border border-dashed rounded-md text-gray-400">
                          No groups in this column
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="border rounded-md p-4">
            <h3 className="text-xl font-semibold mb-4">Location Details</h3>
            
            {selectedLocation ? (
              <div>
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p><strong>Address:</strong> {selectedLocation.address}</p>
                  <p><strong>Group:</strong> {groups.find(g => g.id === selectedLocation.groupId)?.name}</p>
                  <p><strong>Position:</strong> Row {selectedLocation.row + 1}, Column {selectedLocation.column + 1}</p>
                  <p className="mt-2">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-white text-sm ${selectedLocation.isOccupied ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {selectedLocation.isOccupied ? 'Occupied' : 'Empty'}
                    </span>
                  </p>
                </div>
                
                <Button 
                  onClick={toggleOccupancy} 
                  className="w-full mb-2"
                  variant={selectedLocation.isOccupied ? "destructive" : "default"}
                >
                  Mark as {selectedLocation.isOccupied ? 'Empty' : 'Occupied'}
                </Button>
                
                <Button 
                  onClick={() => setSelectedLocation(null)} 
                  variant="outline"
                  className="w-full"
                >
                  Clear Selection
                </Button>
              </div>
            ) : (
              <div className="text-center p-6 border rounded-md bg-gray-50">
                <p>No location selected</p>
                <p className="text-gray-500">Click on a location in the visualization to see details</p>
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-medium mb-2">Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>Empty Location</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span>Occupied Location</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded mr-2"></div>
                  <span>Selected Location</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="space-y-1">
                <p className="text-sm">Total Locations: {locations.length}</p>
                <p className="text-sm">Occupied: {locations.filter(loc => loc.isOccupied).length}</p>
                <p className="text-sm">Empty: {locations.filter(loc => !loc.isOccupied).length}</p>
                <p className="text-sm">Occupancy Rate: {locations.length > 0 ? 
                  `${Math.round((locations.filter(loc => loc.isOccupied).length / locations.length) * 100)}%` : 
                  '0%'
                }</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutVisualization;
