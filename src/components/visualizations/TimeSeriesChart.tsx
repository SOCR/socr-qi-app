
import React, { useMemo, useRef } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush, ZoomOutMap
} from "recharts";
import { formatDate } from "@/lib/dataUtils";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  [key: string]: any; // Allow dynamic series keys
}

// Define a color palette for different series
const CHART_COLORS = [
  "#3788C7", "#FF6347", "#55A5DA", "#2E8B57", "#9370DB", 
  "#F08080", "#6495ED", "#FFA07A", "#20B2AA", "#BA55D3",
  "#4682B4", "#FF7F50", "#87CEFA", "#3CB371", "#9932CC"
];

const TimeSeriesChart = ({ 
  data, 
  analysisResult, 
  title, 
  description,
  height = 300
}: TimeSeriesChartProps) => {
  const chartRef = useRef<any>(null);
  const [zoomDomain, setZoomDomain] = React.useState<{x: [number, number]} | null>(null);
  
  // Prepare chart data by combining the original data points with any analysis data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data || !data.dataPoints || data.dataPoints.length === 0) {
      return [];
    }

    // Detect if data is in wide or long format
    const isWideFormat = data.metadata?.format === 'wide' || 
      (data.dataPoints[0] && Object.keys(data.dataPoints[0]).some(key => 
        key !== 'timestamp' && key !== 'value' && key !== 'category' && 
        key !== 'seriesId' && key !== 'subjectId'));

    if (isWideFormat) {
      // Handle wide format data - each row is a timestamp with multiple columns for different series
      const formattedData = data.dataPoints.map(point => {
        const basePoint: ChartDataPoint = {
          timestamp: new Date(point.timestamp).getTime(),
          formattedTime: formatDate(point.timestamp)
        };
        
        // Add each series value as a separate property
        Object.entries(point).forEach(([key, value]) => {
          if (key !== 'timestamp' && key !== 'formattedTime') {
            basePoint[key] = value;
          }
        });
        
        return basePoint;
      });
      
      // Sort by timestamp
      formattedData.sort((a, b) => a.timestamp - b.timestamp);
      return formattedData;
    } else {
      // Handle long format data - each row is a single value with a series ID
      const formattedData = data.dataPoints.map(point => ({
        timestamp: new Date(point.timestamp).getTime(),
        formattedTime: formatDate(point.timestamp),
        value: point.value,
        category: point.category,
        seriesId: point.seriesId
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
                  value: null,
                  predicted: forecastPoint.value,
                  isForecast: true
                });
              });
            }
            break;
            
          case 'forecasting':
            const movingAverages = analysisResult.results.movingAverages;
            
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
                  value: null,
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
    }
  }, [data, analysisResult]);
  
  // Get series names for wide format data
  const seriesNames = useMemo(() => {
    if (chartData.length === 0) return [];
    
    // Get all keys except timestamp and formattedTime
    return Object.keys(chartData[0]).filter(
      key => key !== 'timestamp' && key !== 'formattedTime'
    );
  }, [chartData]);
  
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

  // Handle zoom functions
  const handleZoomIn = () => {
    if (chartRef.current && chartRef.current.state) {
      const { refState } = chartRef.current.state;
      if (refState && refState.xAxisMap && refState.xAxisMap[0]) {
        const domain = refState.xAxisMap[0].domain;
        const range = domain[1] - domain[0];
        const mid = (domain[0] + domain[1]) / 2;
        setZoomDomain({
          x: [mid - range / 4, mid + range / 4]
        });
      }
    }
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };
  
  const isWideFormat = chartData.length > 0 && seriesNames.length > 1;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title || data.name}</CardTitle>
            <CardDescription>
              {description || `${data.dataPoints.length} data points${data.metadata?.unit ? ` (${data.metadata.unit})` : ''}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
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
              domain={zoomDomain?.x || ['auto', 'auto']}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value, name, props) => {
                const displayName = name === 'value' ? 'Actual' : 
                                  name === 'predicted' ? 'Predicted' : name;
                return [`${value}${data.metadata?.unit ? ` ${data.metadata.unit}` : ''}`, displayName];
              }}
            />
            <Legend />
            
            {/* Wide format data - each column is a separate line */}
            {isWideFormat && seriesNames.map((series, index) => (
              <Line 
                key={series}
                type="monotone" 
                dataKey={series} 
                name={series}
                stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, index } = props;
                  return <circle 
                    cx={cx} 
                    cy={cy} 
                    r={3} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    stroke="none" 
                    key={`dot-${series}-${index}`}
                  />;
                }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            ))}
            
            {/* Long format data - single value line */}
            {!isWideFormat && (
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
                        key={`anomaly-${cx}-${cy}`}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#3788C7" stroke="none" key={`normal-${cx}-${cy}`} />;
                }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
            
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
                    return <circle cx={cx} cy={cy} r={3} fill="#55A5DA" stroke="none" key={`forecast-${cx}-${cy}`} />;
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
            
            {/* Add brush for another zoom control */}
            <Brush 
              dataKey="formattedTime" 
              height={30} 
              stroke="#8884d8"
              startIndex={0}
              endIndex={Math.min(chartData.length - 1, 20)}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
