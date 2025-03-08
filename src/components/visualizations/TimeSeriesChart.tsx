
import React, { useMemo } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatDate } from "@/lib/dataUtils";

interface TimeSeriesChartProps {
  data: TimeSeriesData;
  analysisResult?: AnalysisResult;
  title?: string;
  description?: string;
  height?: number;
}

const TimeSeriesChart = ({ 
  data, 
  analysisResult, 
  title, 
  description,
  height = 300
}: TimeSeriesChartProps) => {
  
  // Prepare chart data by combining the original data points with any analysis data
  const chartData = useMemo(() => {
    const formattedData = data.dataPoints.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      formattedTime: formatDate(point.timestamp),
      value: point.value,
      category: point.category
    }));
    
    // Sort by timestamp
    formattedData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Add analysis predictions if available
    if (analysisResult) {
      switch (analysisResult.type) {
        case 'regression':
          formattedData.forEach((point, index) => {
            if (index < analysisResult.results.predictions.length) {
              point.predicted = analysisResult.results.predictions[index];
            }
          });
          
          // Add forecast points to the chart data
          if (analysisResult.results.forecastPoints) {
            analysisResult.results.forecastPoints.forEach(forecastPoint => {
              formattedData.push({
                timestamp: new Date(forecastPoint.timestamp).getTime(),
                formattedTime: formatDate(forecastPoint.timestamp),
                predicted: forecastPoint.value,
                isForecast: true
              });
            });
          }
          break;
          
        case 'forecasting':
          const movingAverages = analysisResult.results.movingAverages;
          
          // Match predictions with actual data points
          movingAverages.forEach(avgPoint => {
            const timestamp = new Date(avgPoint.timestamp).getTime();
            const existingPoint = formattedData.find(p => p.timestamp === timestamp);
            
            if (existingPoint) {
              existingPoint.predicted = avgPoint.predicted;
            } else if (avgPoint.predicted !== undefined) {
              // This is a forecast point
              formattedData.push({
                timestamp,
                formattedTime: formatDate(avgPoint.timestamp),
                predicted: avgPoint.predicted,
                isForecast: true
              });
            }
          });
          break;
          
        case 'anomaly':
          const anomalies = analysisResult.results.anomalies;
          
          anomalies.forEach(anomalyPoint => {
            const timestamp = new Date(anomalyPoint.timestamp).getTime();
            const existingPoint = formattedData.find(p => p.timestamp === timestamp);
            
            if (existingPoint) {
              existingPoint.isAnomaly = anomalyPoint.isAnomaly;
              existingPoint.zScore = anomalyPoint.zScore;
            }
          });
          break;
      }
    }
    
    return formattedData;
  }, [data, analysisResult]);
  
  // Determine if we should show anomalies
  const showAnomalies = useMemo(() => {
    return analysisResult?.type === 'anomaly' && 
           chartData.some(point => point.isAnomaly);
  }, [analysisResult, chartData]);
  
  // Determine if we should show predictions
  const showPredictions = useMemo(() => {
    return (analysisResult?.type === 'regression' || analysisResult?.type === 'forecasting') && 
           chartData.some(point => point.predicted !== undefined);
  }, [analysisResult, chartData]);
  
  // Determine if we should show forecast
  const showForecast = useMemo(() => {
    return chartData.some(point => point.isForecast);
  }, [chartData]);
  
  // Get the mean and threshold values for reference lines if available
  const mean = analysisResult?.results?.mean;
  const threshold = analysisResult?.results?.threshold;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || data.name}</CardTitle>
        <CardDescription>
          {description || `${data.dataPoints.length} data points${data.metadata?.unit ? ` (${data.metadata.unit})` : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value, name) => {
                if (name === 'value') return [`${value}${data.metadata?.unit ? ` ${data.metadata.unit}` : ''}`, 'Actual'];
                if (name === 'predicted') return [`${value}${data.metadata?.unit ? ` ${data.metadata.unit}` : ''}`, 'Predicted'];
                return [value, name];
              }}
            />
            <Legend />
            
            {/* Actual data line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3788C7" 
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                // Highlight anomalies if available
                if (showAnomalies && payload.isAnomaly) {
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={5} 
                      fill="red" 
                      stroke="none" 
                    />
                  );
                }
                return <circle cx={cx} cy={cy} r={3} fill="#3788C7" stroke="none" />;
              }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
              animationDuration={1000}
            />
            
            {/* Prediction line (if available) */}
            {showPredictions && (
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#55A5DA" 
                strokeWidth={2}
                strokeDasharray={showForecast ? "0" : "0"}
                dot={(props) => {
                  // Only show dots for forecast points
                  const { cx, cy, payload } = props;
                  if (payload.isForecast) {
                    return <circle cx={cx} cy={cy} r={3} fill="#55A5DA" stroke="none" />;
                  }
                  return null;
                }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
            
            {/* Reference lines */}
            {mean !== undefined && (
              <ReferenceLine 
                y={mean} 
                stroke="rgba(102, 102, 102, 0.7)" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Mean: ${mean.toFixed(2)}`, 
                  position: 'insideTopLeft',
                  fill: '#666666',
                  fontSize: 12
                }} 
              />
            )}
            
            {threshold !== undefined && (
              <ReferenceLine 
                y={threshold} 
                stroke="rgba(255, 99, 71, 0.7)" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Threshold: ${threshold.toFixed(2)}`, 
                  position: 'insideBottomLeft',
                  fill: '#FF6347',
                  fontSize: 12
                }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
