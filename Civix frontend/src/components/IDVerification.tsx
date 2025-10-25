import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, HelpCircle, Scan, Fingerprint, Eye, CheckCircle, Upload } from "lucide-react";

const IDVerification = () => {
  const [timeRemaining, setTimeRemaining] = useState("02:00");
  const [idScanned, setIdScanned] = useState(false);
  const [biometricScanned, setBiometricScanned] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle font-display">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Civix</h1>
          <div className="flex items-center gap-2 text-accent font-semibold">
            <Clock className="w-4 h-4" />
            <span className="text-lg">{timeRemaining}</span>
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
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                ${step === 1 ? 'bg-success text-success-foreground' : 
                  step === 2 ? 'bg-primary text-primary-foreground shadow-lg scale-110' :
                  'bg-muted text-muted-foreground'}
              `}>
                {step === 1 ? <CheckCircle className="w-6 h-6" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                  step <= 1 ? 'bg-success' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* ID Proof Card */}
        <Card className="mb-8 shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">ID Proof</h2>
              <p className="text-muted-foreground">Verify your identity to continue voting</p>
            </div>

            <div className="space-y-8">
              {/* Voter ID Scanning */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Scan your voter ID by placing it on the scanner
                  </h3>
                </div>
                
                <Card className={`
                  border-2 border-dashed transition-all duration-300 cursor-pointer group hover:shadow-lg
                  ${idScanned 
                    ? 'border-success bg-success/5' 
                    : 'border-accent hover:border-accent/80 hover:bg-accent/5'
                  }
                `}>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className={`
                        w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300
                        ${idScanned 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-accent/10 text-accent group-hover:bg-accent/20'
                        }
                      `}>
                        {idScanned ? (
                          <CheckCircle className="w-8 h-8" />
                        ) : (
                          <Scan className="w-8 h-8" />
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {idScanned ? "ID successfully scanned" : "Place your voter ID here"}
                      </p>
                      {!idScanned && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => setIdScanned(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Simulate Scan
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Biometric Scanning */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Scan your finger print and iris using the scanner
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className={`
                    border-2 border-dashed transition-all duration-300 cursor-pointer group hover:shadow-lg
                    ${biometricScanned 
                      ? 'border-success bg-success/5' 
                      : 'border-muted-foreground hover:border-primary hover:bg-primary/5'
                    }
                  `}>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className={`
                          w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300
                          ${biometricScanned 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                          }
                        `}>
                          {biometricScanned ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Fingerprint className="w-6 h-6" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {biometricScanned ? "Fingerprint verified" : "Fingerprint"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`
                    border-2 border-dashed transition-all duration-300 cursor-pointer group hover:shadow-lg
                    ${biometricScanned 
                      ? 'border-success bg-success/5' 
                      : 'border-muted-foreground hover:border-primary hover:bg-primary/5'
                    }
                  `}>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className={`
                          w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300
                          ${biometricScanned 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                          }
                        `}>
                          {biometricScanned ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Eye className="w-6 h-6" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {biometricScanned ? "Iris verified" : "Iris scan"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {!biometricScanned && idScanned && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBiometricScanned(true)}
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Simulate Biometric Scan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verify Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            disabled={!idScanned || !biometricScanned}
            className="w-full max-w-md h-14 text-base font-semibold bg-gradient-accent hover:shadow-lg hover:scale-105 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => idScanned && biometricScanned && (window.location.href = '/vote')}
          >
            <span className="flex items-center gap-2">
              Verify!
              <CheckCircle className="w-5 h-5" />
            </span>
          </Button>
        </div>

        {/* Security Info */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1">
              <Scan className="w-3 h-3" />
              256-bit encryption
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Fingerprint className="w-3 h-3" />
              Biometric security
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              GDPR compliant
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Your biometric data is processed locally and never stored
          </p>
        </div>
      </div>
    </div>
  );
};

export default IDVerification;