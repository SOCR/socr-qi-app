
import React from "react";
import { Link } from "react-router-dom";
import { Activity, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">
            Quality Improvement Hub
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/data" className="text-gray-600 hover:text-primary transition-colors">
            Data Manager
          </Link>
          <Link to="/analysis" className="text-gray-600 hover:text-primary transition-colors">
            Analysis
          </Link>
          <Link to="/reports" className="text-gray-600 hover:text-primary transition-colors">
            Reports
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
