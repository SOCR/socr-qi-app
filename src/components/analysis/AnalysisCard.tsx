
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisType, TimeSeriesData, AnalysisOptions } from "@/lib/types";
import { analyzeTimeSeries } from "@/lib/analysisUtils";
import { BarChart3, LineChart, Layers, Activity, AlertTriangle, TrendingUp, Sigma, BrainCircuit, Microscope, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface AnalysisCardProps {
  data?: TimeSeriesData;
  onAnalysisComplete: (result: any) => void;
}

const AnalysisCard = ({ data, onAnalysisComplete }: AnalysisCardProps) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("descriptive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({
    // Descriptive
    includeQuantiles: true,
    
    // Regression
    confidenceInterval: 0.95,
    regressionType: 'linear',
    
    // Classification
    threshold: data ? data.dataPoints.reduce((sum, p) => sum + p.value, 0) / 
                       (data.dataPoints.length || 1) : 50,
    
    // Forecasting
    windowSize: 3,
    forecastHorizon: 10,
    forecastMethod: 'movingAvg',
    
    // Anomaly Detection
    zScoreThreshold: 2,
    anomalyMethod: 'zscore',
    
    // Correlation
    correlationMethod: 'pearson',
    
    // Seasonal Decomposition
    periodLength: 12,
    
    // Clustering
    clusterCount: 3,
    clusterMethod: 'kmeans',
  });
  const { toast } = useToast();

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };
  
  const getAnalysisIcon = () => {
    switch (analysisType) {
      case "descriptive":
        return <BarChart3 className="h-5 w-5 mr-2" />;
      case "regression":
        return <TrendingUp className="h-5 w-5 mr-2" />;
      case "classification":
        return <Layers className="h-5 w-5 mr-2" />;
      case "forecasting":
        return <LineChart className="h-5 w-5 mr-2" />;
      case "anomaly":
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      case "correlation":
        return <GitBranch className="h-5 w-5 mr-2" />;
      case "seasonal":
        return <Sigma className="h-5 w-5 mr-2" />;
      case "clustering":
        return <BrainCircuit className="h-5 w-5 mr-2" />;
      case "changepoint":
        return <Microscope className="h-5 w-5 mr-2" />;
      default:
        return <Activity className="h-5 w-5 mr-2" />;
    }
  };
  
  const getAnalysisTitle = () => {
    switch (analysisType) {
      case "descriptive":
        return "Descriptive Statistics";
      case "regression":
        return "Regression Analysis";
      case "classification":
        return "Classification Analysis";
      case "forecasting":
        return "Forecasting Analysis";
      case "anomaly":
        return "Anomaly Detection";
      case "correlation":
        return "Correlation Analysis";
      case "seasonal":
        return "Seasonal Decomposition";
      case "clustering":
        return "Clustering Analysis";
      case "changepoint":
        return "Change Point Detection";
      default:
        return "Analysis";
    }
  };
  
  const getAnalysisDescription = () => {
    switch (analysisType) {
      case "descriptive":
        return "Calculate summary statistics for your data";
      case "regression":
        return "Perform regression analysis to identify trends";
      case "classification":
        return "Classify data points into categories";
      case "forecasting":
        return "Forecast future values based on historical data";
      case "anomaly":
        return "Detect anomalies and outliers in your data";
      case "correlation":
        return "Analyze relationships between data series";
      case "seasonal":
        return "Decompose data into trend, seasonal, and residual components";
      case "clustering":
        return "Group similar data points into clusters";
      case "changepoint":
        return "Detect significant changes in time series patterns";
      default:
        return "Analyze your time-series data";
    }
  };

  const handleAnalyze = async () => {
    if (!data) {
      toast({
        title: "No data available",
        description: "Please import or generate data first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Perform analysis
      const options: AnalysisOptions = {
        type: analysisType,
        parameters
      };
      
      const result = analyzeTimeSeries(data, options);
      
      // Pass the result to the parent component
      onAnalysisComplete(result);
      
      toast({
        title: "Analysis complete",
        description: `${getAnalysisTitle()} completed successfully`,
      });
    } catch (err) {
      console.error("Error performing analysis:", err);
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : "Failed to perform analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {getAnalysisIcon()}
          {getAnalysisTitle()}
        </CardTitle>
        <CardDescription>
          {getAnalysisDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="analysis-type">Analysis Type</Label>
            <Select 
              value={analysisType} 
              onValueChange={(value: AnalysisType) => setAnalysisType(value)}
            >
              <SelectTrigger id="analysis-type">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descriptive">Descriptive Statistics</SelectItem>
                <SelectItem value="regression">Regression Analysis</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="forecasting">Forecasting</SelectItem>
                <SelectItem value="anomaly">Anomaly Detection</SelectItem>
                <SelectItem value="correlation">Correlation Analysis</SelectItem>
                <SelectItem value="seasonal">Seasonal Decomposition</SelectItem>
                <SelectItem value="clustering">Clustering Analysis</SelectItem>
                <SelectItem value="changepoint">Change Point Detection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={analysisType} className="w-full">
            {/* Descriptive Statistics Parameters */}
            <TabsContent value="descriptive">
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">
                  Descriptive statistics provide summary metrics about your data.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeQuantiles" 
                    checked={parameters.includeQuantiles}
                    onCheckedChange={(checked) => 
                      handleParameterChange("includeQuantiles", checked)
                    }
                  />
                  <label 
                    htmlFor="includeQuantiles"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include quantiles (25%, 50%, 75%)
                  </label>
                </div>
              </div>
            </TabsContent>
            
            {/* Regression Analysis Parameters */}
            <TabsContent value="regression">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regressionType">Regression Type</Label>
                  <Select
                    value={parameters.regressionType}
                    onValueChange={(value) => handleParameterChange("regressionType", value)}
                  >
                    <SelectTrigger id="regressionType">
                      <SelectValue placeholder="Select regression type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="polynomial">Polynomial</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Confidence Interval: {parameters.confidenceInterval}</Label>
                  <Slider
                    value={[parameters.confidenceInterval]}
                    min={0.8}
                    max={0.99}
                    step={0.01}
                    onValueChange={(values) => handleParameterChange("confidenceInterval", values[0])}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Classification Parameters */}
            <TabsContent value="classification">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold Value</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={parameters.threshold}
                    onChange={(e) => handleParameterChange("threshold", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Values above this threshold will be classified as "High"
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Forecasting Parameters */}
            <TabsContent value="forecasting">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forecastMethod">Forecasting Method</Label>
                  <Select
                    value={parameters.forecastMethod}
                    onValueChange={(value) => handleParameterChange("forecastMethod", value)}
                  >
                    <SelectTrigger id="forecastMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movingAvg">Moving Average</SelectItem>
                      <SelectItem value="exponentialSmoothing">Exponential Smoothing</SelectItem>
                      <SelectItem value="arima">ARIMA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="windowSize">Window Size</Label>
                  <Input
                    id="windowSize"
                    type="number"
                    min="2"
                    max="20"
                    value={parameters.windowSize}
                    onChange={(e) => handleParameterChange("windowSize", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Number of points to use for calculating the moving average
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="forecastHorizon">Forecast Horizon</Label>
                  <Input
                    id="forecastHorizon"
                    type="number"
                    min="1"
                    max="50"
                    value={parameters.forecastHorizon}
                    onChange={(e) => handleParameterChange("forecastHorizon", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Number of future time periods to forecast
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Anomaly Detection Parameters */}
            <TabsContent value="anomaly">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="anomalyMethod">Detection Method</Label>
                  <Select
                    value={parameters.anomalyMethod}
                    onValueChange={(value) => handleParameterChange("anomalyMethod", value)}
                  >
                    <SelectTrigger id="anomalyMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zscore">Z-Score</SelectItem>
                      <SelectItem value="iqr">IQR (Interquartile Range)</SelectItem>
                      <SelectItem value="isolation">Isolation Forest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zScoreThreshold">Threshold</Label>
                  <Input
                    id="zScoreThreshold"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={parameters.zScoreThreshold}
                    onChange={(e) => handleParameterChange("zScoreThreshold", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Points with scores above this threshold will be flagged as anomalies
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Correlation Analysis Parameters */}
            <TabsContent value="correlation">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="correlationMethod">Correlation Method</Label>
                  <Select
                    value={parameters.correlationMethod}
                    onValueChange={(value) => handleParameterChange("correlationMethod", value)}
                  >
                    <SelectTrigger id="correlationMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pearson">Pearson</SelectItem>
                      <SelectItem value="spearman">Spearman</SelectItem>
                      <SelectItem value="kendall">Kendall</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Method used to calculate correlation between time series
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Seasonal Decomposition Parameters */}
            <TabsContent value="seasonal">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="periodLength">Period Length</Label>
                  <Input
                    id="periodLength"
                    type="number"
                    min="2"
                    value={parameters.periodLength}
                    onChange={(e) => handleParameterChange("periodLength", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Length of the seasonal period (e.g., 12 for monthly data with yearly seasonality)
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Clustering Parameters */}
            <TabsContent value="clustering">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clusterMethod">Clustering Method</Label>
                  <Select
                    value={parameters.clusterMethod}
                    onValueChange={(value) => handleParameterChange("clusterMethod", value)}
                  >
                    <SelectTrigger id="clusterMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kmeans">K-Means</SelectItem>
                      <SelectItem value="hierarchical">Hierarchical</SelectItem>
                      <SelectItem value="dbscan">DBSCAN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clusterCount">Number of Clusters</Label>
                  <Input
                    id="clusterCount"
                    type="number"
                    min="2"
                    max="10"
                    value={parameters.clusterCount}
                    onChange={(e) => handleParameterChange("clusterCount", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Change Point Detection Parameters */}
            <TabsContent value="changepoint">
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">
                  Detect significant changes in the time series data.
                </p>
                <p className="text-xs text-gray-400">
                  The algorithm will automatically identify major shifts in the data patterns.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !data}
        >
          {isAnalyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AnalysisCard;
