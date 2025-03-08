
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
import { SimulationOptions } from "@/lib/types";
import { generateSimulatedData } from "@/lib/dataUtils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimulationCardProps {
  onDataGenerated: (data: any) => void;
}

const SimulationCard = ({ onDataGenerated }: SimulationCardProps) => {
  const [options, setOptions] = useState<SimulationOptions>({
    seriesCount: 3,
    pointsPerSeries: 50,
    timeSpan: 30, // 30 days
    missingDataPercentage: 10,
    noiseLevel: 5,
    trendType: "random",
    format: "wide"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleOptionChange = (key: keyof SimulationOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    try {
      const simulatedData = generateSimulatedData(options);
      onDataGenerated(simulatedData);
      toast({
        title: "Data generated successfully",
        description: `Generated ${simulatedData.length} time series with ${options.pointsPerSeries} points each`,
      });
    } catch (err) {
      console.error("Error generating data:", err);
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Failed to generate data",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Simulate Data
        </CardTitle>
        <CardDescription>
          Generate simulated time-series data for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seriesCount">Number of Series</Label>
                <Input
                  id="seriesCount"
                  type="number"
                  min="1"
                  max="10"
                  value={options.seriesCount}
                  onChange={(e) => handleOptionChange("seriesCount", parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointsPerSeries">Points Per Series</Label>
                <Input
                  id="pointsPerSeries"
                  type="number"
                  min="10"
                  max="500"
                  value={options.pointsPerSeries}
                  onChange={(e) => handleOptionChange("pointsPerSeries", parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeSpan">Time Span (days)</Label>
              <Input
                id="timeSpan"
                type="number"
                min="1"
                max="365"
                value={options.timeSpan}
                onChange={(e) => handleOptionChange("timeSpan", parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trendType">Trend Type</Label>
              <Select 
                value={options.trendType} 
                onValueChange={(value) => handleOptionChange("trendType", value)}
              >
                <SelectTrigger id="trendType">
                  <SelectValue placeholder="Select trend type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="increasing">Increasing</SelectItem>
                  <SelectItem value="decreasing">Decreasing</SelectItem>
                  <SelectItem value="cyclic">Cyclic</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Missing Data Percentage: {options.missingDataPercentage}%</Label>
              <Slider
                value={[options.missingDataPercentage || 0]}
                min={0}
                max={50}
                step={1}
                onValueChange={(values) => handleOptionChange("missingDataPercentage", values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Noise Level: {options.noiseLevel}</Label>
              <Slider
                value={[options.noiseLevel || 0]}
                min={0}
                max={20}
                step={1}
                onValueChange={(values) => handleOptionChange("noiseLevel", values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">Data Format</Label>
              <Select 
                value={options.format} 
                onValueChange={(value) => handleOptionChange("format", value)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select data format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wide">Wide Format (separate series)</SelectItem>
                  <SelectItem value="long">Long Format (combined series)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Wide format creates separate time series. Long format combines all series into one dataset.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Data"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimulationCard;
