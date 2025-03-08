import { TimeSeriesData, AnalysisResult, AnalysisOptions, DataPoint } from "./types";
import { generateId, sortDataPointsByTime } from "./dataUtils";

// Perform time series analysis based on the specified type
export const analyzeTimeSeries = (
  data: TimeSeriesData,
  options: AnalysisOptions
): AnalysisResult => {
  // Ensure data points are sorted by time
  const sortedDataPoints = sortDataPointsByTime(data.dataPoints);
  
  // Select the appropriate analysis method based on the requested type
  switch (options.type) {
    case 'descriptive':
      return performDescriptiveAnalysis(data, sortedDataPoints);
    case 'regression':
      return performRegressionAnalysis(data, sortedDataPoints, options.parameters);
    case 'logistic-regression':
      return performLogisticRegression(data, sortedDataPoints, options.parameters);
    case 'poisson-regression':
      return performPoissonRegression(data, sortedDataPoints, options.parameters);
    case 'classification':
      return performClassificationAnalysis(data, sortedDataPoints, options.parameters);
    case 'forecasting':
      return performForecastingAnalysis(data, sortedDataPoints, options.parameters);
    case 'anomaly':
      return performAnomalyDetection(data, sortedDataPoints, options.parameters);
    default:
      throw new Error(`Unsupported analysis type: ${options.type}`);
  }
};

// Basic descriptive statistics
const performDescriptiveAnalysis = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[]
): AnalysisResult => {
  const values = sortedDataPoints.map(point => point.value);
  
  // Calculate basic statistics
  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  const mean = sum / count;
  
  // Calculate variance and standard deviation
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  
  // Find min, max, median
  const sortedValues = [...values].sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  // Calculate quartiles
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
  const iqr = q3 - q1;
  
  // Calculate trend
  let trend = 0;
  if (sortedDataPoints.length > 1) {
    const firstValue = sortedDataPoints[0].value;
    const lastValue = sortedDataPoints[sortedDataPoints.length - 1].value;
    trend = (lastValue - firstValue) / firstValue * 100; // Percentage change
  }
  
  return {
    id: generateId(),
    type: 'descriptive',
    timeSeriesId: data.id,
    results: {
      count,
      mean,
      median,
      min,
      max,
      stdDev,
      variance,
      q1,
      q3,
      iqr,
      trend,
      summary: `Dataset contains ${count} points with mean value of ${mean.toFixed(2)}. 
      Values range from ${min.toFixed(2)} to ${max.toFixed(2)} with a standard deviation 
      of ${stdDev.toFixed(2)}. Overall trend shows a ${trend > 0 ? 'positive' : 'negative'} 
      change of ${Math.abs(trend).toFixed(2)}%.`
    },
    createdAt: new Date().toISOString()
  };
};

// Simple linear regression for trend analysis
const performRegressionAnalysis = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Convert timestamps to numeric values (milliseconds since epoch)
  const x = sortedDataPoints.map(point => new Date(point.timestamp).getTime());
  const y = sortedDataPoints.map(point => point.value);
  
  // Normalize x values for numerical stability
  const xMin = Math.min(...x);
  const xRange = Math.max(...x) - xMin;
  const xNorm = x.map(val => (val - xMin) / xRange);
  
  // Calculate linear regression using least squares method
  const n = x.length;
  const sumX = xNorm.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = xNorm.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumXX = xNorm.reduce((acc, val) => acc + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate predictions
  const predictions = xNorm.map(xVal => intercept + slope * xVal);
  
  // Calculate error metrics
  const errors = y.map((yVal, i) => yVal - predictions[i]);
  const squaredErrors = errors.map(err => err * err);
  const mse = squaredErrors.reduce((a, b) => a + b, 0) / n;
  const rmse = Math.sqrt(mse);
  
  // Calculate R-squared (coefficient of determination)
  const yMean = sumY / n;
  const totalSumOfSquares = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
  const rSquared = 1 - (squaredErrors.reduce((a, b) => a + b, 0) / totalSumOfSquares);
  
  // Create forecast for future points
  const forecastPoints: DataPoint[] = [];
  const lastDataPointTime = new Date(sortedDataPoints[sortedDataPoints.length - 1].timestamp).getTime();
  
  for (let i = 1; i <= 10; i++) {
    const futureTime = lastDataPointTime + i * (24 * 60 * 60 * 1000); // Add 1 day each time
    const normalizedX = (futureTime - xMin) / xRange;
    const predictedValue = intercept + slope * normalizedX;
    
    forecastPoints.push({
      timestamp: new Date(futureTime).toISOString(),
      value: predictedValue
    });
  }
  
  return {
    id: generateId(),
    type: 'regression',
    timeSeriesId: data.id,
    results: {
      slope,
      intercept,
      predictions,
      forecastPoints,
      rSquared,
      summary: `Linear regression shows a ${slope > 0 ? 'positive' : 'negative'} trend with 
      a slope of ${slope.toFixed(4)}. The model explains ${(rSquared * 100).toFixed(2)}% of 
      the variance in the data. Based on this trend, we forecast a 
      ${slope > 0 ? 'continued increase' : 'continued decrease'} in values.`
    },
    metrics: {
      mse,
      rmse,
      rSquared
    },
    createdAt: new Date().toISOString()
  };
};

// Simple binary classification using threshold
const performClassificationAnalysis = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Use a threshold-based approach by default, or take from parameters
  const threshold = parameters?.threshold || 
                    sortedDataPoints.reduce((sum, point) => sum + point.value, 0) / sortedDataPoints.length;
  
  // Create binary classifications based on threshold
  const classifications = sortedDataPoints.map(point => ({
    timestamp: point.timestamp,
    actualValue: point.value,
    predictedClass: point.value >= threshold ? 'High' : 'Low',
    threshold
  }));
  
  // If we have category data, we can calculate accuracy
  let accuracy = 0;
  let precision = 0;
  let recall = 0;
  let f1Score = 0;
  
  if (sortedDataPoints.some(point => point.category)) {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    sortedDataPoints.forEach((point, index) => {
      const predicted = classifications[index].predictedClass === 'High';
      const actual = point.category === 'High Risk'; // Assuming categories are "High Risk" and not "High Risk"
      
      if (predicted && actual) truePositives++;
      if (predicted && !actual) falsePositives++;
      if (!predicted && !actual) trueNegatives++;
      if (!predicted && actual) falseNegatives++;
    });
    
    accuracy = (truePositives + trueNegatives) / sortedDataPoints.length;
    precision = truePositives / (truePositives + falsePositives) || 0;
    recall = truePositives / (truePositives + falseNegatives) || 0;
    f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  }
  
  return {
    id: generateId(),
    type: 'classification',
    timeSeriesId: data.id,
    results: {
      threshold,
      classifications,
      summary: `Classification analysis using a threshold of ${threshold.toFixed(2)} separates 
      data points into High/Low categories. ${accuracy > 0 ? 
      `The model achieved ${(accuracy * 100).toFixed(2)}% accuracy.` : 
      'No ground truth categories were available to evaluate accuracy.'}`
    },
    metrics: {
      accuracy,
      precision,
      recall,
      f1Score
    },
    createdAt: new Date().toISOString()
  };
};

// Simple forecasting using moving average
const performForecastingAnalysis = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Use window size from parameters or default to 3
  const windowSize = parameters?.windowSize || 3;
  const forecastHorizon = parameters?.forecastHorizon || 10;
  
  // Calculate moving averages
  const movingAverages: { timestamp: string; actual?: number; predicted: number }[] = [];
  
  for (let i = 0; i < sortedDataPoints.length; i++) {
    if (i < windowSize - 1) {
      // Not enough previous points for full window, just record the actual
      movingAverages.push({
        timestamp: sortedDataPoints[i].timestamp,
        actual: sortedDataPoints[i].value,
        predicted: sortedDataPoints[i].value // Use actual as the best guess
      });
    } else {
      // Calculate moving average
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += sortedDataPoints[i - j].value;
      }
      const average = sum / windowSize;
      
      movingAverages.push({
        timestamp: sortedDataPoints[i].timestamp,
        actual: sortedDataPoints[i].value,
        predicted: average
      });
    }
  }
  
  // Generate forecast for future points
  const lastDataPointTime = new Date(sortedDataPoints[sortedDataPoints.length - 1].timestamp).getTime();
  const intervalMs = lastDataPointTime - new Date(sortedDataPoints[sortedDataPoints.length - 2].timestamp).getTime();
  
  // Get the last N actual values for forecasting
  const lastValues = sortedDataPoints.slice(-windowSize).map(point => point.value);
  
  for (let i = 1; i <= forecastHorizon; i++) {
    const futureTime = lastDataPointTime + i * intervalMs;
    
    // Calculate forecast using moving average
    const sum = lastValues.reduce((a, b) => a + b, 0);
    const forecast = sum / windowSize;
    
    // Add forecast to moving averages
    movingAverages.push({
      timestamp: new Date(futureTime).toISOString(),
      predicted: forecast
    });
    
    // Update last values for next iteration (shift and add new forecast)
    lastValues.shift();
    lastValues.push(forecast);
  }
  
  // Calculate error metrics (only for points where we have actual values)
  const pointsWithActual = movingAverages.filter(point => point.actual !== undefined);
  const errors = pointsWithActual.map(point => (point.actual as number) - point.predicted);
  const squaredErrors = errors.map(err => err * err);
  const mse = squaredErrors.reduce((a, b) => a + b, 0) / pointsWithActual.length;
  const rmse = Math.sqrt(mse);
  const mae = errors.map(err => Math.abs(err)).reduce((a, b) => a + b, 0) / pointsWithActual.length;
  
  return {
    id: generateId(),
    type: 'forecasting',
    timeSeriesId: data.id,
    results: {
      windowSize,
      forecastHorizon,
      movingAverages,
      forecast: movingAverages.slice(-forecastHorizon),
      summary: `Forecasting analysis using a ${windowSize}-point moving average 
      predicts values for the next ${forecastHorizon} time periods. The model 
      achieved a mean absolute error of ${mae.toFixed(2)}.`
    },
    metrics: {
      mse,
      rmse,
      mae
    },
    createdAt: new Date().toISOString()
  };
};

// Simple anomaly detection using Z-score
const performAnomalyDetection = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Use threshold from parameters or default to 2 (standard deviations)
  const zScoreThreshold = parameters?.zScoreThreshold || 2;
  
  // Calculate mean and standard deviation
  const values = sortedDataPoints.map(point => point.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Detect anomalies using Z-score
  const anomalies = sortedDataPoints.map(point => {
    const zScore = (point.value - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > zScoreThreshold;
    
    return {
      timestamp: point.timestamp,
      value: point.value,
      zScore,
      isAnomaly
    };
  });
  
  const anomalyCount = anomalies.filter(point => point.isAnomaly).length;
  const anomalyPercentage = (anomalyCount / anomalies.length) * 100;
  
  return {
    id: generateId(),
    type: 'anomaly',
    timeSeriesId: data.id,
    results: {
      zScoreThreshold,
      mean,
      stdDev,
      anomalies,
      anomalyCount,
      anomalyPercentage,
      summary: `Anomaly detection using Z-score identified ${anomalyCount} anomalies 
      (${anomalyPercentage.toFixed(2)}% of data points) using a threshold of ${zScoreThreshold} 
      standard deviations from the mean. The mean value was ${mean.toFixed(2)} with a 
      standard deviation of ${stdDev.toFixed(2)}.`
    },
    createdAt: new Date().toISOString()
  };
};

// Logistic regression for binary outcomes
const performLogisticRegression = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Extract parameters
  const regularization = parameters?.regularization || 0.1;
  const threshold = parameters?.threshold || 0.5;
  
  // Convert timestamps to numeric values (milliseconds since epoch)
  const x = sortedDataPoints.map(point => new Date(point.timestamp).getTime());
  const y = sortedDataPoints.map(point => point.value);
  
  // Normalize x values for numerical stability
  const xMin = Math.min(...x);
  const xRange = Math.max(...x) - xMin;
  const xNorm = x.map(val => (val - xMin) / xRange);
  
  // Normalize y values to 0-1 range for binary classification
  const yMax = Math.max(...y);
  const yMin = Math.min(...y);
  const yNorm = y.map(val => (val - yMin) / (yMax - yMin > 0 ? yMax - yMin : 1));
  
  // Simple logistic regression using gradient descent
  let beta0 = 0; // intercept
  let beta1 = 0; // slope
  const learningRate = 0.03;
  const iterations = 1000;
  
  // Sigmoid function
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  
  // Perform gradient descent to estimate parameters
  for (let iter = 0; iter < iterations; iter++) {
    let gradientB0 = 0;
    let gradientB1 = 0;
    
    for (let i = 0; i < xNorm.length; i++) {
      const p = sigmoid(beta0 + beta1 * xNorm[i]);
      gradientB0 += (p - yNorm[i]);
      gradientB1 += (p - yNorm[i]) * xNorm[i];
      
      // Add L2 regularization
      gradientB1 += regularization * beta1;
    }
    
    gradientB0 /= xNorm.length;
    gradientB1 /= xNorm.length;
    
    beta0 -= learningRate * gradientB0;
    beta1 -= learningRate * gradientB1;
  }
  
  // Generate probabilities and predicted classes
  const probabilities = xNorm.map(xVal => sigmoid(beta0 + beta1 * xVal));
  const predictions = probabilities.map(p => p >= threshold ? 1 : 0);
  
  // Calculate accuracy metrics if we have binary y values
  const binarizedY = yNorm.map(y => y >= 0.5 ? 1 : 0);
  
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] === 1 && binarizedY[i] === 1) truePositives++;
    if (predictions[i] === 1 && binarizedY[i] === 0) falsePositives++;
    if (predictions[i] === 0 && binarizedY[i] === 0) trueNegatives++;
    if (predictions[i] === 0 && binarizedY[i] === 1) falseNegatives++;
  }
  
  const accuracy = (truePositives + trueNegatives) / predictions.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  
  // Calculate the deviance (negative log-likelihood)
  let deviance = 0;
  for (let i = 0; i < xNorm.length; i++) {
    const p = probabilities[i];
    deviance -= binarizedY[i] * Math.log(p + 1e-10) + (1 - binarizedY[i]) * Math.log(1 - p + 1e-10);
  }
  
  // Calculate AUC (area under ROC curve) - simplified version
  const sortedPairs = probabilities.map((p, i) => ({ prob: p, actual: binarizedY[i] }))
    .sort((a, b) => b.prob - a.prob);
  
  let auc = 0;
  let truePositiveRate = 0;
  let previousFalsePositiveRate = 0;
  let positiveCount = binarizedY.filter(y => y === 1).length;
  let negativeCount = binarizedY.filter(y => y === 0).length;
  
  if (positiveCount > 0 && negativeCount > 0) {
    let truePositiveSoFar = 0;
    let falsePositiveSoFar = 0;
    
    for (let i = 0; i < sortedPairs.length; i++) {
      if (sortedPairs[i].actual === 1) {
        truePositiveSoFar++;
      } else {
        falsePositiveSoFar++;
        let falsePositiveRate = falsePositiveSoFar / negativeCount;
        truePositiveRate = truePositiveSoFar / positiveCount;
        auc += (falsePositiveRate - previousFalsePositiveRate) * truePositiveRate;
        previousFalsePositiveRate = falsePositiveRate;
      }
    }
    // Add the final rectangle
    auc += (1 - previousFalsePositiveRate) * truePositiveRate;
  }
  
  return {
    id: generateId(),
    type: 'logistic-regression',
    timeSeriesId: data.id,
    results: {
      intercept: beta0,
      slope: beta1,
      probabilities,
      predictions: probabilities.map(p => p * (yMax - yMin) + yMin), // Rescale to original range
      threshold,
      summary: `Logistic regression found a ${beta1 > 0 ? 'positive' : 'negative'} relationship 
      with coefficient ${beta1.toFixed(4)}. The model achieved an accuracy of 
      ${(accuracy * 100).toFixed(2)}% and AUC of ${auc.toFixed(3)}.`
    },
    metrics: {
      accuracy,
      precision,
      recall,
      f1Score,
      auc,
      deviance
    },
    createdAt: new Date().toISOString()
  };
};

// Poisson regression for count data
const performPoissonRegression = (
  data: TimeSeriesData,
  sortedDataPoints: DataPoint[],
  parameters?: Record<string, any>
): AnalysisResult => {
  // Extract parameters
  const linkFunction = parameters?.linkFunction || 'log';
  
  // Convert timestamps to numeric values (milliseconds since epoch)
  const x = sortedDataPoints.map(point => new Date(point.timestamp).getTime());
  const y = sortedDataPoints.map(point => Math.max(0, point.value)); // Ensure all values are non-negative
  
  // Normalize x values for numerical stability
  const xMin = Math.min(...x);
  const xRange = Math.max(...x) - xMin;
  const xNorm = x.map(val => (val - xMin) / xRange);
  
  // Link functions
  const applyLink = (mu: number): number => {
    switch (linkFunction) {
      case 'log': return Math.log(mu + 1e-10);
      case 'identity': return mu;
      case 'sqrt': return Math.sqrt(mu + 1e-10);
      default: return Math.log(mu + 1e-10);
    }
  };
  
  const applyInverseLink = (eta: number): number => {
    switch (linkFunction) {
      case 'log': return Math.exp(eta);
      case 'identity': return Math.max(0, eta);
      case 'sqrt': return eta * eta;
      default: return Math.exp(eta);
    }
  };
  
  // Simple Poisson regression using iteratively reweighted least squares (simplified)
  let beta0 = 0; // intercept
  let beta1 = 0; // slope
  const iterations = 20;
  
  // Perform IRLS to estimate parameters
  for (let iter = 0; iter < iterations; iter++) {
    const eta = xNorm.map(xVal => beta0 + beta1 * xVal);
    const mu = eta.map(applyInverseLink);
    
    let sumW = 0;
    let sumWZ = 0;
    let sumWX = 0;
    let sumWZX = 0;
    let sumWXX = 0;
    
    for (let i = 0; i < xNorm.length; i++) {
      // Calculate working weight and response
      const w = mu[i]; // Weight is the mean for Poisson
      const z = eta[i] + (y[i] - mu[i]) / (mu[i] || 1e-10); // Working response
      
      sumW += w;
      sumWZ += w * z;
      sumWX += w * xNorm[i];
      sumWZX += w * z * xNorm[i];
      sumWXX += w * xNorm[i] * xNorm[i];
    }
    
    // Update coefficients
    const denominator = sumW * sumWXX - sumWX * sumWX;
    if (Math.abs(denominator) > 1e-10) {
      const newBeta0 = (sumWZ * sumWXX - sumWZX * sumWX) / denominator;
      const newBeta1 = (sumW * sumWZX - sumWX * sumWZ) / denominator;
      
      beta0 = newBeta0;
      beta1 = newBeta1;
    }
  }
  
  // Generate predictions
  const predictions = xNorm.map(xVal => applyInverseLink(beta0 + beta1 * xVal));
  
  // Calculate metrics
  const residuals = y.map((yVal, i) => yVal - predictions[i]);
  const deviance = y.reduce((sum, yVal, i) => {
    const muVal = predictions[i];
    return sum + 2 * (yVal * Math.log((yVal || 1e-10) / (muVal || 1e-10)) - (yVal - muVal));
  }, 0);
  
  const nullDeviance = y.reduce((sum, yVal) => {
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    return sum + 2 * (yVal * Math.log((yVal || 1e-10) / (yMean || 1e-10)) - (yVal - yMean));
  }, 0);
  
  const pseudoRSquared = 1 - (deviance / nullDeviance);
  
  // Calculate squared errors for RMSE
  const squaredErrors = residuals.map(r => r * r);
  const mse = squaredErrors.reduce((a, b) => a + b, 0) / y.length;
  const rmse = Math.sqrt(mse);
  
  return {
    id: generateId(),
    type: 'poisson-regression',
    timeSeriesId: data.id,
    results: {
      intercept: beta0,
      slope: beta1,
      linkFunction,
      predictions,
      summary: `Poisson regression with ${linkFunction} link found a ${beta1 > 0 ? 'positive' : 'negative'} 
      relationship with coefficient ${beta1.toFixed(4)}. The model explains ${(pseudoRSquared * 100).toFixed(2)}% 
      of the null deviance. RMSE: ${rmse.toFixed(2)}.`
    },
    metrics: {
      deviance,
      nullDeviance,
      pseudoRSquared,
      mse,
      rmse
    },
    createdAt: new Date().toISOString()
  };
};

