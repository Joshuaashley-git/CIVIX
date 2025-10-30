import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGlobalCountdown } from "@/lib/CountdownContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, HelpCircle, CheckCircle, Download, Home, Vote } from "lucide-react";

const VoteConfirmation = () => {
  const navigate = useNavigate();
  const { formatted, reset } = useGlobalCountdown();

  return (
    <div className="min-h-screen bg-gradient-subtle font-display">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Civix</h1>
          <div className="flex items-center gap-2 text-accent font-semibold">
            <Clock className="w-4 h-4" />
            <span className="text-lg">{formatted}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">English</span>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Progress Steps - All completed */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 bg-success text-success-foreground">
                <CheckCircle className="w-6 h-6" />
              </div>
              {step < 4 && (
                <div className="w-12 h-1 mx-2 rounded-full bg-success" />
              )}
            </div>
          ))}
        </div>

        {/* Confirmation Card */}
        <Card className="mb-8 shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-success rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-success-foreground" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">Vote Cast Successfully!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your vote has been securely recorded and encrypted. Thank you for participating in the democratic process.
            </p>

            {/* Vote Details */}
            <Card className="bg-muted/50 border-border/30 mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Vote Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Election:</span>
                    <span className="font-medium">Mayor Election 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidate:</span>
                    <span className="font-medium">Sarah Johnson</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vote ID:</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      #VT2024-7891234
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                className="group"
              >
                <Download className="w-5 h-5 mr-2 transition-transform group-hover:translate-y-1" />
                Download Receipt
              </Button>
              
              <Button 
                size="lg"
                className="bg-gradient-accent hover:shadow-lg hover:scale-105 transition-all duration-300"
                onClick={() => { reset(120); navigate('/'); }}
              >
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Confirmation */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 text-sm flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              End-to-end encrypted
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Vote className="w-3 h-3" />
              Blockchain verified
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Audit trail created
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Your vote is anonymous and cannot be traced back to you. Receipt ID can be used for verification purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmation;