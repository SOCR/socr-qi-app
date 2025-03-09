
import { TimeSeriesData, DataPoint } from "@/lib/types";

/**
 * Extracts data points for a specific series from a TimeSeriesData object
 */
export const extractSeriesData = (
  data: TimeSeriesData,
  seriesId: string
): DataPoint[] => {
  // Handle wide format data
  if (data.metadata?.format === 'wide' || data.dataPoints.some(p => p.seriesId)) {
    return data.dataPoints.filter(p => p.seriesId === seriesId);
  }
  
  // For single series data, if the name matches, return all points
  if (data.name === seriesId) {
    return data.dataPoints;
  }
  
  // No matching data found
  return [];
};

/**
 * Creates a new TimeSeriesData object for a specific series
 */
export const createSeriesDataObject = (
  originalData: TimeSeriesData,
  seriesId: string
): TimeSeriesData => {
  const seriesPoints = extractSeriesData(originalData, seriesId);
  
  return {
    id: `${originalData.id}_${seriesId}`,
    name: seriesId,
    description: `Extracted from ${originalData.name}`,
    dataPoints: seriesPoints,
    metadata: { ...originalData.metadata }
  };
};

/**
 * Combines multiple series data points into a format suitable for regression analysis
 */
export const combineSeriesForAnalysis = (
  data: TimeSeriesData,
  targetSeriesId: string,
  predictorSeriesIds: string[]
): { 
  timestamps: string[], 
  targetValues: number[], 
  predictorValues: number[][]
} => {
  // Get all timestamps from target series
  const targetPoints = extractSeriesData(data, targetSeriesId);
  const timestamps = targetPoints.map(p => p.timestamp);
  const targetValues = targetPoints.map(p => p.value);
  
  // For each predictor series, get values at the same timestamps
  const predictorValues: number[][] = [];
  
  for (const predictorId of predictorSeriesIds) {
    const predictorPoints = extractSeriesData(data, predictorId);
    const values: number[] = [];
    
    // Match timestamps to target series
    for (const timestamp of timestamps) {
      const point = predictorPoints.find(p => p.timestamp === timestamp);
      values.push(point ? point.value : 0); // Use 0 or some interpolation for missing values
    }
    
    predictorValues.push(values);
  }
  
  return { timestamps, targetValues, predictorValues };
};

/**
 * Filters analysis data to only include points for which all series have values
 */
export const filterValidAnalysisPoints = (
  data: TimeSeriesData,
  seriesIds: string[]
): string[] => {
  // Get timestamps that have values for all series
  const allTimestamps = new Set<string>();
  const validTimestamps = new Set<string>();
  const timestampCounts = new Map<string, number>();
  
  // First collect all timestamps
  data.dataPoints.forEach(point => {
    if (seriesIds.includes(point.seriesId || data.name)) {
      allTimestamps.add(point.timestamp);
      
      const count = timestampCounts.get(point.timestamp) || 0;
      timestampCounts.set(point.timestamp, count + 1);
    }
  });
  
  // Find timestamps with all series represented
  allTimestamps.forEach(timestamp => {
    if (timestampCounts.get(timestamp) === seriesIds.length) {
      validTimestamps.add(timestamp);
    }
  });
  
  return Array.from(validTimestamps);
};
