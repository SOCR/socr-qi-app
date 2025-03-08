
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { TimeSeriesData, AnalysisResult, Report } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, ArrowLeft, Download, Share2, Printer } from "lucide-react";
import { formatDate, generateId } from "@/lib/dataUtils";
import { useToast } from "@/hooks/use-toast";
import TimeSeriesChart from "@/components/visualizations/TimeSeriesChart";

const ReportsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get data and analysis results from location state
  const data = location.state?.data as TimeSeriesData | TimeSeriesData[] | undefined;
  const analysisResults = location.state?.analysisResults as AnalysisResult[] | undefined;
  
  const [reportTitle, setReportTitle] = useState("Quality Improvement Report");
  const [reportDescription, setReportDescription] = useState("Analysis of quality metrics over time");
  const [conclusions, setConclusions] = useState("");
  
  if (!data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No data available for report generation. Please import or generate data first.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Home
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  const dataArray = Array.isArray(data) ? data : [data];
  
  const handleGenerateReport = () => {
    // Create a report object
    const report: Report = {
      id: generateId(),
      title: reportTitle,
      description: reportDescription,
      createdAt: new Date().toISOString(),
      datasets: dataArray,
      analyses: analysisResults || [],
      conclusions: conclusions
    };
    
    // In a real app, you might save this to a database
    // For now, we'll just show a success toast
    toast({
      title: "Report Generated",
      description: "Your report has been successfully generated"
    });
    
    // Could download the report as JSON or PDF in a real app
    console.log("Generated report:", report);
  };
  
  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "Your report is being exported as PDF",
    });
    // In a real app, this would generate and download a PDF
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
    toast({
      title: "Share Report",
      description: "Sharing functionality would be implemented here",
    });
    // In a real app, this would open a share dialog
  };
  
  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Report Generation</h1>
            <p className="text-muted-foreground">Create comprehensive reports of your data analysis</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Report Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
              <CardDescription>Basic information about your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-title">Report Title</Label>
                <Input 
                  id="report-title" 
                  value={reportTitle} 
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-description">Description</Label>
                <Textarea 
                  id="report-description" 
                  value={reportDescription} 
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Created Date</Label>
                  <div className="mt-1 text-sm">{formatDate(new Date().toISOString())}</div>
                </div>
                <div>
                  <Label>Datasets</Label>
                  <div className="mt-1 text-sm">{dataArray.length} dataset(s) included</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Data Summary</CardTitle>
              <CardDescription>Overview of the included datasets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {dataArray.map((dataset, index) => (
                  <div key={dataset.id} className="border rounded-md p-4">
                    <h3 className="font-medium text-lg">{dataset.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{dataset.description || "No description provided"}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Data Points:</span> {dataset.dataPoints.length}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format:</span> {dataset.metadata?.format || "Unknown"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span> {dataset.metadata?.unit || "N/A"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span> {dataset.metadata?.source || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Visualizations */}
          <Card>
            <CardHeader>
              <CardTitle>Visualizations</CardTitle>
              <CardDescription>Visual representation of your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {dataArray.map((dataset) => (
                  <TimeSeriesChart 
                    key={dataset.id} 
                    data={dataset}
                    analysisResult={analysisResults?.find(result => result.timeSeriesId === dataset.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Analysis Results */}
          {analysisResults && analysisResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Summary of analyses performed on the data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResults.map((result) => (
                  <div key={result.id} className="border rounded-md p-4">
                    <h3 className="font-medium text-lg capitalize">{result.type} Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Performed on {formatDate(result.createdAt)}
                    </p>
                    
                    {/* Results will vary based on analysis type */}
                    {result.type === 'descriptive' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-muted-foreground text-sm">Mean:</span> 
                          <div className="font-medium">{result.results.mean?.toFixed(2) || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Median:</span> 
                          <div className="font-medium">{result.results.median?.toFixed(2) || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Min:</span> 
                          <div className="font-medium">{result.results.min?.toFixed(2) || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Max:</span> 
                          <div className="font-medium">{result.results.max?.toFixed(2) || "N/A"}</div>
                        </div>
                      </div>
                    )}
                    
                    {result.type === 'regression' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground text-sm">R-squared:</span> 
                          <div className="font-medium">{result.results.rSquared?.toFixed(4) || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Slope:</span> 
                          <div className="font-medium">{result.results.slope?.toFixed(4) || "N/A"}</div>
                        </div>
                      </div>
                    )}
                    
                    {result.type === 'anomaly' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground text-sm">Anomalies Detected:</span> 
                          <div className="font-medium">{result.results.anomalyCount || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Threshold:</span> 
                          <div className="font-medium">{result.results.threshold?.toFixed(2) || "N/A"}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Metrics if available */}
                    {result.metrics && Object.keys(result.metrics).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(result.metrics).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground text-xs capitalize">{key}:</span> 
                              <div className="font-medium text-sm">{typeof value === 'number' ? value.toFixed(4) : value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Conclusions */}
          <Card>
            <CardHeader>
              <CardTitle>Conclusions</CardTitle>
              <CardDescription>Summary of findings and action items</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Enter your conclusions and recommended actions based on this analysis..."
                value={conclusions}
                onChange={(e) => setConclusions(e.target.value)}
                rows={6}
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-between">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              <Button onClick={handleGenerateReport}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ReportsPage;
