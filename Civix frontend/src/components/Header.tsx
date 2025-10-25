import { Button } from "@/components/ui/button";
import { Globe, HelpCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-4 px-6 md:px-8 lg:px-12">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-display tracking-tight">
            Civix
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Globe className="w-4 h-4 mr-2" />
            English
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;