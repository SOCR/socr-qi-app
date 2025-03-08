
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataPoint, TimeSeriesData } from '@/lib/types';
import { formatDate, groupBySeriesId } from '@/lib/dataUtils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Download } from 'lucide-react';

interface DataTableProps {
  data: TimeSeriesData | TimeSeriesData[];
}

const DataTable = ({ data }: DataTableProps) => {
  const [wideFormatData, setWideFormatData] = useState<{
    headers: string[];
    rows: { [key: string]: any }[];
  }>({ headers: [], rows: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState<{ [key: string]: any }[]>([]);
  
  // Convert data to wide format for display
  useEffect(() => {
    if (!data) return;
    
    let headers: string[] = ['Timestamp'];
    let rows: { [key: string]: any }[] = [];
    
    if (Array.isArray(data)) {
      // Multiple time series datasets
      // Create one column for each dataset
      headers = ['Timestamp', ...data.map(d => d.name || d.id)];
      
      // Group all data points by timestamp
      const groupedByTimestamp: { [key: string]: { [series: string]: any } } = {};
      
      data.forEach((series, seriesIndex) => {
        series.dataPoints.forEach(point => {
          const timestamp = point.timestamp;
          if (!groupedByTimestamp[timestamp]) {
            groupedByTimestamp[timestamp] = { Timestamp: formatDate(timestamp) };
          }
          const seriesName = series.name || series.id;
          groupedByTimestamp[timestamp][seriesName] = point.value;
        });
      });
      
      // Convert to array and sort by timestamp
      rows = Object.values(groupedByTimestamp);
      rows.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
    } else {
      // Single time series dataset
      if (data.metadata?.format === 'wide') {
        // For wide format, extract unique series IDs
        const seriesIds = new Set<string>();
        
        data.dataPoints.forEach(point => {
          if (point.seriesId) {
            seriesIds.add(point.seriesId);
          }
        });
        
        // Set headers
        headers = ['Timestamp', ...Array.from(seriesIds)];
        
        // Group data points by timestamp
        const groupedByTimestamp: { [key: string]: { [series: string]: any } } = {};
        
        data.dataPoints.forEach(point => {
          const timestamp = point.timestamp;
          if (!groupedByTimestamp[timestamp]) {
            groupedByTimestamp[timestamp] = { Timestamp: formatDate(timestamp) };
          }
          if (point.seriesId) {
            groupedByTimestamp[timestamp][point.seriesId] = point.value;
          }
        });
        
        // Convert to array and sort by timestamp
        rows = Object.values(groupedByTimestamp);
        rows.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
      } else {
        // For long format, create one row per timestamp
        headers = ['Timestamp', 'Value'];
        
        if (data.dataPoints.some(p => p.category)) {
          headers.push('Category');
        }
        
        if (data.dataPoints.some(p => p.subjectId)) {
          headers.push('Subject ID');
        }
        
        rows = data.dataPoints.map(point => {
          const row: { [key: string]: any } = {
            Timestamp: formatDate(point.timestamp),
            Value: point.value
          };
          
          if (point.category) {
            row.Category = point.category;
          }
          
          if (point.subjectId) {
            row['Subject ID'] = point.subjectId;
          }
          
          return row;
        });
        
        // Sort by timestamp
        rows.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
      }
    }
    
    setWideFormatData({ headers, rows });
  }, [data]);
  
  // Filter data based on search term
  useEffect(() => {
    if (!wideFormatData.rows.length) {
      setFilteredData([]);
      return;
    }
    
    if (!searchTerm) {
      setFilteredData(wideFormatData.rows);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = wideFormatData.rows.filter(row => {
      return Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [wideFormatData, searchTerm]);
  
  // Download data as CSV
  const handleDownload = () => {
    const { headers, rows } = wideFormatData;
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle commas in data by quoting
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (!data) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Table</CardTitle>
        <CardDescription>
          View and filter your time series data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>{size} rows</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full md:w-auto" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {wideFormatData.headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {wideFormatData.headers.map((header) => (
                      <TableCell key={`${rowIndex}-${header}`}>
                        {row[header] !== undefined && row[header] !== null
                          ? typeof row[header] === 'number'
                            ? row[header].toFixed(2)
                            : row[header]
                          : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={wideFormatData.headers.length} className="text-center py-4">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        {totalPages > 1 && (
          <Pagination className="w-full flex justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                
                // Show current page, first, last, and siblings
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for page gaps
                if (page === 2 || page === totalPages - 1) {
                  return <PaginationItem key={page}>...</PaginationItem>;
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
};

export default DataTable;
