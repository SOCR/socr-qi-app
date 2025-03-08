import { DataPoint, TimeSeriesData, SimulationOptions, ImportOptions } from "./types";

// Parse CSV data into our TimeSeriesData format
export const parseCSVData = (csvContent: string, options: ImportOptions): TimeSeriesData => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  if (options.format === 'wide') {
    return parseWideFormatCSV(csvContent);
  } else {
    return parseLongFormatCSV(csvContent, options);
  }
};

// Detects the most likely timestamp column from headers or first row values
const detectTimestampColumn = (headers: string[], firstRowValues: string[]): number => {
  // Common timestamp column names
  const timeColumnNames = ['time', 'date', 'timestamp', 'datetime', 'period'];
  
  // Check headers for common timestamp column names
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    if (timeColumnNames.some(name => header.includes(name))) {
      return i;
    }
  }
  
  // Check if first column has date-like formats
  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/, // YYYY-MM-DD
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/, // MM-DD-YYYY or DD-MM-YYYY
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2}/, // MM-DD-YY or DD-MM-YY
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s\d{1,2}:\d{1,2}/, // YYYY-MM-DD HH:MM
    /^\d{1,2}:\d{1,2}/ // HH:MM
  ];

  for (let i = 0; i < Math.min(headers.length, 3); i++) { // Check first 3 columns
    const value = firstRowValues[i];
    if (datePatterns.some(pattern => pattern.test(value))) {
      return i;
    }
  }
  
  // Default to first column if no timestamp column is detected
  return 0;
};

// Parse wide format CSV with automatic timestamp column detection
const parseWideFormatCSV = (csvContent: string): TimeSeriesData => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Auto-detect timestamp column from first row
  const firstRowValues = lines[1].split(',').map(v => v.trim());
  const timestampIndex = detectTimestampColumn(headers, firstRowValues);
  
  console.log(`Auto-detected timestamp column: ${headers[timestampIndex]} (index: ${timestampIndex})`);
  
  const dataPoints: DataPoint[] = [];
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const timestamp = values[timestampIndex];
    
    // Process each column (except the timestamp column) as a separate series
    for (let j = 0; j < headers.length; j++) {
      if (j === timestampIndex) continue; // Skip the timestamp column
      
      const seriesId = headers[j];
      const value = parseFloat(values[j]);
      
      // Skip if not a valid number
      if (isNaN(value)) continue;
      
      dataPoints.push({
        timestamp: timestamp,
        value: value,
        seriesId: seriesId,
        category: seriesId, // Use series name as category by default
      });
    }
  }
  
  return {
    id: generateId(),
    name: `Dataset ${new Date().toISOString().split('T')[0]}`,
    dataPoints: dataPoints,
    metadata: {
      format: 'wide',
      source: 'import',
      importedAt: new Date().toISOString()
    }
  };
};

// Parse long format CSV (time, series ID, value)
const parseLongFormatCSV = (csvContent: string, options: ImportOptions): TimeSeriesData => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const timestampIndex = headers.indexOf(options.timestampColumn);
  const valueIndex = headers.indexOf(options.valueColumn);
  const seriesIdIndex = options.seriesIdColumn ? headers.indexOf(options.seriesIdColumn) : -1;
  const categoryIndex = options.categoryColumn ? headers.indexOf(options.categoryColumn) : -1;
  const subjectIdIndex = options.subjectIdColumn ? headers.indexOf(options.subjectIdColumn) : -1;
  
  if (timestampIndex === -1 || valueIndex === -1) {
    throw new Error(`Required columns not found in CSV data. Cannot find '${options.timestampColumn}' or '${options.valueColumn}'`);
  }
  
  const dataPoints: DataPoint[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const value = parseFloat(values[valueIndex]);
    
    // Skip if not a valid number
    if (isNaN(value)) continue;
    
    dataPoints.push({
      timestamp: values[timestampIndex],
      value: value,
      ...(seriesIdIndex > -1 && { seriesId: values[seriesIdIndex] }),
      ...(categoryIndex > -1 && { category: values[categoryIndex] }),
      ...(subjectIdIndex > -1 && { subjectId: values[subjectIdIndex] }),
    });
  }
  
  return {
    id: generateId(),
    name: `Dataset ${new Date().toISOString().split('T')[0]}`,
    dataPoints: dataPoints,
    metadata: {
      format: 'long',
      source: 'import',
      importedAt: new Date().toISOString()
    }
  };
};

// Generate random time series data
export const generateSimulatedData = (options: SimulationOptions): TimeSeriesData[] => {
  const result: TimeSeriesData[] = [];
  
  if (options.format === 'wide') {
    // Generate separate time series for each variable
    for (let i = 0; i < options.seriesCount; i++) {
      const seriesName = `Simulated Series ${i + 1}`;
      const dataPoints: DataPoint[] = generateSimulatedPoints(options, i);
      
      result.push({
        id: generateId(),
        name: seriesName,
        description: `Simulated ${options.trendType || 'random'} trend data`,
        dataPoints,
        metadata: {
          unit: 'quality score',
          source: 'simulation',
          format: 'wide',
          simulationParameters: { ...options }
        }
      });
    }
  } else {
    // Generate a single time series with multiple variables
    const dataPoints: DataPoint[] = [];
    
    for (let i = 0; i < options.seriesCount; i++) {
      const seriesPoints = generateSimulatedPoints(options, i);
      
      // Add series ID to each point
      seriesPoints.forEach(point => {
        dataPoints.push({
          ...point,
          seriesId: `Series-${i + 1}`
        });
      });
    }
    
    result.push({
      id: generateId(),
      name: `Multi-variable Dataset`,
      description: `Simulated ${options.trendType || 'random'} trend data`,
      dataPoints,
      metadata: {
        unit: 'quality score',
        source: 'simulation',
        format: 'long',
        simulationParameters: { ...options }
      }
    });
  }
  
  return result;
};

// Generate simulated data points for a single series
const generateSimulatedPoints = (options: SimulationOptions, seriesIndex: number): DataPoint[] => {
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
      subjectId: `Subject-${seriesIndex + 1}`,
      category: seriesIndex % 3 === 0 ? 'High Risk' : seriesIndex % 3 === 1 ? 'Medium Risk' : 'Low Risk'
    });
  }
  
  return dataPoints;
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

// Group time series data by series ID (for long format)
export const groupBySeriesId = (data: TimeSeriesData): Record<string, DataPoint[]> => {
  const result: Record<string, DataPoint[]> = {};
  
  data.dataPoints.forEach(point => {
    const seriesId = point.seriesId || 'default';
    if (!result[seriesId]) {
      result[seriesId] = [];
    }
    result[seriesId].push(point);
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
