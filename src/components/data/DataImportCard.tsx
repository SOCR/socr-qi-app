
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, FilePlus, AlertCircle } from "lucide-react";
import { parseCSVData } from "@/lib/dataUtils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImportOptions } from "@/lib/types";

interface DataImportCardProps {
  onDataImported: (data: any) => void;
}

const DataImportCard = ({ onDataImported }: DataImportCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'wide'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleOptionChange = (key: keyof ImportOptions, value: string) => {
    setImportOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      
      // Parse CSV file with improved handling for wide format
      const data = parseCSVData(content, importOptions);
      
      onDataImported(data);
      toast({
        title: "Data imported successfully",
        description: `Imported ${data.dataPoints.length} data points`,
      });
    } catch (err) {
      console.error("Error importing data:", err);
      setError(err instanceof Error ? err.message : "Failed to import data");
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileUp className="mr-2 h-5 w-5" />
          Import Data
        </CardTitle>
        <CardDescription>
          Import your time-series data from a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <FilePlus className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                {file ? file.name : "Choose a CSV file"}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                CSV file with time series data
              </span>
            </label>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="format-select">Data Format</Label>
              <Select 
                value={importOptions.format} 
                onValueChange={(value) => handleOptionChange("format", value as 'wide' | 'long')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wide">Wide Format (one column for time, others for values)</SelectItem>
                  <SelectItem value="long">Long Format (separate columns for timestamp, value, and ID)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {importOptions.format === 'wide' 
                  ? "Time/date column will be auto-detected. Each other column will represent a separate time series."
                  : "For long format, please specify column names below."}
              </p>
            </div>

            {importOptions.format === 'long' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timestampColumn">Timestamp Column</Label>
                    <Input 
                      id="timestampColumn"
                      value={importOptions.timestampColumn || ""}
                      onChange={(e) => handleOptionChange("timestampColumn", e.target.value)}
                      placeholder="e.g., Date, Time, Timestamp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valueColumn">Value Column</Label>
                    <Input 
                      id="valueColumn"
                      value={importOptions.valueColumn || ""}
                      onChange={(e) => handleOptionChange("valueColumn", e.target.value)}
                      placeholder="e.g., Value, Measurement"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seriesIdColumn">Series ID Column</Label>
                  <Input 
                    id="seriesIdColumn"
                    value={importOptions.seriesIdColumn || ""}
                    onChange={(e) => handleOptionChange("seriesIdColumn", e.target.value)}
                    placeholder="e.g., Variable, Metric, SeriesID"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryColumn">Category Column (optional)</Label>
                    <Input 
                      id="categoryColumn"
                      value={importOptions.categoryColumn || ""}
                      onChange={(e) => handleOptionChange("categoryColumn", e.target.value)}
                      placeholder="e.g., Category, Group"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjectIdColumn">Subject ID Column (optional)</Label>
                    <Input 
                      id="subjectIdColumn"
                      value={importOptions.subjectIdColumn || ""}
                      onChange={(e) => handleOptionChange("subjectIdColumn", e.target.value)}
                      placeholder="e.g., Subject, Patient"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setFile(null)} disabled={!file || isLoading}>
          Clear
        </Button>
        <Button onClick={handleImport} disabled={!file || isLoading}>
          {isLoading ? "Importing..." : "Import"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataImportCard;
