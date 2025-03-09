
import React from "react";
import { TimeSeriesData } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupBySeriesId } from "@/lib/dataUtils";

interface SeriesSelectorProps {
  data: TimeSeriesData | TimeSeriesData[];
  selectedSeries: string[];
  targetSeries: string | null;
  onSeriesSelect: (seriesIds: string[]) => void;
  onTargetSelect: (seriesId: string) => void;
}

const SeriesSelector = ({
  data,
  selectedSeries,
  targetSeries,
  onSeriesSelect,
  onTargetSelect,
}: SeriesSelectorProps) => {
  // Get all unique series IDs
  const allSeriesIds = React.useMemo(() => {
    const ids = new Set<string>();
    const dataArray = Array.isArray(data) ? data : [data];
    
    dataArray.forEach((series) => {
      // Check if it's wide format with seriesId property
      if (series.metadata?.format === 'wide' || series.dataPoints.some(p => p.seriesId)) {
        series.dataPoints.forEach((point) => {
          if (point.seriesId) {
            ids.add(point.seriesId);
          }
        });
      } else {
        // For single series without seriesId
        ids.add(series.name || `Series ${dataArray.indexOf(series) + 1}`);
      }
    });
    
    return Array.from(ids);
  }, [data]);

  const handleSeriesToggle = (seriesId: string) => {
    const newSelectedSeries = selectedSeries.includes(seriesId)
      ? selectedSeries.filter((id) => id !== seriesId)
      : [...selectedSeries, seriesId];
    
    onSeriesSelect(newSelectedSeries);
  };

  const handleTargetChange = (seriesId: string) => {
    onTargetSelect(seriesId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Series Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Target Series (to predict)</Label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
            {allSeriesIds.map((seriesId) => (
              <div key={`target-${seriesId}`} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`target-${seriesId}`}
                  name="targetSeries"
                  value={seriesId}
                  checked={targetSeries === seriesId}
                  onChange={() => handleTargetChange(seriesId)}
                  className="h-4 w-4 text-primary"
                />
                <Label
                  htmlFor={`target-${seriesId}`}
                  className="text-sm cursor-pointer"
                >
                  {seriesId}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Predictor Series (features)</Label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
            {allSeriesIds
              .filter((id) => id !== targetSeries)
              .map((seriesId) => (
                <div key={`predictor-${seriesId}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`predictor-${seriesId}`}
                    checked={selectedSeries.includes(seriesId)}
                    onCheckedChange={() => handleSeriesToggle(seriesId)}
                    disabled={targetSeries === seriesId}
                  />
                  <Label
                    htmlFor={`predictor-${seriesId}`}
                    className="text-sm cursor-pointer"
                  >
                    {seriesId}
                  </Label>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeriesSelector;
