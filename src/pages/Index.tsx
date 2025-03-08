import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import DataImportCard from "@/components/data/DataImportCard";
import SimulationCard from "@/components/data/SimulationCard";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";
import DataTable from "@/components/data/DataTable";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import AnalysisResults from "@/components/results/AnalysisResults";
import DataSummary from "@/components/data/DataSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, BarChart, LineChart, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("import");
  const [data, setData] = useState<TimeSeriesData | TimeSeriesData[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    if (location.state?.preserveData) {
      if (data) {
        setActiveTab("data");
      }
    }
  }, [location.state, data]);

  const handleDataImported = (importedData: TimeSeriesData) => {
    setData(importedData);
    setAnalysisResults([]);
    setActiveTab("data");
  };

  const handleDataGenerated = (simulatedData: TimeSeriesData[]) => {
    setData(simulatedData);
    setAnalysisResults([]);
    setActiveTab("data");
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResults(prev => [...prev, result]);
    setActiveTab("analysis");
  };

  const handleNavigateToReports = () => {
    navigate("/reports", { state: { data, analysisResults, preserveData: true } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOCR Quality Improvement App</h1>
          <p className="text-gray-600">
            Import, analyze, and visualize longitudinal health data to drive quality improvement.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center">
              <LineChart className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <FileBarChart className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataImportCard onDataImported={handleDataImported} />
              <SimulationCard onDataGenerated={handleDataGenerated} />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-6 animate-fade-in">
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
                
                <Tabs defaultValue="chart" className="w-full">
                  <TabsList>
                    <TabsTrigger value="chart">Chart View</TabsTrigger>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chart" className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Data Visualization</h2>
                      
                      {Array.isArray(data) ? (
                        <div className="grid grid-cols-1 gap-6">
                          {data.map((series) => (
                            <TimeSeriesChart 
                              key={series.id} 
                              data={series}
                            />
                          ))}
                        </div>
                      ) : (
                        <TimeSeriesChart data={data} />
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="table">
                    <DataTable data={data} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-6">
              {!data ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to SOCR Quality Improvement App</CardTitle>
                    <CardDescription>
                      Get started by importing your own data or generating simulated data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <img 
                      src="placeholder.svg"
                      alt="Dashboard Illustration"
                      className="w-64 h-64 mb-4 opacity-50"
                    />
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        This tool helps you analyze longitudinal health data to identify trends, 
                        detect anomalies, and make predictions to improve quality metrics.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">CSV Import</Badge>
                        <Badge variant="outline" className="text-xs">Time Series Analysis</Badge>
                        <Badge variant="outline" className="text-xs">Predictions</Badge>
                        <Badge variant="outline" className="text-xs">Anomaly Detection</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <DataSummary data={data} />
                  
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Data Visualization</h2>
                    
                    {Array.isArray(data) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.slice(0, 4).map((series) => (
                          <TimeSeriesChart 
                            key={series.id} 
                            data={series} 
                            height={250}
                          />
                        ))}
                      </div>
                    ) : (
                      <TimeSeriesChart data={data} height={350} />
                    )}
                  </div>
                  
                  {analysisResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Recent Analysis Results</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysisResults.slice(-2).map((result) => (
                          <AnalysisResults key={result.id} result={result} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AnalysisCard 
                  data={Array.isArray(data) ? data[0] : data}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
              
              <div className="lg:col-span-2">
                {analysisResults.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Analysis Results</CardTitle>
                      <CardDescription>
                        Run an analysis to see results here
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-6">
                      <p className="text-muted-foreground text-center">
                        Select an analysis type and parameters on the left, then click "Run Analysis"
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <AnalysisResults result={analysisResults[analysisResults.length - 1]} />
                    
                    {Array.isArray(data) ? (
                      <TimeSeriesChart 
                        data={data.find(d => d.id === analysisResults[analysisResults.length - 1].timeSeriesId) || data[0]} 
                        analysisResult={analysisResults[analysisResults.length - 1]}
                      />
                    ) : (
                      data && <TimeSeriesChart 
                        data={data} 
                        analysisResult={analysisResults[analysisResults.length - 1]}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {analysisResults.length > 1 && (
              <div className="space-y-4 mt-6">
                <h2 className="text-xl font-bold">Previous Analysis Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.slice(0, -1).reverse().map((result) => (
                    <AnalysisResults key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Report Generation</CardTitle>
                <CardDescription>
                  Generate comprehensive reports based on your data and analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
                {!data ? (
                  <div className="text-center space-y-2">
                    <AlertTitle>No data available for reporting</AlertTitle>
                    <AlertDescription>
                      Please import or generate data before creating reports.
                    </AlertDescription>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium mb-2">Ready to Generate a Report</h3>
                      <p className="text-muted-foreground">
                        Create a comprehensive report including data summaries, visualizations,
                        and analysis results.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="font-medium">Datasets</div>
                        <div className="text-2xl font-bold">{Array.isArray(data) ? data.length : 1}</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="font-medium">Data Points</div>
                        <div className="text-2xl font-bold">
                          {Array.isArray(data) 
                            ? data.reduce((sum, d) => sum + d.dataPoints.length, 0)
                            : data.dataPoints.length}
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="font-medium">Analyses</div>
                        <div className="text-2xl font-bold">{analysisResults.length}</div>
                      </div>
                    </div>
                    
                    <Button onClick={handleNavigateToReports} className="mt-4">
                      <FileBarChart className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
};

export default Index;
