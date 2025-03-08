
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult } from "@/lib/types";
import { BarChart3, LineChart, Layers, AlertTriangle, Activity } from "lucide-react";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const getIcon = () => {
    switch (result.type) {
      case "descriptive":
        return <BarChart3 className="h-5 w-5 mr-2" />;
      case "regression":
      case "forecasting":
        return <LineChart className="h-5 w-5 mr-2" />;
      case "classification":
        return <Layers className="h-5 w-5 mr-2" />;
      case "anomaly":
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      default:
        return <Activity className="h-5 w-5 mr-2" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {getIcon()}
              {result.type.charAt(0).toUpperCase() + result.type.slice(1)} Analysis Results
            </CardTitle>
            <CardDescription>
              Analysis performed at {formatDate(result.createdAt)}
            </CardDescription>
          </div>
          <Badge variant="secondary">{result.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm">{result.results.summary}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.metrics && Object.entries(result.metrics).map(([key, value]) => (
                <div key={key} className="p-4 bg-card border rounded-md">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {key.toUpperCase()}
                  </div>
                  <div className="text-2xl font-bold">
                    {typeof value === 'number' ? value.toFixed(4) : value}
                  </div>
                </div>
              ))}
              
              {/* Descriptive statistics metrics */}
              {result.type === 'descriptive' && (
                <>
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      COUNT
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.count}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      MEAN
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.mean.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      STANDARD DEVIATION
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.stdDev.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      MIN / MAX
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.min.toFixed(2)} / {result.results.max.toFixed(2)}
                    </div>
                  </div>
                </>
              )}
              
              {/* Regression metrics */}
              {result.type === 'regression' && (
                <>
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      SLOPE
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.slope.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      R-SQUARED
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.rSquared.toFixed(4)}
                    </div>
                  </div>
                </>
              )}
              
              {/* Anomaly detection metrics */}
              {result.type === 'anomaly' && (
                <>
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      ANOMALIES DETECTED
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.anomalyCount}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card border rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      ANOMALY PERCENTAGE
                    </div>
                    <div className="text-2xl font-bold">
                      {result.results.anomalyPercentage.toFixed(2)}%
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <div className="rounded-md border overflow-hidden">
              <pre className="bg-muted p-4 overflow-auto text-xs">
                {JSON.stringify(result.results, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalysisResults;
