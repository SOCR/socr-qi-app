
// Define our core data types
export interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
  subjectId?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  id: string;
  name: string;
  description?: string;
  dataPoints: DataPoint[];
  metadata?: {
    unit?: string;
    source?: string;
    collectionMethod?: string;
    [key: string]: any;
  };
}

export interface AnalysisResult {
  id: string;
  type: 'descriptive' | 'regression' | 'classification' | 'forecasting' | 'anomaly';
  timeSeriesId: string;
  results: any;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    [key: string]: any;
  };
  createdAt: string;
}

export type AnalysisType = 'descriptive' | 'regression' | 'classification' | 'forecasting' | 'anomaly';

export interface AnalysisOptions {
  type: AnalysisType;
  parameters?: Record<string, any>;
}

export interface SimulationOptions {
  seriesCount: number;
  pointsPerSeries: number;
  timeSpan: number; // in days
  missingDataPercentage?: number;
  noiseLevel?: number;
  trendType?: 'random' | 'increasing' | 'decreasing' | 'cyclic' | 'seasonal';
}
