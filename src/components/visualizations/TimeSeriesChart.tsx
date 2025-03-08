
import React, { useMemo, useState } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ZoomOutMap
} from "recharts";
import { formatDate } from "@/lib/dataUtils";
import { Maximize, Minimize, ZoomIn } from "lucide-react";

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
      const seriesName = series.name || `Series ${seriesIndex + 1}`;
      
      series.dataPoints.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime();
        
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {
            timestamp,
            formattedTime: formatDate(point.timestamp),
          });
        }
        
        // Add the value for this series at this timestamp
        const existingPoint = timeMap.get(timestamp)!;
        existingPoint[seriesName] = point.value;
        
        // If we have analysis results for this series, add predictions/anomalies
        if (analysisResult && analysisResult.timeSeriesId === series.id) {
          switch (analysisResult.type) {
            case 'regression':
            case 'logistic-regression':
            case 'poisson-regression':
              // Add predicted values if available in analysis results
              const prediction = analysisResult.results.predictions?.[seriesIndex];
              if (prediction !== undefined) {
                existingPoint[`${seriesName}_predicted`] = prediction;
              }
              break;
              
            case 'anomaly':
              // Mark anomalies if available
              const anomalyInfo = analysisResult.results.anomalies?.find(
                (a: any) => new Date(a.timestamp).getTime() === timestamp
              );
              if (anomalyInfo?.isAnomaly) {
                existingPoint[`${seriesName}_anomaly`] = point.value;
                existingPoint[`${seriesName}_zScore`] = anomalyInfo.zScore;
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
  
  // Get all unique series names
  const seriesNames = useMemo(() => {
    const allSeries = Array.isArray(data) ? data : [data];
    return allSeries.map(series => series.name || `Series ${allSeries.indexOf(series) + 1}`);
  }, [data]);
  
  // Handle zoom reset
  const handleResetZoom = () => {
    setZoomDomain(null);
    setIsZoomed(false);
  };
  
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
    
    return `${totalPoints} data points across ${allSeries.length} series${
      allSeries[0]?.metadata?.unit ? ` (${allSeries[0].metadata.unit})` : ''
    }`;
  }, [description, data]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{chartTitle}</CardTitle>
            <CardDescription>{chartDescription}</CardDescription>
          </div>
          <button 
            onClick={handleResetZoom} 
            className={`p-1 rounded hover:bg-gray-100 ${!isZoomed ? 'text-gray-400 cursor-default' : 'text-gray-700'}`}
            disabled={!isZoomed}
          >
            {isZoomed ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
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
                if (e.xAxisMap[0].domain.toString() !== e.xAxisMap[0].niceTicks.toString() ||
                    e.yAxisMap[0].domain.toString() !== e.yAxisMap[0].niceTicks.toString()) {
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
                const series = seriesNames.find(series => name === series || name.startsWith(`${series}_`));
                return [value, series || name];
              }}
            />
            <Legend />
            
            {/* Render a line for each series */}
            {seriesNames.map((seriesName, index) => (
              <Line 
                key={seriesName}
                type="monotone" 
                dataKey={seriesName} 
                name={seriesName}
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length], stroke: 'none' }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            ))}
            
            {/* Render prediction lines if available */}
            {analysisResult?.type.includes('regression') && seriesNames.map((seriesName, index) => (
              <Line 
                key={`${seriesName}_predicted`}
                type="monotone" 
                dataKey={`${seriesName}_predicted`}
                name={`${seriesName} (Predicted)`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                animationDuration={1000}
              />
            ))}
            
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
