import React, { useMemo, useState, useCallback } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush
} from "recharts";
import { formatDate } from "@/lib/dataUtils";
import { Maximize, Minimize, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeSeriesChartProps {
  data: TimeSeriesData | TimeSeriesData[];
  analysisResult?: AnalysisResult;
  title?: string;
  description?: string;
  height?: number;
}

// Color palette for multiple series
const COLORS = [
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#D946EF", // Fuchsia
];

// Define chart data type to avoid TypeScript errors
interface ChartDataPoint {
  timestamp: number;
  formattedTime: string;
  [key: string]: any; // For dynamic series values
}

const TimeSeriesChart = ({ 
  data, 
  analysisResult, 
  title, 
  description,
  height = 300
}: TimeSeriesChartProps) => {
  const [zoomDomain, setZoomDomain] = useState<null | { x: [number, number], y: [number, number] }>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Prepare chart data by combining all time series data points
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const timeMap = new Map<number, ChartDataPoint>();
    const allSeries = Array.isArray(data) ? data : [data];
    
    // Process each time series
    allSeries.forEach((series, seriesIndex) => {
      // For each data point, organize by timestamp
      series.dataPoints.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime();
        
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {
            timestamp,
            formattedTime: formatDate(point.timestamp),
          });
        }
        
        // Get existing point at this timestamp
        const existingPoint = timeMap.get(timestamp)!;
        
        // Determine the series key to use
        let seriesKey: string;
        
        if (point.seriesId) {
          // If the point has a seriesId, use that (for wide format)
          seriesKey = point.seriesId;
        } else if (series.name) {
          // If the series has a name, use that
          seriesKey = series.name;
        } else {
          // Otherwise, generate a default name
          seriesKey = `Series ${seriesIndex + 1}`;
        }
        
        // Add the value for this series at this timestamp
        existingPoint[seriesKey] = point.value;
        
        // If we have analysis results for this series, add predictions/anomalies
        if (analysisResult && 
            (analysisResult.timeSeriesId === series.id || 
             (analysisResult.targetSeries && analysisResult.targetSeries === seriesKey))) {
          
          switch (analysisResult.type) {
            case 'regression':
            case 'logistic-regression':
            case 'poisson-regression':
              // Add predicted values if available in analysis results
              const prediction = analysisResult.results.predictions?.[timeMap.size - 1];
              if (prediction !== undefined) {
                existingPoint[`${seriesKey}_predicted`] = prediction;
              }
              break;
              
            case 'anomaly':
              // Mark anomalies if available
              const anomalyInfo = analysisResult.results.anomalies?.find(
                (a: any) => new Date(a.timestamp).getTime() === timestamp
              );
              if (anomalyInfo?.isAnomaly) {
                existingPoint[`${seriesKey}_anomaly`] = point.value;
                existingPoint[`${seriesKey}_zScore`] = anomalyInfo.zScore;
              }
              break;
          }
        }
      });
    });
    
    // Convert map to array and sort by timestamp
    const formattedData = Array.from(timeMap.values());
    return formattedData.sort((a, b) => a.timestamp - b.timestamp);
  }, [data, analysisResult]);
  
  // Get all unique series names/keys by examining the data points
  const seriesKeys = useMemo(() => {
    const keys = new Set<string>();
    
    // Collect all series keys from data points
    if (Array.isArray(data)) {
      data.forEach(series => {
        series.dataPoints.forEach(point => {
          if (point.seriesId) {
            keys.add(point.seriesId);
          } else {
            keys.add(series.name || `Series ${data.indexOf(series) + 1}`);
          }
        });
      });
    } else if (data) {
      data.dataPoints.forEach(point => {
        if (point.seriesId) {
          keys.add(point.seriesId);
        } else {
          keys.add(data.name || 'Series 1');
        }
      });
    }
    
    return Array.from(keys);
  }, [data]);
  
  // Handle zoom reset
  const handleResetZoom = useCallback(() => {
    setZoomDomain(null);
    setIsZoomed(false);
  }, []);
  
  // Handle brush change (time window selection)
  const handleBrushChange = useCallback((domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setIsZoomed(true);
    }
  }, []);
  
  // Display multiple series and create a name for the chart
  const chartTitle = useMemo(() => {
    if (title) return title;
    if (Array.isArray(data)) {
      if (data.length === 1) return data[0].name;
      return `Multiple Time Series (${data.length})`;
    }
    return data.name;
  }, [title, data]);
  
  // Create description based on data
  const chartDescription = useMemo(() => {
    if (description) return description;
    
    const allSeries = Array.isArray(data) ? data : [data];
    const totalPoints = allSeries.reduce(
      (sum, series) => sum + series.dataPoints.length, 
      0
    );
    
    return `${totalPoints} data points across ${seriesKeys.length} series${
      allSeries[0]?.metadata?.unit ? ` (${allSeries[0].metadata.unit})` : ''
    }`;
  }, [description, data, seriesKeys]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{chartTitle}</CardTitle>
            <CardDescription>{chartDescription}</CardDescription>
          </div>
          {isZoomed && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="flex items-center gap-1"
            >
              <Maximize className="h-4 w-4" />
              <span>Reset Zoom</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            onMouseUp={(e) => {
              if (e && e.xAxisMap && e.yAxisMap) {
                // Only set zoom if actually zoomed in
                if (e.xAxisMap[0].domain && e.yAxisMap[0].domain) {
                  setIsZoomed(true);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              domain={zoomDomain?.x || ['auto', 'auto']}
              allowDataOverflow={isZoomed}
            />
            <YAxis
              domain={zoomDomain?.y || ['auto', 'auto']}
              allowDataOverflow={isZoomed}
            />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value, name) => {
                // Check if name is a string before applying string methods
                const seriesName = typeof name === 'string' ? 
                  (name.includes('_predicted') ? 
                    name.split('_predicted')[0] + ' (Predicted)' : 
                    name
                  ) : 
                  name;
                return [value, seriesName];
              }}
            />
            <Legend />
            
            {/* Time windowing with brush */}
            <Brush 
              dataKey="formattedTime" 
              height={30} 
              stroke="#8884d8"
              onChange={handleBrushChange}
            />
            
            {/* Render a line for each series */}
            {seriesKeys.map((seriesKey, index) => (
              <Line 
                key={seriesKey}
                type="monotone" 
                dataKey={seriesKey} 
                name={seriesKey}
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length], stroke: 'none' }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            ))}
            
            {/* Render prediction lines if available */}
            {analysisResult?.type.includes('regression') && 
              (analysisResult.targetSeries ? [analysisResult.targetSeries] : seriesKeys).map((seriesKey, index) => (
                <Line 
                  key={`${seriesKey}_predicted`}
                  type="monotone" 
                  dataKey={`${seriesKey}_predicted`}
                  name={`${seriesKey} (Predicted)`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              ))
            }
            
            {/* Reference lines for anomaly detection */}
            {analysisResult?.type === 'anomaly' && analysisResult.results.mean !== undefined && (
              <ReferenceLine 
                y={analysisResult.results.mean} 
                stroke="rgba(102, 102, 102, 0.7)" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Mean: ${analysisResult.results.mean.toFixed(2)}`, 
                  position: 'insideTopLeft',
                  fill: '#666666',
                  fontSize: 12
                }} 
              />
            )}
            
            {analysisResult?.type === 'anomaly' && analysisResult.results.threshold !== undefined && (
              <ReferenceLine 
                y={analysisResult.results.threshold} 
                stroke="rgba(255, 99, 71, 0.7)" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `Threshold: ${analysisResult.results.threshold.toFixed(2)}`, 
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
