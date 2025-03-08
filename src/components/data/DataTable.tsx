
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataPoint, TimeSeriesData } from '@/lib/types';
import { formatDate } from '@/lib/dataUtils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataTableProps {
  data: TimeSeriesData | TimeSeriesData[];
}

const DataTable = ({ data }: DataTableProps) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [series, setSeries] = useState<string[]>([]);
  const [tableView, setTableView] = useState<'wide' | 'long'>('wide');
  
  // Structure for wide format display
  const [wideFormatData, setWideFormatData] = useState<Array<Record<string, any>>>([]);
  const [wideFormatColumns, setWideFormatColumns] = useState<string[]>([]);
  
  // Structure for long format display (legacy)
  const [longFormatData, setLongFormatData] = useState<DataPoint[]>([]);
  const [filteredData, setFilteredData] = useState<DataPoint[] | Array<Record<string, any>>>([]);
  
  // Detect data format and prepare for display
  useEffect(() => {
    if (!data) return;
    
    let allDataPoints: DataPoint[] = [];
    let seriesIds: Set<string> = new Set(['all']);
    
    // Prepare wide format data
    let wideData: Array<Record<string, any>> = [];
    let columns: Set<string> = new Set(['timestamp']);
    
    if (Array.isArray(data)) {
      // Handle multiple time series
      data.forEach((series, index) => {
        const seriesId = series.id || `series-${index}`;
        seriesIds.add(seriesId);
        
        // Add to long format
        series.dataPoints.forEach(point => {
          allDataPoints.push({
            ...point,
            seriesId: point.seriesId || seriesId
          });
        });
        
        // Try to combine into wide format if possible
        series.dataPoints.forEach(point => {
          const timestamp = point.timestamp;
          
          // Find or create entry for this timestamp
          let entry = wideData.find(item => item.timestamp === timestamp);
          if (!entry) {
            entry = { timestamp };
            wideData.push(entry);
          }
          
          // Add this series' value
          entry[seriesId] = point.value;
          columns.add(seriesId);
        });
      });
    } else if (data) {
      // Single time series
      if (data.metadata?.format === 'wide') {
        // Wide format data with column headers
        data.dataPoints.forEach(point => {
          const widePoint: Record<string, any> = { timestamp: point.timestamp };
          
          Object.entries(point).forEach(([key, value]) => {
            if (key !== 'timestamp') {
              widePoint[key] = value;
              columns.add(key);
              seriesIds.add(key);
            }
          });
          
          wideData.push(widePoint);
        });
      } else {
        // Convert to wide format if not already
        data.dataPoints.forEach(point => {
          if (point.seriesId) {
            seriesIds.add(point.seriesId);
          }
          
          // Add to long format
          allDataPoints.push(point);
          
          // Try to add to wide format
          const timestamp = point.timestamp;
          const seriesId = point.seriesId || 'value';
          
          let entry = wideData.find(item => item.timestamp === timestamp);
          if (!entry) {
            entry = { timestamp };
            wideData.push(entry);
          }
          
          entry[seriesId] = point.value;
          columns.add(seriesId);
        });
      }
    }
    
    // Set the data
    setLongFormatData(allDataPoints);
    setWideFormatData(wideData);
    setWideFormatColumns(Array.from(columns));
    setSeries(Array.from(seriesIds));
    
    // Auto-detect if this is true wide format data
    const isWideFormat = data.metadata?.format === 'wide' || 
      (!Array.isArray(data) && data.dataPoints[0] && 
       Object.keys(data.dataPoints[0]).some(key => 
         key !== 'timestamp' && key !== 'value' && 
         key !== 'category' && key !== 'seriesId' && key !== 'subjectId'));
    
    setTableView(isWideFormat ? 'wide' : 'long');
  }, [data]);
  
  // Filter and paginate data
  useEffect(() => {
    if (tableView === 'wide') {
      let results = [...wideFormatData];
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        results = results.filter(entry => {
          // Check if any column value includes the search term
          return Object.entries(entry).some(([key, value]) => {
            return value && value.toString().toLowerCase().includes(searchLower);
          });
        });
      }
      
      // Filter by series (only in wide format if selected series isn't 'all')
      if (selectedSeries !== 'all') {
        results = results.filter(entry => entry[selectedSeries] !== undefined);
      }
      
      setFilteredData(results);
    } else {
      // Legacy long format filtering
      let results = [...longFormatData];
      
      // Filter by series
      if (selectedSeries !== 'all') {
        results = results.filter(point => point.seriesId === selectedSeries);
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        results = results.filter(point => 
          (point.timestamp && point.timestamp.toLowerCase().includes(searchLower)) ||
          (typeof point.value === 'number' && point.value.toString().includes(searchLower)) ||
          (point.category && point.category.toLowerCase().includes(searchLower)) ||
          (point.subjectId && point.subjectId.toLowerCase().includes(searchLower)) ||
          (point.seriesId && point.seriesId.toLowerCase().includes(searchLower))
        );
      }
      
      setFilteredData(results);
    }
    
    setCurrentPage(1); // Reset to first page when filters change
  }, [longFormatData, wideFormatData, wideFormatColumns, searchTerm, selectedSeries, tableView]);
  
  // Download data as CSV
  const handleDownload = () => {
    if (tableView === 'wide') {
      // Wide format download
      const headers = wideFormatColumns;
      
      const csvContent = [
        headers.join(','),
        ...filteredData.map(entry => 
          headers.map(column => entry[column] !== undefined ? entry[column] : '').join(',')
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
    } else {
      // Long format download (legacy)
      const headers = ['Timestamp', 'Value', 'SeriesID', 'Category', 'SubjectID'];
      
      const csvContent = [
        headers.join(','),
        ...filteredData.map((point: any) => [
          point.timestamp,
          point.value,
          point.seriesId || '',
          point.category || '',
          point.subjectId || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (!data) return null;
  
  // Render wide format table (new)
  const renderWideFormatTable = () => {
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {wideFormatColumns.map(column => (
                <TableHead key={column} className="font-medium">
                  {column === 'timestamp' ? 'Timestamp' : column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((entry: any, rowIndex) => (
                <TableRow key={`row-${rowIndex}-${entry.timestamp}`}>
                  {wideFormatColumns.map(column => (
                    <TableCell key={`${rowIndex}-${column}`}>
                      {column === 'timestamp' 
                        ? formatDate(entry.timestamp) 
                        : (entry[column] !== undefined 
                            ? (typeof entry[column] === 'number' 
                                ? entry[column].toFixed(2) 
                                : entry[column])
                            : '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={wideFormatColumns.length} className="text-center py-4">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render long format table (legacy)
  const renderLongFormatTable = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Series ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subject ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((point: any, index) => (
                <TableRow key={`${point.timestamp}-${point.seriesId || ''}-${index}`}>
                  <TableCell>{point.timestamp ? formatDate(point.timestamp) : '-'}</TableCell>
                  <TableCell>{typeof point.value === 'number' ? point.value.toFixed(2) : '-'}</TableCell>
                  <TableCell>{point.seriesId || '-'}</TableCell>
                  <TableCell>{point.category || '-'}</TableCell>
                  <TableCell>{point.subjectId || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
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
              value={tableView}
              onValueChange={(value: 'wide' | 'long') => setTableView(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Table format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wide">Wide Format</SelectItem>
                <SelectItem value="long">Long Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-48">
            <Select
              value={selectedSeries}
              onValueChange={setSelectedSeries}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select series" />
              </SelectTrigger>
              <SelectContent>
                {series.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'all' ? 'All Series' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        
        {tableView === 'wide' ? renderWideFormatTable() : renderLongFormatTable()}
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
