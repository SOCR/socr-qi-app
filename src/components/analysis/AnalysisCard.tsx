
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
import { BarChart3, LineChart, Layers, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SeriesSelector from "./SeriesSelector";

interface AnalysisCardProps {
  data?: TimeSeriesData | TimeSeriesData[];
  onAnalysisComplete: (result: any) => void;
}

const AnalysisCard = ({ data, onAnalysisComplete }: AnalysisCardProps) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("descriptive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [targetSeries, setTargetSeries] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({
    // Regression
    confidenceInterval: 0.95,
    
    // Classification
    threshold: 50,
    
    // Forecasting
    windowSize: 3,
    forecastHorizon: 100, // Increased from 10 to 100 for longer forecasts
    
    // Anomaly Detection
    zScoreThreshold: 2,
    
    // Logistic Regression
    regularization: 0.1,
    
    // Poisson Regression
    linkFunction: 'log',
  });
  const { toast } = useToast();

  // Initialize threshold based on data if available
  React.useEffect(() => {
    if (!data) return;
    
    const mainSeries = Array.isArray(data) ? data[0] : data;
    if (mainSeries && mainSeries.dataPoints.length > 0) {
      const avgValue = mainSeries.dataPoints.reduce((sum, p) => sum + p.value, 0) / 
        mainSeries.dataPoints.length;
      
      setParameters(prev => ({ ...prev, threshold: avgValue }));
    }
    
    // Auto-select the first series as target if available
    if (mainSeries) {
      // Find all unique series IDs
      const seriesIds = new Set<string>();
      
      if (mainSeries.metadata?.format === 'wide' || mainSeries.dataPoints.some(p => p.seriesId)) {
        mainSeries.dataPoints.forEach(point => {
          if (point.seriesId) {
            seriesIds.add(point.seriesId);
          }
        });
      } else {
        seriesIds.add(mainSeries.name || 'Series 1');
      }
      
      const seriesArray = Array.from(seriesIds);
      if (seriesArray.length > 0) {
        setTargetSeries(seriesArray[0]);
        
        // Auto-select other series as predictors if there are more than one
        if (seriesArray.length > 1) {
          setSelectedSeries(seriesArray.slice(1));
        }
      }
    }
  }, [data]);

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };
  
  const getAnalysisIcon = () => {
    switch (analysisType) {
      case "descriptive":
        return <BarChart3 className="h-5 w-5 mr-2" />;
      case "regression":
      case "forecasting":
      case "logistic-regression":
      case "poisson-regression":
        return <TrendingUp className="h-5 w-5 mr-2" />;
      case "classification":
        return <Layers className="h-5 w-5 mr-2" />;
      case "anomaly":
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      default:
        return <Activity className="h-5 w-5 mr-2" />;
    }
  };
  
  const getAnalysisTitle = () => {
    switch (analysisType) {
      case "descriptive":
        return "Descriptive Statistics";
      case "regression":
        return "Linear Regression";
      case "classification":
        return "Classification Analysis";
      case "forecasting":
        return "Forecasting Analysis";
      case "anomaly":
        return "Anomaly Detection";
      case "logistic-regression":
        return "Logistic Regression";
      case "poisson-regression":
        return "Poisson Regression";
      default:
        return "Analysis";
    }
  };
  
  const getAnalysisDescription = () => {
    switch (analysisType) {
      case "descriptive":
        return "Calculate summary statistics for your data";
      case "regression":
        return "Perform linear regression analysis to identify trends";
      case "classification":
        return "Classify data points into categories";
      case "forecasting":
        return "Forecast future values based on historical data";
      case "anomaly":
        return "Detect anomalies and outliers in your data";
      case "logistic-regression":
        return "Model binary outcomes with logistic regression";
      case "poisson-regression":
        return "Model count data with Poisson regression";
      default:
        return "Analyze your time-series data";
    }
  };

  const needsMultipleSeries = () => {
    return ['regression', 'logistic-regression', 'poisson-regression'].includes(analysisType);
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

    // Check if a target series is selected when needed
    if (needsMultipleSeries() && !targetSeries) {
      toast({
        title: "No target series selected",
        description: "Please select a target series to predict",
        variant: "destructive",
      });
      return;
    }

    // For regression, we need at least one predictor
    if (needsMultipleSeries() && selectedSeries.length === 0) {
      toast({
        title: "No predictor series selected",
        description: "Please select at least one predictor series",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Perform analysis
      const options: AnalysisOptions = {
        type: analysisType,
        parameters: {
          ...parameters,
          targetSeries,
          predictorSeries: selectedSeries
        }
      };
      
      // Use the first series if multiple are provided
      const targetData = Array.isArray(data) ? data[0] : data;
      const result = analyzeTimeSeries(targetData, options);
      
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
                <SelectItem value="regression">Linear Regression</SelectItem>
                <SelectItem value="logistic-regression">Logistic Regression</SelectItem>
                <SelectItem value="poisson-regression">Poisson Regression</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="forecasting">Forecasting</SelectItem>
                <SelectItem value="anomaly">Anomaly Detection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Series Selector */}
          {data && (
            <SeriesSelector
              data={data}
              selectedSeries={selectedSeries}
              targetSeries={targetSeries}
              onSeriesSelect={setSelectedSeries}
              onTargetSelect={setTargetSeries}
            />
          )}
          
          <Tabs value={analysisType} className="w-full">
            {/* Descriptive Statistics Parameters */}
            <TabsContent value="descriptive">
              <p className="text-sm text-gray-500 mb-2">
                Descriptive statistics provide summary metrics about your data.
              </p>
              <p className="text-xs text-gray-400">
                No additional parameters required.
              </p>
            </TabsContent>
            
            {/* Linear Regression Analysis Parameters */}
            <TabsContent value="regression">
              <div className="space-y-4">
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
            
            {/* Logistic Regression Parameters */}
            <TabsContent value="logistic-regression">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regularization">Regularization (L2)</Label>
                  <Input
                    id="regularization"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={parameters.regularization}
                    onChange={(e) => handleParameterChange("regularization", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Higher values reduce overfitting but may decrease accuracy
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Classification Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={parameters.threshold || 0.5}
                    onChange={(e) => handleParameterChange("threshold", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Probability threshold for binary classification (default: 0.5)
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Poisson Regression Parameters */}
            <TabsContent value="poisson-regression">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkFunction">Link Function</Label>
                  <Select
                    value={parameters.linkFunction}
                    onValueChange={(value) => handleParameterChange("linkFunction", value)}
                  >
                    <SelectTrigger id="linkFunction">
                      <SelectValue placeholder="Select link function" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="log">Log (default)</SelectItem>
                      <SelectItem value="identity">Identity</SelectItem>
                      <SelectItem value="sqrt">Square Root</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Link function determines how predictors relate to response
                  </p>
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
                    Values above this threshold will be classified as "High" (e.g., "High Risk"), values below will be "Low" (e.g., "Low Risk")
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Forecasting Parameters */}
            <TabsContent value="forecasting">
              <div className="space-y-4">
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
                    max="1000"
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
                  <Label htmlFor="zScoreThreshold">Z-Score Threshold</Label>
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
                    Points with Z-scores above this threshold (in absolute value) will be flagged as anomalies
                  </p>
                </div>
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
