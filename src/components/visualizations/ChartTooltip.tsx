
import React from "react";
import { TooltipProps } from "recharts";

interface ChartTooltipProps extends TooltipProps<number, string> {
  labelFormatter?: (label: string) => string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, labelFormatter }) => {
  if (!active || !payload || payload.length === 0) return null;

  const formattedLabel = labelFormatter ? labelFormatter(label) : `Time: ${label}`;

  return (
    <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md text-sm">
      <p className="font-semibold mb-1">{formattedLabel}</p>
      {payload.map((entry, index) => {
        // Format the series name if needed
        const seriesName = typeof entry.name === 'string' ? 
          (entry.name.includes('_predicted') ? 
            entry.name.split('_predicted')[0] + ' (Predicted)' : 
            entry.name
          ) : 
          entry.name;

        return (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{seriesName}:</span>
            <span>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChartTooltip;
