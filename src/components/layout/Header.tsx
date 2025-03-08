
import React from "react";
import { Link } from "react-router-dom";
import { Activity, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDocumentation = () => {
    window.open("https://www.socr.umich.edu/html/SOCR_Documentation.html", "_blank");
    toast({
      title: "Documentation",
      description: "Opening SOCR documentation in a new tab"
    });
  };

  const handleNewAnalysis = () => {
    navigate("/analysis", { state: { newAnalysis: true } });
    toast({
      title: "New Analysis",
      description: "Starting a new analysis session"
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">
            SOCR Quality Improvement App
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleDocumentation}>
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button size="sm" onClick={handleNewAnalysis}>
            <BarChart3 className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
