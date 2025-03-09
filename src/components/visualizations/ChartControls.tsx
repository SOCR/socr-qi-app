
import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";

interface ChartControlsProps {
  isZoomed: boolean;
  onResetZoom: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({ 
  isZoomed, 
  onResetZoom,
  onZoomIn,
  onZoomOut 
}) => {
  return (
    <div className="flex items-center gap-2">
      {isZoomed && (
        <Button 
          variant="outline"
          size="sm"
          onClick={onResetZoom}
          className="flex items-center gap-1"
        >
          <Maximize className="h-4 w-4" />
          <span>Reset Zoom</span>
        </Button>
      )}
      {onZoomIn && (
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          className="flex items-center gap-1"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      )}
      {onZoomOut && (
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          className="flex items-center gap-1"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ChartControls;
