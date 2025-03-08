
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { TimeSeriesData, AnalysisResult, Report } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, FileText, Plus } from "lucide-react";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";
import WideFormatDataTable from "@/components/data/WideFormatDataTable";
import DataSummary from "@/components/data/DataSummary";

const ReportsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Load data and analysis results from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('timeseriesData');
    const savedAnalysis = localStorage.getItem('analysisResult');
    const savedReports = localStorage.getItem('reports');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (err) {
        console.error("Error loading saved data:", err);
      }
    }
    
    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(savedAnalysis);
        setAnalysisResult(parsedAnalysis);
      } catch (err) {
        console.error("Error loading saved analysis:", err);
      }
    }
    
    if (savedReports) {
      try {
        const parsedReports = JSON.parse(savedReports);
        setReports(parsedReports);
      } catch (err) {
        console.error("Error loading saved reports:", err);
      }
    }
  }, []);
  
  // Create a sample report if none exists
  const createSampleReport = () => {
    if (!data) return;
    
    const newReport: Report = {
      id: Math.random().toString(36).substring(2, 15),
      title: `Time Series Report - ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      description: "Sample report with time series data",
      datasets: [data],
      analyses: analysisResult ? [analysisResult] : [],
      summary: "This report contains time series data analysis and visualization.",
      conclusions: "The data shows patterns that may be of interest for further investigation."
    };
    
    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    
    // Save to localStorage
    localStorage.setItem('reports', JSON.stringify(updatedReports));
  };
  
  if (!data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No data available for reports. Please import or generate data first.
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
          <h1 className="text-3xl font-bold">Reports</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/analysis")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analysis
            </Button>
            <Button size="sm" onClick={createSampleReport}>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </div>
        </div>
        
        {reports.length > 0 ? (
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>
                        {report.description} - Created on {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Summary</h3>
                    <p className="text-muted-foreground">{report.summary}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Visualization</h3>
                    <TimeSeriesChart 
                      data={report.datasets[0]} 
                      analysisResult={report.analyses[0] || undefined}
                      height={300}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Conclusions</h3>
                    <p className="text-muted-foreground">{report.conclusions}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>No Reports</CardTitle>
              <CardDescription>
                Create a report to save your analysis results and data visualizations.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center">
              <Button onClick={createSampleReport}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Current Data Preview</h2>
          <div className="space-y-6">
            <DataSummary data={data} />
            <TimeSeriesChart data={data} height={300} />
            <WideFormatDataTable data={data} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ReportsPage;
