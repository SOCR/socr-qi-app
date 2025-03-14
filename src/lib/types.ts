
// Define our core data types
export interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
  subjectId?: string;
  seriesId?: string;
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
    format?: 'wide' | 'long';
    [key: string]: any;
  };
}

export interface AnalysisResult {
  id: string;
  type: 'descriptive' | 'regression' | 'classification' | 'forecasting' | 'anomaly' | 'logistic-regression' | 'poisson-regression';
  timeSeriesId: string;
  results: any;
  targetSeries?: string;
  predictorSeries?: string[];
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    auc?: number;
    deviance?: number;
    [key: string]: any;
  };
  createdAt: string;
}

export type AnalysisType = 'descriptive' | 'regression' | 'classification' | 'forecasting' | 'anomaly' | 'logistic-regression' | 'poisson-regression';

export interface AnalysisOptions {
  type: AnalysisType;
  parameters?: {
    targetSeries?: string | null;
    predictorSeries?: string[];
    [key: string]: any;
  };
}

export interface SimulationOptions {
  seriesCount: number;
  pointsPerSeries: number;
  timeSpan: number; // in days
  missingDataPercentage?: number;
  noiseLevel?: number;
  trendType?: 'random' | 'increasing' | 'decreasing' | 'cyclic' | 'seasonal';
  format?: 'wide' | 'long';
}

export interface ImportOptions {
  format: 'wide' | 'long';
  timestampColumn?: string;
  valueColumn?: string;
  seriesIdColumn?: string;
  categoryColumn?: string;
  subjectIdColumn?: string;
}

export interface Report {
  id: string;
  title: string;
  createdAt: string;
  description?: string;
  datasets: TimeSeriesData[];
  analyses: AnalysisResult[];
  summary?: string;
  conclusions?: string;
}
