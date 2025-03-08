
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TimeSeriesData } from "@/lib/types";
import DataImportCard from "@/components/data/DataImportCard";
import SimulationCard from "@/components/data/SimulationCard";
import DataSummary from "@/components/data/DataSummary";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";
import WideFormatDataTable from "@/components/data/WideFormatDataTable";
import { ChevronRight, BarChart } from "lucide-react";

const DataPage = () => {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const navigate = useNavigate();
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('timeseriesData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (err) {
        console.error("Error loading saved data:", err);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (data) {
      localStorage.setItem('timeseriesData', JSON.stringify(data));
    }
  }, [data]);

  const handleDataReceived = (newData: TimeSeriesData) => {
    setData(newData);
  };

  const handleReset = () => {
    setData(null);
    localStorage.removeItem('timeseriesData');
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Time Series Data</h1>
          {data && (
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={handleReset} size="sm">
                Reset App
              </Button>
              <Button 
                onClick={() => navigate("/analysis", { state: { data } })}
                size="sm"
              >
                Analyze Data <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
            <TabsTrigger value="view" disabled={!data}>View</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <DataImportCard onDataImported={handleDataReceived} />
          </TabsContent>

          <TabsContent value="simulate" className="mt-6">
            <SimulationCard onDataGenerated={handleDataReceived} />
          </TabsContent>

          <TabsContent value="view" className="mt-6 space-y-6">
            {data && (
              <>
                <DataSummary data={data} />
                <TimeSeriesChart data={data} height={400} />
                <WideFormatDataTable data={data} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DataPage;
