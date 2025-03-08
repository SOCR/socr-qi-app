
import React, { useState } from "react";
import { TimeSeriesData } from "@/lib/types";
import { formatDate } from "@/lib/dataUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search } from "lucide-react";

interface DataTableProps {
  data: TimeSeriesData | TimeSeriesData[];
}

const DataTable = ({ data }: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const rowsPerPage = 10;
  
  // Handle both single and multiple time series
  const dataArray = Array.isArray(data) ? data : [data];
  
  // Create a combined view of all data points with series information
  const allDataPoints = dataArray.flatMap((series) => 
    series.dataPoints.map(point => ({
      ...point,
      seriesName: series.name,
      seriesId: point.seriesId || series.id
    }))
  );
  
  // Filter the data points based on search and selected series
  const filteredData = allDataPoints.filter(point => {
    const matchesSearch = 
      searchTerm === "" ||
      point.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.value.toString().includes(searchTerm) ||
      (point.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (point.subjectId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.seriesName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeries = 
      selectedSeries === "all" || 
      point.seriesId === selectedSeries;
    
    return matchesSearch && matchesSeries;
  });
  
  // Sort by timestamp
  filteredData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Paginate the data
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Get unique series for filtering
  const uniqueSeries = [...new Set(allDataPoints.map(point => point.seriesId))];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Table View</CardTitle>
        <CardDescription>
          Tabular representation of time series data
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
            />
          </div>
          
          <Select 
            value={selectedSeries} 
            onValueChange={(value) => {
              setSelectedSeries(value);
              setCurrentPage(1); // Reset to first page on new selection
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
              {uniqueSeries.map((seriesId) => (
                <SelectItem key={seriesId} value={seriesId}>
                  {dataArray.find(s => s.id === seriesId)?.name || `Series ${seriesId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((point, index) => (
                  <TableRow key={`${point.seriesId}-${point.timestamp}-${index}`}>
                    <TableCell>{point.seriesName}</TableCell>
                    <TableCell>{formatDate(point.timestamp)}</TableCell>
                    <TableCell>{point.value.toFixed(2)}</TableCell>
                    <TableCell>{point.category || "-"}</TableCell>
                    <TableCell>{point.subjectId || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredData.length > rowsPerPage && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {/* Show page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <button
                        className={`h-9 w-9 rounded-md ${currentPage === pageNum ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
