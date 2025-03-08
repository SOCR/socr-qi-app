
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
import { BarChart3, LineChart, Layers, Activity, AlertTriangle, TrendingUp, BarChart, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisCardProps {
  data?: TimeSeriesData;
  onAnalysisComplete: (result: any) => void;
}

const AnalysisCard = ({ data, onAnalysisComplete }: AnalysisCardProps) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("descriptive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({
    // Regression
    confidenceInterval: 0.95,
    
    // Classification
    threshold: data ? data.dataPoints.reduce((sum, p) => sum + p.value, 0) / 
                       (data.dataPoints.length || 1) : 50,
    
    // Forecasting
    windowSize: 3,
    forecastHorizon: 10,
    
    // Anomaly Detection
    zScoreThreshold: 2,
    
    // Logistic Regression
    decisionThreshold: 0.5,
    
    // Poisson Regression
    poissonLambda: 1.0,
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
      case "forecasting":
        return <LineChart className="h-5 w-5 mr-2" />;
      case "classification":
        return <Layers className="h-5 w-5 mr-2" />;
      case "anomaly":
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      case "logistic":
        return <Box className="h-5 w-5 mr-2" />;
      case "poisson":
        return <BarChart className="h-5 w-5 mr-2" />;
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
        return "Time Series Forecasting";
      case "anomaly":
        return "Anomaly Detection";
      case "logistic":
        return "Logistic Regression";
      case "poisson":
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
      case "logistic":
        return "Binary outcome prediction for probability estimation";
      case "poisson":
        return "Model count data and rare event occurrences";
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
                <SelectItem value="regression">Linear Regression</SelectItem>
                <SelectItem value="logistic">Logistic Regression</SelectItem>
                <SelectItem value="poisson">Poisson Regression</SelectItem>
                <SelectItem value="classification">Classification</SelectItem>
                <SelectItem value="forecasting">Time Series Forecasting</SelectItem>
                <SelectItem value="anomaly">Anomaly Detection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
            
            {/* Regression Analysis Parameters */}
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
            <TabsContent value="logistic">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Decision Threshold: {parameters.decisionThreshold}</Label>
                  <Slider
                    value={[parameters.decisionThreshold]}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    onValueChange={(values) => handleParameterChange("decisionThreshold", values[0])}
                  />
                  <p className="text-xs text-gray-400">
                    Probability threshold for binary classification decisions
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Poisson Regression Parameters */}
            <TabsContent value="poisson">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poissonLambda">Lambda Value</Label>
                  <Input
                    id="poissonLambda"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={parameters.poissonLambda}
                    onChange={(e) => handleParameterChange("poissonLambda", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Initial lambda parameter for the Poisson distribution
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
                    Values above this threshold will be classified as "High"
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
