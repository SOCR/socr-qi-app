
import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";

interface ChartControlsProps {
  isZoomed: boolean;
  onResetZoom: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({ isZoomed, onResetZoom }) => {
  if (!isZoomed) return null;
  
  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={onResetZoom}
      className="flex items-center gap-1"
    >
      <Maximize className="h-4 w-4" />
      <span>Reset Zoom</span>
    </Button>
  );
};

export default ChartControls;
