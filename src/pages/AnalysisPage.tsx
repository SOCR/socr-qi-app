
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import AnalysisResults from "@/components/results/AnalysisResults";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

const AnalysisPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [data, setData] = useState<TimeSeriesData | null>(null);
  
  // First try to get data from location state
  useEffect(() => {
    const locationData = location.state?.data as TimeSeriesData | undefined;
    if (locationData) {
      setData(locationData);
      return;
    }
    
    // If no location data, try to load from localStorage
    const savedData = localStorage.getItem('timeseriesData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (err) {
        console.error("Error loading saved data:", err);
      }
    }
  }, [location]);
  
  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    
    // Also save analysis result to localStorage
    localStorage.setItem('analysisResult', JSON.stringify(result));
  };
  
  if (!data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No data available for analysis. Please import or generate data first.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/data")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Data Page
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Data Analysis</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/data")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Options */}
          <div className="lg:col-span-1">
            <AnalysisCard 
              data={data}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
          
          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Data Visualization</CardTitle>
                <CardDescription>
                  Visual representation of your time series data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart 
                  data={data} 
                  analysisResult={analysisResult || undefined}
                  height={350}
                />
              </CardContent>
            </Card>
            
            {/* Analysis Results */}
            {analysisResult && (
              <AnalysisResults result={analysisResult} />
            )}
            
            {!analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    Select an analysis type and run analysis to see results
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                  No analysis results yet. Use the panel on the left to run an analysis.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AnalysisPage;
