
import React, { useState } from "react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import DataImportCard from "@/components/data/DataImportCard";
import SimulationCard from "@/components/data/SimulationCard";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";
import DataSummary from "@/components/data/DataSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUp, Activity } from "lucide-react";
import { TimeSeriesData } from "@/lib/types";

const DataPage = () => {
  const [data, setData] = useState<TimeSeriesData | TimeSeriesData[] | null>(null);

  // Handle data import
  const handleDataImported = (importedData: TimeSeriesData) => {
    setData(importedData);
  };

  // Handle data simulation
  const handleDataGenerated = (simulatedData: TimeSeriesData[]) => {
    setData(simulatedData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Manager</h1>
          <p className="text-gray-600">
            Import, generate, and manage your longitudinal data.
          </p>
        </div>
        
        <Tabs defaultValue="visualize" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualize" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Visualize Data
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center">
              <FileUp className="h-4 w-4 mr-2" />
              Import / Generate
            </TabsTrigger>
          </TabsList>
          
          {/* Visualize Tab Content */}
          <TabsContent value="visualize" className="space-y-6 animate-fade-in">
            {!data ? (
              <Alert>
                <AlertTitle>No data available</AlertTitle>
                <AlertDescription>
                  Please import or generate data using the Import tab.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <DataSummary data={data} />
                
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Data Visualization</h2>
                  
                  {/* Always render a single chart with all time series */}
                  <TimeSeriesChart 
                    data={data} 
                    height={450}
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Import Tab Content */}
          <TabsContent value="import" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataImportCard onDataImported={handleDataImported} />
              <SimulationCard onDataGenerated={handleDataGenerated} />
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
};

export default DataPage;
