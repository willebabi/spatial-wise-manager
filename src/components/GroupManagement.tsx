
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  createGroup, 
  getGroupsByLayoutId, 
  deleteGroup, 
  Layout, 
  Group,
  createLocation
} from "@/lib/database";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface GroupManagementProps {
  selectedLayout: Layout | null;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ selectedLayout }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [groupRows, setGroupRows] = useState(3);
  const [groupColumns, setGroupColumns] = useState(3);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [addressFormat, setAddressFormat] = useState("ROW-COL");

  useEffect(() => {
    if (selectedLayout?.id) {
      loadGroups(selectedLayout.id);
      
      // Reset the selected column when the layout changes
      setSelectedColumn(null);
    }
  }, [selectedLayout]);

  const loadGroups = async (layoutId: number) => {
    try {
      const loadedGroups = await getGroupsByLayoutId(layoutId);
      setGroups(loadedGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const handleCreateGroup = async () => {
    if (!selectedLayout?.id) {
      toast.error("Please select a layout first");
      return;
    }

    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedColumn === null) {
      toast.error("Please select a column");
      return;
    }

    if (groupRows < 1 || groupColumns < 1) {
      toast.error("Rows and columns must be at least 1");
      return;
    }

    if (selectedColumn > selectedLayout.columns) {
      toast.error("Selected column is out of range");
      return;
    }

    setLoading(true);
    try {
      const groupId = await createGroup({
        name: groupName,
        layoutId: selectedLayout.id,
        column: selectedColumn,
        rows: groupRows,
        columns: groupColumns
      });

      // Create locations for this group
      for (let row = 0; row < groupRows; row++) {
        for (let col = 0; col < groupColumns; col++) {
          let address;
          
          switch (addressFormat) {
            case "ROW-COL":
              address = `${groupName}-${row + 1}-${col + 1}`;
              break;
            case "LETTER-NUMBER":
              address = `${groupName}-${String.fromCharCode(65 + row)}-${col + 1}`;
              break;
            default:
              address = `${groupName}-${row + 1}-${col + 1}`;
          }
          
          await createLocation({
            groupId,
            layoutId: selectedLayout.id,
            row,
            column: col,
            address,
            isOccupied: false
          });
        }
      }
      
      toast.success(`Group "${groupName}" created successfully`);
      setGroupName("");
      await loadGroups(selectedLayout.id);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
    setLoading(false);
  };

  const handleDeleteGroup = async (id: number) => {
    if (confirm("Are you sure you want to delete this group? This will delete all locations associated with it.")) {
      try {
        await deleteGroup(id);
        toast.success("Group deleted successfully");
        
        if (selectedLayout?.id) {
          await loadGroups(selectedLayout.id);
        }
      } catch (error) {
        console.error("Error deleting group:", error);
        toast.error("Failed to delete group");
      }
    }
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setSelectedColumn(group.column);
    setGroupRows(group.rows);
    setGroupColumns(group.columns);
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Group Management for Layout: {selectedLayout.name}</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            
            <div>
              <Label htmlFor="column">Column Position</Label>
              <Select
                value={selectedColumn?.toString() || ""}
                onValueChange={(value) => setSelectedColumn(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {Array(selectedLayout.columns).fill(0).map((_, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      Column {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groupRows">Group Rows</Label>
                <Input
                  id="groupRows"
                  type="number"
                  min={1}
                  value={groupRows}
                  onChange={(e) => setGroupRows(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="groupColumns">Group Columns</Label>
                <Input
                  id="groupColumns"
                  type="number"
                  min={1}
                  value={groupColumns}
                  onChange={(e) => setGroupColumns(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="addressFormat">Address Format</Label>
              <Select
                value={addressFormat}
                onValueChange={setAddressFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROW-COL">Numeric (1-1, 1-2, ...)</SelectItem>
                  <SelectItem value="LETTER-NUMBER">Alpha-Numeric (A-1, A-2, ...)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Example: {groupName}-{addressFormat === "ROW-COL" ? "1-1" : "A-1"}
              </p>
            </div>
            
            <Button 
              onClick={handleCreateGroup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">Group Preview</h3>
            <div className="overflow-x-auto border rounded-md p-4">
              <div 
                className="grid gap-1" 
                style={{ 
                  gridTemplateColumns: `repeat(${groupColumns}, 1fr)`,
                  minWidth: groupColumns * 40
                }}
              >
                {Array(groupRows).fill(0).map((_, rowIndex) => (
                  Array(groupColumns).fill(0).map((_, colIndex) => (
                    <div 
                      key={`${rowIndex}-${colIndex}`}
                      className="group-cell flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-500">
                        {addressFormat === "ROW-COL" ? 
                          `${rowIndex + 1}-${colIndex + 1}` :
                          `${String.fromCharCode(65 + rowIndex)}-${colIndex + 1}`
                        }
                      </span>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Groups</h3>
          
          {groups.length === 0 ? (
            <div className="text-center p-6 border rounded-md bg-gray-50">
              <p>No groups created yet for this layout.</p>
              <p className="text-gray-500">Create your first group to organize your warehouse.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className={`p-4 border rounded-md hover:bg-gray-50 cursor-pointer ${
                    selectedGroup?.id === group.id ? "border-primary" : ""
                  }`}
                  onClick={() => handleSelectGroup(group)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-gray-500">
                        Column: {group.column} | Size: {group.rows} rows × {group.columns} columns
                      </p>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (group.id) handleDeleteGroup(group.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  <div 
                    className="grid gap-1 mt-3 border-t pt-3" 
                    style={{ 
                      gridTemplateColumns: `repeat(${group.columns}, 1fr)`,
                    }}
                  >
                    {Array(Math.min(group.rows, 2)).fill(0).map((_, rowIndex) => (
                      Array(Math.min(group.columns, 5)).fill(0).map((_, colIndex) => (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          className="group-cell flex items-center justify-center"
                        >
                          <span className="text-xs text-gray-500">
                            {addressFormat === "ROW-COL" ? 
                              `${rowIndex + 1}-${colIndex + 1}` :
                              `${String.fromCharCode(65 + rowIndex)}-${colIndex + 1}`
                            }
                          </span>
                        </div>
                      ))
                    ))}
                  </div>
                  {(group.rows > 2 || group.columns > 5) && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Preview limited. Full view available in Visualization tab.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
