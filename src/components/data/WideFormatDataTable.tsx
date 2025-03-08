
import React, { useMemo, useState } from "react";
import { TimeSeriesData } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatDate } from "@/lib/dataUtils";
import { Input } from "@/components/ui/input";

interface WideFormatDataTableProps {
  data: TimeSeriesData;
  title?: string;
  description?: string;
}

const WideFormatDataTable = ({ data, title, description }: WideFormatDataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Group data by timestamp for wide format display
  const tableData = useMemo(() => {
    // Get all unique series IDs
    const seriesIds = new Set<string>();
    const timestamps = new Set<string>();
    
    data.dataPoints.forEach(point => {
      if (point.seriesId) {
        seriesIds.add(point.seriesId);
      }
      timestamps.add(point.timestamp);
    });
    
    // Sort timestamps chronologically
    const sortedTimestamps = Array.from(timestamps).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Create rows with timestamp and values for each series
    const rows = sortedTimestamps.map(timestamp => {
      const row: Record<string, any> = {
        timestamp,
        formattedTime: formatDate(timestamp)
      };
      
      // Add empty value for each series
      seriesIds.forEach(seriesId => {
        row[seriesId] = null;
      });
      
      // Fill in values from data points
      data.dataPoints.forEach(point => {
        if (point.timestamp === timestamp && point.seriesId) {
          row[point.seriesId] = point.value;
        }
      });
      
      return row;
    });
    
    return {
      seriesIds: Array.from(seriesIds),
      rows
    };
  }, [data]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery) return tableData.rows;
    
    return tableData.rows.filter(row => {
      // Search in timestamp
      if (row.formattedTime.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      // Search in values
      for (const seriesId of tableData.seriesIds) {
        if (row[seriesId] !== null && 
            row[seriesId].toString().includes(searchQuery)) {
          return true;
        }
      }
      
      return false;
    });
  }, [tableData, searchQuery]);

  // Paginate the filtered rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title || data.name}</CardTitle>
            <CardDescription>
              {description || `${data.dataPoints.length} data points. Showing timeline view.`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              className="w-40 md:w-60"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap font-bold">Timestamp</TableHead>
                {tableData.seriesIds.map(seriesId => (
                  <TableHead key={seriesId} className="whitespace-nowrap">
                    {seriesId}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="whitespace-nowrap">
                    {row.formattedTime}
                  </TableCell>
                  {tableData.seriesIds.map(seriesId => (
                    <TableCell key={seriesId}>
                      {row[seriesId] !== null ? row[seriesId].toFixed(4) : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredRows.length, (currentPage - 1) * rowsPerPage + 1)}-
              {Math.min(filteredRows.length, currentPage * rowsPerPage)} of {filteredRows.length} entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  Page {currentPage} of {totalPages}
                </PaginationItem>
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

export default WideFormatDataTable;
