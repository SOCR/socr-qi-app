
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesData } from "@/lib/types";
import { Database, Clock, Activity, FileText } from "lucide-react";
import { formatDate } from "@/lib/dataUtils";

interface DataSummaryProps {
  data: TimeSeriesData | TimeSeriesData[];
}

const DataSummary = ({ data }: DataSummaryProps) => {
  // Handle both single and multiple time series
  const dataArray = Array.isArray(data) ? data : [data];
  
  // Calculate summary statistics
  const totalSeries = calculateTotalSeries(dataArray);
  const totalDataPoints = dataArray.reduce((sum, series) => sum + series.dataPoints.length, 0);
  
  // Find date range
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  
  dataArray.forEach(series => {
    series.dataPoints.forEach(point => {
      const date = new Date(point.timestamp);
      
      if (!earliestDate || date < earliestDate) {
        earliestDate = date;
      }
      
      if (!latestDate || date > latestDate) {
        latestDate = date;
      }
    });
  });
  
  // Calculate time span in days (if dates are available)
  let timeSpanDays = 0;
  if (earliestDate && latestDate) {
    timeSpanDays = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Data Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time Series</p>
              <p className="text-2xl font-bold">{totalSeries}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data Points</p>
              <p className="text-2xl font-bold">{totalDataPoints}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time Span</p>
              <p className="text-2xl font-bold">{timeSpanDays} days</p>
            </div>
          </div>
          
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground">Date Range</p>
            <div className="flex flex-col">
              <span className="text-sm">
                {earliestDate ? formatDate(earliestDate.toISOString()) : 'N/A'}
              </span>
              <span className="text-sm text-muted-foreground">to</span>
              <span className="text-sm">
                {latestDate ? formatDate(latestDate.toISOString()) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate total series, accounting for wide format
const calculateTotalSeries = (dataArray: TimeSeriesData[]): number => {
  let count = 0;
  
  dataArray.forEach(series => {
    if (series.metadata?.format === 'wide') {
      // For wide format, count unique seriesId values
      const uniqueSeriesIds = new Set<string>();
      series.dataPoints.forEach(point => {
        if (point.seriesId) {
          uniqueSeriesIds.add(point.seriesId);
        }
      });
      count += uniqueSeriesIds.size || 1;
    } else {
      // For single time series or long format
      if (series.dataPoints.length > 0) {
        const uniqueSeriesIds = new Set<string>();
        series.dataPoints.forEach(point => {
          if (point.seriesId) {
            uniqueSeriesIds.add(point.seriesId);
          }
        });
        
        // If seriesIds are present, count unique ones, otherwise count as 1 series
        count += uniqueSeriesIds.size || 1;
      } else {
        count += 1; // Count empty series as 1
      }
    }
  });
  
  return count > 0 ? count : dataArray.length;
};

export default DataSummary;
