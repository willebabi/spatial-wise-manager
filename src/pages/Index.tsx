
import React, { useEffect, useState } from "react";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import WarehouseLayout from "@/components/WarehouseLayout";
import GroupManagement from "@/components/GroupManagement";
import LayoutVisualization from "@/components/LayoutVisualization";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initDatabase } from "@/lib/database";

const Index = () => {
  const [activeTab, setActiveTab] = useState("layout");
  const [selectedLayout, setSelectedLayout] = useState(null);

  useEffect(() => {
    // Initialize the database when the component mounts
    initDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Warehouse Management System</h1>
        
        <Tabs defaultValue="layout" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="layout">Create Layout</TabsTrigger>
            <TabsTrigger value="groups">Create Groups</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
          </TabsList>
          
          <Card className="mt-4">
            <CardContent className="p-6">
              <TabsContent value="layout">
                <WarehouseLayout setSelectedLayout={setSelectedLayout} />
              </TabsContent>
              
              <TabsContent value="groups">
                <GroupManagement selectedLayout={selectedLayout} />
              </TabsContent>
              
              <TabsContent value="visualization">
                <LayoutVisualization selectedLayout={selectedLayout} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
