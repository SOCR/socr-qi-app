
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Zap, FileBarChart } from "lucide-react";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const { type, metrics, results, createdAt } = result;
  
  // Format analysis type for display
  const getDisplayType = (type: string) => {
    switch (type) {
      case 'descriptive': return 'Descriptive Statistics';
      case 'regression': return 'Linear Regression';
      case 'logistic-regression': return 'Logistic Regression';
      case 'poisson-regression': return 'Poisson Regression';
      case 'classification': return 'Classification';
      case 'forecasting': return 'Forecasting';
      case 'anomaly': return 'Anomaly Detection';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Determine card accent color based on analysis type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'descriptive': return 'bg-blue-50 border-blue-200';
      case 'regression': 
      case 'logistic-regression':
      case 'poisson-regression':
        return 'bg-purple-50 border-purple-200';
      case 'classification': return 'bg-green-50 border-green-200';
      case 'forecasting': return 'bg-amber-50 border-amber-200';
      case 'anomaly': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Get icon based on analysis type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'descriptive': return <FileBarChart className="h-5 w-5 text-blue-500" />;
      case 'regression': 
      case 'logistic-regression':
      case 'poisson-regression':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'classification': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'forecasting': return <TrendingDown className="h-5 w-5 text-amber-500" />;
      case 'anomaly': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <Card className={`border-2 ${getTypeColor(type)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon(type)}
            <CardTitle>{getDisplayType(type)}</CardTitle>
          </div>
          <Badge variant="outline">
            {new Date(createdAt).toLocaleString()}
          </Badge>
        </div>
        <CardDescription>
          Analysis ID: {result.id.substring(0, 8)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {type === 'descriptive' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['count', 'mean', 'median', 'min', 'max', 'stdDev'].map(stat => (
              <div key={stat} className="bg-white p-2 rounded border">
                <div className="text-xs text-gray-500 capitalize">
                  {stat === 'stdDev' ? 'Std. Deviation' : stat}
                </div>
                <div className="text-lg font-medium">
                  {results[stat]?.toFixed?.(2) ?? 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {(type === 'regression' || type === 'logistic-regression' || type === 'poisson-regression') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {type === 'regression' && [
                { key: 'slope', label: 'Slope' },
                { key: 'intercept', label: 'Intercept' },
                { key: 'rSquared', label: 'R²' },
                { key: 'mse', label: 'MSE' },
                { key: 'rmse', label: 'RMSE' },
                { key: 'mae', label: 'MAE' }
              ].map(({ key, label }) => (
                <div key={key} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-lg font-medium">
                    {(metrics?.[key] ?? results[key])?.toFixed?.(4) ?? 'N/A'}
                  </div>
                </div>
              ))}
              
              {type === 'logistic-regression' && [
                { key: 'accuracy', label: 'Accuracy' },
                { key: 'auc', label: 'AUC' },
                { key: 'precision', label: 'Precision' },
                { key: 'recall', label: 'Recall' },
                { key: 'f1Score', label: 'F1 Score' },
                { key: 'deviance', label: 'Deviance' }
              ].map(({ key, label }) => (
                <div key={key} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-lg font-medium">
                    {(metrics?.[key] ?? results[key])?.toFixed?.(4) ?? 'N/A'}
                  </div>
                </div>
              ))}
              
              {type === 'poisson-regression' && [
                { key: 'deviance', label: 'Deviance' },
                { key: 'pseudoRSquared', label: 'Pseudo R²' },
                { key: 'dispersion', label: 'Dispersion' },
                { key: 'aic', label: 'AIC' },
                { key: 'bic', label: 'BIC' },
                { key: 'mae', label: 'MAE' }
              ].map(({ key, label }) => (
                <div key={key} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-lg font-medium">
                    {(metrics?.[key] ?? results[key])?.toFixed?.(4) ?? 'N/A'}
                  </div>
                </div>
              ))}
            </div>
            
            {results.equation && (
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500 mb-1">Equation</div>
                <div className="font-mono text-sm overflow-x-auto whitespace-nowrap">
                  {results.equation}
                </div>
              </div>
            )}
          </div>
        )}
        
        {type === 'anomaly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['threshold', 'anomalyCount', 'anomalyPercent', 'mean', 'stdDev'].map(key => (
                <div key={key} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500 capitalize">
                    {key === 'anomalyCount' ? 'Anomalies Count' :
                     key === 'anomalyPercent' ? 'Anomalies %' :
                     key === 'stdDev' ? 'Std. Deviation' : key}
                  </div>
                  <div className="text-lg font-medium">
                    {key === 'anomalyPercent' 
                      ? `${(results[key] * 100).toFixed(2)}%` 
                      : results[key]?.toFixed?.(2) ?? 'N/A'}
                  </div>
                </div>
              ))}
            </div>
            
            {results.anomalies && results.anomalies.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">
                  {results.anomalies.length} anomalies detected
                </div>
              </div>
            )}
          </div>
        )}
        
        {type === 'forecasting' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['mse', 'rmse', 'mae', 'forecastPeriod'].map(key => (
                <div key={key} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500 capitalize">
                    {key === 'forecastPeriod' ? 'Forecast Period' : key.toUpperCase()}
                  </div>
                  <div className="text-lg font-medium">
                    {key === 'forecastPeriod' 
                      ? `${results[key]} points` 
                      : (metrics?.[key] ?? results[key])?.toFixed?.(4) ?? 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-sm text-muted-foreground pt-0">
        {type === 'descriptive' && 'Basic statistical metrics of the time series data.'}
        {type === 'regression' && 'Linear relationship between time and values.'}
        {type === 'logistic-regression' && 'Logistic regression model for binary outcomes.'}
        {type === 'poisson-regression' && 'Poisson model for count/rate data over time.'}
        {type === 'anomaly' && 'Points that deviate significantly from normal patterns.'}
        {type === 'forecasting' && 'Prediction of future values based on past trends.'}
      </CardFooter>
    </Card>
  );
};

export default AnalysisResults;
