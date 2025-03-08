
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from '@/components/layout/Header'
import Index from '@/pages/Index'
import DataPage from '@/pages/DataPage'
import AnalysisPage from '@/pages/AnalysisPage'
import ReportsPage from '@/pages/ReportsPage'
import NotFound from '@/pages/NotFound'
import { TimeSeriesData } from '@/lib/types'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [appData, setAppData] = useState<TimeSeriesData | null>(null);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedData = localStorage.getItem('timeseriesData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAppData(parsedData);
      } catch (err) {
        console.error("Error loading saved data:", err);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (appData) {
      localStorage.setItem('timeseriesData', JSON.stringify(appData));
    }
  }, [appData]);

  const handleDataUpdate = (data: TimeSeriesData) => {
    setAppData(data);
    localStorage.setItem('timeseriesData', JSON.stringify(data));
  };

  const handleReset = () => {
    setAppData(null);
    localStorage.removeItem('timeseriesData');
  };

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
