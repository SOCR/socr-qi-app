
import React, { useMemo, useState, useRef } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush, ZoomIn, ZoomOut
} from "recharts";
import { formatDate } from "@/lib/dataUtils";
import { Button } from "@/components/ui/button";
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, RefreshCw } from "lucide-react";

interface TimeSeriesChartProps {
  data: TimeSeriesData;
  analysisResult?: AnalysisResult;
  title?: string;
  description?: string;
  height?: number;
}

// Define chart data type to avoid TypeScript errors
interface ChartDataPoint {
  timestamp: number;
  formattedTime: string;
  [key: string]: any; // Allow dynamic series names as properties
}

// Color palette for multiple series
const COLORS = [
  "#3788C7", "#FF6347", "#32CD32", "#FFD700", "#9370DB", 
  "#20B2AA", "#FF69B4", "#8A2BE2", "#00CED1", "#FF7F50"
];

const TimeSeriesChart = ({ 
  data, 
  analysisResult, 
  title, 
  description,
  height = 300
}: TimeSeriesChartProps) => {
  const [zoomDomain, setZoomDomain] = useState<{ start: number; end: number } | null>(null);
  const chartRef = useRef<any>(null);
  
  // Prepare chart data to support multiple series in wide format
  const chartData = useMemo<ChartDataPoint[]>(() => {
    // For wide format data (multiple series in columns)
    if (data.metadata?.format === 'wide') {
      // Extract all unique series IDs from the dataPoints
      const seriesIds = new Set<string>();
      data.dataPoints.forEach(point => {
        if (point.seriesId) {
          seriesIds.add(point.seriesId);
        }
      });
      
      // Group data points by timestamp
      const groupedByTimestamp: { [key: string]: ChartDataPoint } = {};
      
      data.dataPoints.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime();
        if (!groupedByTimestamp[timestamp]) {
          groupedByTimestamp[timestamp] = {
            timestamp,
            formattedTime: formatDate(point.timestamp)
          };
        }
        
        if (point.seriesId) {
          groupedByTimestamp[timestamp][point.seriesId] = point.value;
        }
      });
      
      // Convert to array and sort by timestamp
      const formattedData = Object.values(groupedByTimestamp);
      formattedData.sort((a, b) => a.timestamp - b.timestamp);
      
      return formattedData;
    } else {
      // For regular time series (single series)
      const formattedData = data.dataPoints.map(point => {
        const chartPoint: ChartDataPoint = {
          timestamp: new Date(point.timestamp).getTime(),
          formattedTime: formatDate(point.timestamp),
          value: point.value
        };
        
        if (point.category) chartPoint.category = point.category;
        if (point.seriesId) chartPoint.seriesId = point.seriesId;
        
        return chartPoint;
      });
      
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
                  value: 0,
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
                  value: 0,
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

          case 'logistic':
          case 'poisson':
            if (analysisResult.results.predictions) {
              formattedData.forEach((point, index) => {
                if (index < analysisResult.results.predictions.length) {
                  point.predicted = analysisResult.results.predictions[index];
                }
              });
            }
            break;
        }
      }
      
      return formattedData;
    }
  }, [data, analysisResult]);
  
  // Extract series keys from the first data point (excluding timestamp and formattedTime)
  const seriesKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const firstPoint = chartData[0];
    return Object.keys(firstPoint).filter(key => 
      key !== 'timestamp' && key !== 'formattedTime' && 
      key !== 'category' && key !== 'isAnomaly' && 
      key !== 'zScore' && key !== 'isForecast'
    );
  }, [chartData]);
  
  // Determine if we should show anomalies
  const showAnomalies = useMemo(() => {
    return analysisResult?.type === 'anomaly' && 
           chartData.some(point => point.isAnomaly);
  }, [analysisResult, chartData]);
  
  // Determine if we should show predictions
  const showPredictions = useMemo(() => {
    return (analysisResult?.type === 'regression' || 
            analysisResult?.type === 'forecasting' || 
            analysisResult?.type === 'logistic' || 
            analysisResult?.type === 'poisson') && 
           chartData.some(point => point.predicted !== undefined);
  }, [analysisResult, chartData]);
  
  // Determine if we should show forecast
  const showForecast = useMemo(() => {
    return chartData.some(point => point.isForecast);
  }, [chartData]);
  
  // Get the mean and threshold values for reference lines if available
  const mean = analysisResult?.results?.mean;
  const threshold = analysisResult?.results?.threshold;

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (!chartData.length) return;
    
    if (zoomDomain) {
      // Calculate new domain by zooming in 25%
      const range = zoomDomain.end - zoomDomain.start;
      const quarter = range / 4;
      setZoomDomain({
        start: zoomDomain.start + quarter,
        end: zoomDomain.end - quarter
      });
    } else {
      // Initial zoom from full view
      const minTime = chartData[0].timestamp;
      const maxTime = chartData[chartData.length - 1].timestamp;
      const range = maxTime - minTime;
      const quarter = range / 4;
      
      setZoomDomain({
        start: minTime + quarter,
        end: maxTime - quarter
      });
    }
  };
  
  const handleZoomOut = () => {
    if (!chartData.length) return;
    
    if (zoomDomain) {
      // Calculate new domain by zooming out 33%
      const range = zoomDomain.end - zoomDomain.start;
      const third = range / 3;
      
      const minTime = chartData[0].timestamp;
      const maxTime = chartData[chartData.length - 1].timestamp;
      
      const newStart = Math.max(minTime, zoomDomain.start - third);
      const newEnd = Math.min(maxTime, zoomDomain.end + third);
      
      if (newStart === minTime && newEnd === maxTime) {
        // Reset zoom if we're showing almost everything
        setZoomDomain(null);
      } else {
        setZoomDomain({
          start: newStart,
          end: newEnd
        });
      }
    }
  };
  
  const resetZoom = () => {
    setZoomDomain(null);
  };
  
  // Handle brush change
  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const start = chartData[domain.startIndex]?.timestamp;
      const end = chartData[domain.endIndex]?.timestamp;
      
      if (start && end) {
        setZoomDomain({ start, end });
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title || data.name}</CardTitle>
            <CardDescription>
              {description || `${data.dataPoints.length} data points${data.metadata?.unit ? ` (${data.metadata.unit})` : ''}`}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomInIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOutIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetZoom}
              title="Reset Zoom"
              disabled={!zoomDomain}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            ref={chartRef}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              domain={zoomDomain ? [zoomDomain.start, zoomDomain.end] : ['auto', 'auto']}
              type="number"
              scale="time"
              tickFormatter={(timestamp) => {
                if (typeof timestamp === 'number') {
                  return formatDate(new Date(timestamp).toISOString());
                }
                return timestamp;
              }}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              allowDataOverflow={true}
            />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value, name) => {
                if (name === 'value') return [`${value}${data.metadata?.unit ? ` ${data.metadata.unit}` : ''}`, 'Actual'];
                if (name === 'predicted') return [`${value}${data.metadata?.unit ? ` ${data.metadata.unit}` : ''}`, 'Predicted'];
                return [value, name];
              }}
            />
            <Legend />
            
            <Brush 
              dataKey="timestamp" 
              height={30} 
              stroke="#8884d8"
              onChange={handleBrushChange}
              tickFormatter={(timestamp) => {
                if (typeof timestamp === 'number') {
                  return formatDate(new Date(timestamp).toISOString());
                }
                return timestamp;
              }}
            />
            
            {/* Render lines for all series keys */}
            {seriesKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key === 'value' ? 'Value' : key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={key === 'value' && showAnomalies ? (props) => {
                  const { cx, cy, payload } = props;
                  // Highlight anomalies if available
                  if (payload.isAnomaly) {
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
                  return <circle cx={cx} cy={cy} r={3} fill={COLORS[index % COLORS.length]} stroke="none" />;
                } : { r: 3 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={1000}
                connectNulls={true}
              />
            ))}
            
            {/* Show prediction line if available */}
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
                connectNulls={true}
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
