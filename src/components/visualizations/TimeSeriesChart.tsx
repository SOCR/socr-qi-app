
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { TimeSeriesData, AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush, Scatter, ReferenceArea
} from "recharts";
import { formatDate } from "@/lib/dataUtils";
import ChartTooltip from "./ChartTooltip";
import ChartControls from "./ChartControls";

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

// Define chart data type
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
  const chartRef = useRef<any>(null);
  
  // Prepare chart data by combining all time series data points
  const { chartData, seriesKeys, targetSeriesKey, anomalyData } = useMemo(() => {
    const timeMap = new Map<number, ChartDataPoint>();
    const allSeries = Array.isArray(data) ? data : [data];
    const seriesSet = new Set<string>();
    
    // Find target series key from analysis result
    const targetSeriesKey = analysisResult?.targetSeries || null;
    let anomalyData: any[] = [];
    
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
        
        // Add the series key to the set
        seriesSet.add(seriesKey);
        
        // Add the value for this series at this timestamp
        existingPoint[seriesKey] = point.value;
      });
    });
    
    // Handle analysis results (predictions, anomalies, classifications)
    if (analysisResult) {
      switch (analysisResult.type) {
        case 'forecasting':
          if (analysisResult.results.forecast) {
            // Add forecast points after the actual data
            analysisResult.results.forecast.forEach((forecastPoint: any) => {
              const timestamp = new Date(forecastPoint.timestamp).getTime();
              
              if (!timeMap.has(timestamp)) {
                timeMap.set(timestamp, {
                  timestamp,
                  formattedTime: formatDate(forecastPoint.timestamp),
                });
              }
              
              const existingPoint = timeMap.get(timestamp)!;
              
              // Use the target series name for forecast if available
              const forecastKey = `${targetSeriesKey || 'Forecast'}_predicted`;
              existingPoint[forecastKey] = forecastPoint.predicted;
              
              // Add the forecast key to the set
              seriesSet.add(forecastKey);
            });
          }
          break;
          
        case 'regression':
        case 'logistic-regression':
        case 'poisson-regression':
          if (analysisResult.results.predictions) {
            // Get the target series key
            const targetKey = targetSeriesKey || 'Target';
            const predictedKey = `${targetKey}_predicted`;
            
            // Add prediction to each data point
            analysisResult.results.predictions.forEach((pred: number, idx: number) => {
              const timestamp = analysisResult.results.timestamps?.[idx];
              if (timestamp && timeMap.has(new Date(timestamp).getTime())) {
                const point = timeMap.get(new Date(timestamp).getTime())!;
                point[predictedKey] = pred;
                seriesSet.add(predictedKey);
              }
            });
          }
          break;
          
        case 'classification':
          if (analysisResult.results.classifications) {
            // Get the target series key
            const targetKey = targetSeriesKey || 'Target';
            
            // Add classification labels
            analysisResult.results.classifications.forEach((cls: any) => {
              const timestamp = new Date(cls.timestamp).getTime();
              if (timeMap.has(timestamp)) {
                const point = timeMap.get(timestamp)!;
                point[`${targetKey}_class`] = cls.predictedClass === 'High Risk' ? 1 : 0;
              }
            });
            
            // Add classification series to set
            seriesSet.add(`${targetKey}_class`);
          }
          break;
          
        case 'anomaly':
          if (analysisResult.results.anomalies) {
            // Get anomalies array for special scatter plot
            anomalyData = analysisResult.results.anomalies
              .filter((a: any) => a.isAnomaly)
              .map((a: any) => ({
                timestamp: new Date(a.timestamp).getTime(),
                formattedTime: formatDate(a.timestamp),
                value: a.value,
                zScore: a.zScore
              }));
            
            // Add upper and lower control limits
            if (analysisResult.results.upperControlLimit !== undefined && 
                analysisResult.results.lowerControlLimit !== undefined) {
              timeMap.forEach((point) => {
                point['UCL'] = analysisResult.results.upperControlLimit;
                point['LCL'] = analysisResult.results.lowerControlLimit;
              });
              
              // Add control limit series to set
              seriesSet.add('UCL');
              seriesSet.add('LCL');
            }
          }
          break;
      }
    }
    
    // Convert map to array and sort by timestamp
    const formattedData = Array.from(timeMap.values());
    
    return {
      chartData: formattedData.sort((a, b) => a.timestamp - b.timestamp),
      seriesKeys: Array.from(seriesSet),
      targetSeriesKey,
      anomalyData
    };
  }, [data, analysisResult]);
  
  // Handle zoom reset
  const handleResetZoom = useCallback(() => {
    setZoomDomain(null);
    setIsZoomed(false);
  }, []);
  
  // Handle zoom in/out
  const handleZoomIn = useCallback(() => {
    if (chartData.length > 10) {
      const midPoint = Math.floor(chartData.length / 2);
      const startIndex = Math.max(0, midPoint - 5);
      const endIndex = Math.min(chartData.length - 1, midPoint + 5);
      
      setZoomDomain({
        x: [chartData[startIndex].timestamp, chartData[endIndex].timestamp],
        y: ['auto', 'auto'] as [number, number]
      });
      setIsZoomed(true);
    }
  }, [chartData]);
  
  const handleZoomOut = useCallback(() => {
    if (isZoomed) {
      const currentDomain = zoomDomain?.x;
      if (currentDomain) {
        const currentRange = currentDomain[1] - currentDomain[0];
        const newStart = Math.max(chartData[0].timestamp, currentDomain[0] - currentRange/2);
        const newEnd = Math.min(chartData[chartData.length-1].timestamp, currentDomain[1] + currentRange/2);
        
        setZoomDomain({
          x: [newStart, newEnd],
          y: ['auto', 'auto'] as [number, number]
        });
      }
    }
  }, [isZoomed, zoomDomain, chartData]);
  
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
    
    let desc = `${totalPoints} data points across ${seriesKeys.length} series`;
    
    // Add analysis type information
    if (analysisResult) {
      desc += ` - ${analysisResult.type.charAt(0).toUpperCase() + analysisResult.type.slice(1)} Analysis`;
      
      if (analysisResult.targetSeries) {
        desc += ` for ${analysisResult.targetSeries}`;
      }
    }
    
    return desc;
  }, [description, data, seriesKeys, analysisResult]);
  
  // Determine domain for X axis - include forecast points beyond observed data
  const xDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    
    let minTime = chartData[0].timestamp;
    let maxTime = chartData[chartData.length - 1].timestamp;
    
    // Override with zoom domain if set
    if (zoomDomain && isZoomed) {
      return zoomDomain.x;
    }
    
    return [minTime, maxTime];
  }, [chartData, zoomDomain, isZoomed]);
  
  // Get Y domain with room for control limits if needed
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;
    
    // Find min and max across all series
    chartData.forEach(point => {
      seriesKeys.forEach(key => {
        if (point[key] !== undefined) {
          minValue = Math.min(minValue, point[key]);
          maxValue = Math.max(maxValue, point[key]);
        }
      });
    });
    
    // Check control limits for anomaly detection
    if (analysisResult?.type === 'anomaly') {
      if (analysisResult.results.upperControlLimit !== undefined) {
        maxValue = Math.max(maxValue, analysisResult.results.upperControlLimit);
      }
      if (analysisResult.results.lowerControlLimit !== undefined) {
        minValue = Math.min(minValue, analysisResult.results.lowerControlLimit);
      }
    }
    
    // Add padding
    const padding = (maxValue - minValue) * 0.1;
    minValue = Math.max(0, minValue - padding); // Don't go below 0 unless data does
    maxValue = maxValue + padding;
    
    // Override with zoom domain if set
    if (zoomDomain && isZoomed && zoomDomain.y[0] !== 'auto') {
      return zoomDomain.y;
    }
    
    return [minValue, maxValue];
  }, [chartData, seriesKeys, analysisResult, zoomDomain, isZoomed]);
  
  // Render lines based on analysis type
  const renderLines = () => {
    // Split series that should have normal lines vs specialized displays
    const regularSeries = seriesKeys.filter(key => 
      !key.includes('_predicted') && 
      !key.includes('_class') && 
      key !== 'UCL' && 
      key !== 'LCL'
    );
    
    // Render main data series
    const mainLines = regularSeries.map((seriesKey, index) => (
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
    ));
    
    // Render prediction/forecast lines if available
    const predictionLines = seriesKeys
      .filter(key => key.includes('_predicted'))
      .map((predKey, index) => {
        const baseKey = predKey.replace('_predicted', '');
        const baseIndex = regularSeries.indexOf(baseKey);
        const colorIndex = baseIndex >= 0 ? baseIndex : index;
        
        return (
          <Line 
            key={predKey}
            type="monotone" 
            dataKey={predKey}
            name={`${baseKey} (Predicted)`}
            stroke={COLORS[colorIndex % COLORS.length]}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
        );
      });
    
    // Render classification indicators if available
    const classLines = seriesKeys
      .filter(key => key.includes('_class'))
      .map((classKey, index) => {
        const baseKey = classKey.replace('_class', '');
        const baseIndex = regularSeries.indexOf(baseKey);
        const colorIndex = baseIndex >= 0 ? baseIndex : index;
        
        return (
          <Line 
            key={classKey}
            type="stepAfter" 
            dataKey={classKey}
            name={`${baseKey} (Classification)`}
            stroke={COLORS[colorIndex % COLORS.length]}
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
        );
      });
    
    // Render control limit lines for anomaly detection
    const controlLines = [];
    
    if (seriesKeys.includes('UCL')) {
      controlLines.push(
        <Line 
          key="UCL"
          type="monotone" 
          dataKey="UCL"
          name="Upper Control Limit"
          stroke="#FF0000"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={true}
          animationDuration={1000}
        />
      );
    }
    
    if (seriesKeys.includes('LCL')) {
      controlLines.push(
        <Line 
          key="LCL"
          type="monotone" 
          dataKey="LCL"
          name="Lower Control Limit"
          stroke="#FF0000"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={true}
          animationDuration={1000}
        />
      );
    }
    
    // Combine all lines
    return [...mainLines, ...predictionLines, ...classLines, ...controlLines];
  };
  
  // Render anomaly points for anomaly detection
  const renderAnomalyPoints = () => {
    if (analysisResult?.type !== 'anomaly' || anomalyData.length === 0) {
      return null;
    }
    
    // Find the target series key
    const targetKey = targetSeriesKey || seriesKeys.find(k => !k.includes('_') && k !== 'UCL' && k !== 'LCL') || '';
    
    return (
      <Scatter
        name="Anomalies"
        data={anomalyData}
        fill="#FF0000"
        line={false}
        shape={(props: any) => {
          const { cx, cy } = props;
          return (
            <circle
              cx={cx}
              cy={cy}
              r={6}
              fill="none"
              stroke="#FF0000"
              strokeWidth={2}
            />
          );
        }}
      />
    );
  };
  
  // Render reference lines if needed
  const renderReferenceLines = () => {
    if (!analysisResult) return null;
    
    const referenceLines = [];
    
    if (analysisResult.type === 'anomaly') {
      // Mean reference line
      if (analysisResult.results.mean !== undefined) {
        referenceLines.push(
          <ReferenceLine 
            key="mean"
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
        );
      }
    } else if (analysisResult.type === 'classification') {
      // Threshold reference line
      if (analysisResult.results.threshold !== undefined) {
        referenceLines.push(
          <ReferenceLine 
            key="threshold"
            y={analysisResult.results.threshold} 
            stroke="rgba(102, 102, 102, 0.7)" 
            strokeDasharray="3 3" 
            label={{ 
              value: `Threshold: ${analysisResult.results.threshold.toFixed(2)}`, 
              position: 'insideTopLeft',
              fill: '#666666',
              fontSize: 12
            }} 
          />
        );
      }
    }
    
    return referenceLines;
  };
  
  // Render reference area if needed (for control limits)
  const renderReferenceAreas = () => {
    if (analysisResult?.type !== 'anomaly') return null;
    
    if (analysisResult.results.upperControlLimit !== undefined && 
        analysisResult.results.lowerControlLimit !== undefined) {
      return (
        <ReferenceArea
          y1={analysisResult.results.lowerControlLimit}
          y2={analysisResult.results.upperControlLimit}
          fill="rgba(173, 216, 230, 0.15)"
          fillOpacity={0.3}
        />
      );
    }
    
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{chartTitle}</CardTitle>
            <CardDescription>{chartDescription}</CardDescription>
          </div>
          <ChartControls 
            isZoomed={isZoomed} 
            onResetZoom={handleResetZoom} 
            onZoomIn={handleZoomIn}
            onZoomOut={isZoomed ? handleZoomOut : undefined}
          />
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
            ref={chartRef}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              domain={xDomain}
              allowDataOverflow={isZoomed}
              type="category"
            />
            <YAxis
              domain={yDomain}
              allowDataOverflow={isZoomed}
            />
            <Tooltip 
              content={<ChartTooltip />}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            
            {/* Reference area for control limits */}
            {renderReferenceAreas()}
            
            {/* Reference lines */}
            {renderReferenceLines()}
            
            {/* Time windowing with brush */}
            <Brush 
              dataKey="formattedTime" 
              height={30} 
              stroke="#8884d8"
              onChange={handleBrushChange}
            />
            
            {/* Render all lines */}
            {renderLines()}
            
            {/* Render anomaly points */}
            {renderAnomalyPoints()}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
