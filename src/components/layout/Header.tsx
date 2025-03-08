
import React from "react";
import { Link } from "react-router-dom";
import { Activity, BookOpen, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDocumentation = () => {
    window.open("https://github.com/SOCR/socr-qi-app", "_blank");
    toast({
      title: "Documentation",
      description: "Opening SOCR project documentation in a new tab"
    });
  };

  const handleResetApp = () => {
    navigate("/", { replace: true });
    toast({
      title: "App Reset",
      description: "Application has been reset"
    });
  };

  const socrLinks = [
    { name: "SOCR", url: "https://www.socr.umich.edu/" },
    { name: "SOCR Data", url: "https://wiki.socr.umich.edu/index.php/SOCR_Data" },
    { name: "SOCR Webapps", url: "https://socr.umich.edu/HTML5/" },
    { name: "SOCR GitHub", url: "https://github.com/SOCR/socr-qi-app" }
  ];

  return (
    <header className="bg-white border-b border-gray-200 py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a 
            href="https://www.socr.umich.edu/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <img 
              src="/lovable-uploads/085562a1-f0fd-40e9-857b-4f9b7dfdd9ff.png" 
              alt="SOCR Logo" 
              className="h-8 w-auto mr-2" 
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </a>
          <h1 className="text-xl font-bold text-gray-800">
            SOCR Quality Improvement App
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            {socrLinks.map((link) => (
              <a 
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-600 hover:text-primary flex items-center"
              >
                {link.name}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            ))}
          </div>

          {/* Mobile-friendly dropdown for SOCR links */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  SOCR Links
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>SOCR Resources</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {socrLinks.map((link) => (
                  <DropdownMenuItem key={link.name} asChild>
                    <a 
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      {link.name}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleDocumentation}>
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button size="sm" onClick={handleResetApp}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset App
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
