
import { DataPoint, TimeSeriesData, SimulationOptions } from "./types";

// Parse CSV data into our TimeSeriesData format
export const parseCSVData = (csvContent: string, options: { 
  timestampColumn: string; 
  valueColumn: string;
  nameColumn?: string;
  categoryColumn?: string;
  subjectIdColumn?: string;
}): TimeSeriesData => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const timestampIndex = headers.indexOf(options.timestampColumn);
  const valueIndex = headers.indexOf(options.valueColumn);
  const nameIndex = options.nameColumn ? headers.indexOf(options.nameColumn) : -1;
  const categoryIndex = options.categoryColumn ? headers.indexOf(options.categoryColumn) : -1;
  const subjectIdIndex = options.subjectIdColumn ? headers.indexOf(options.subjectIdColumn) : -1;
  
  if (timestampIndex === -1 || valueIndex === -1) {
    throw new Error('Required columns not found in CSV data');
  }
  
  const dataPoints: DataPoint[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    
    dataPoints.push({
      timestamp: values[timestampIndex],
      value: parseFloat(values[valueIndex]),
      ...(categoryIndex > -1 && { category: values[categoryIndex] }),
      ...(subjectIdIndex > -1 && { subjectId: values[subjectIdIndex] }),
    });
  }
  
  return {
    id: generateId(),
    name: nameIndex > -1 ? lines[1].split(',')[nameIndex].trim() : `Dataset ${new Date().toISOString()}`,
    dataPoints: dataPoints
  };
};

// Generate random time series data
export const generateSimulatedData = (options: SimulationOptions): TimeSeriesData[] => {
  const result: TimeSeriesData[] = [];
  
  for (let i = 0; i < options.seriesCount; i++) {
    const seriesName = `Simulated Series ${i + 1}`;
    const dataPoints: DataPoint[] = [];
    
    // Generate base timestamps
    const now = new Date();
    const timestamps: Date[] = [];
    
    for (let j = 0; j < options.pointsPerSeries; j++) {
      const timeOffset = (j / (options.pointsPerSeries - 1)) * options.timeSpan * 24 * 60 * 60 * 1000;
      timestamps.push(new Date(now.getTime() - timeOffset));
    }
    
    // Sort chronologically
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    
    // Handle missing data by removing random timestamps
    if (options.missingDataPercentage && options.missingDataPercentage > 0) {
      const pointsToRemove = Math.floor(timestamps.length * (options.missingDataPercentage / 100));
      for (let j = 0; j < pointsToRemove; j++) {
        const indexToRemove = Math.floor(Math.random() * timestamps.length);
        timestamps.splice(indexToRemove, 1);
      }
    }
    
    // Generate values based on trend type
    for (let j = 0; j < timestamps.length; j++) {
      let baseValue: number;
      
      switch (options.trendType) {
        case 'increasing':
          baseValue = 50 + (j / timestamps.length) * 50;
          break;
        case 'decreasing':
          baseValue = 100 - (j / timestamps.length) * 50;
          break;
        case 'cyclic':
          baseValue = 75 + 25 * Math.sin((j / timestamps.length) * Math.PI * 4);
          break;
        case 'seasonal':
          baseValue = 75 + 15 * Math.sin((j / timestamps.length) * Math.PI * 2) 
                    + 10 * Math.sin((j / timestamps.length) * Math.PI * 8);
          break;
        case 'random':
        default:
          baseValue = 75;
          break;
      }
      
      // Add noise
      const noiseAmount = options.noiseLevel || 5;
      const noise = (Math.random() - 0.5) * 2 * noiseAmount;
      const value = baseValue + noise;
      
      dataPoints.push({
        timestamp: timestamps[j].toISOString(),
        value: Math.max(0, value), // Ensure no negative values
        subjectId: `Subject-${i + 1}`,
        category: i % 3 === 0 ? 'High Risk' : i % 3 === 1 ? 'Medium Risk' : 'Low Risk'
      });
    }
    
    result.push({
      id: generateId(),
      name: seriesName,
      description: `Simulated ${options.trendType || 'random'} trend data`,
      dataPoints,
      metadata: {
        unit: 'quality score',
        source: 'simulation',
        simulationParameters: { ...options }
      }
    });
  }
  
  return result;
};

// Helper function to generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Sort data points chronologically
export const sortDataPointsByTime = (dataPoints: DataPoint[]): DataPoint[] => {
  return [...dataPoints].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

// Group time series data by category
export const groupByCategory = (data: TimeSeriesData): Record<string, DataPoint[]> => {
  const result: Record<string, DataPoint[]> = {};
  
  data.dataPoints.forEach(point => {
    const category = point.category || 'Uncategorized';
    if (!result[category]) {
      result[category] = [];
    }
    result[category].push(point);
  });
  
  return result;
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
