import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, HelpCircle, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { electionApi, type Candidate, type Election, generateVoterIdHash } from "@/lib/election-api";
import { useToast } from "@/hooks/use-toast";

const VotingInterface = () => {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchElectionData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await electionApi.getCurrentElection();
        
        if (data) {
          setElection(data.election);
          setCandidates(data.candidates);
        } else {
          // Handle case where no elections are available
          setError('No active elections found. Please check back later.');
        }
      } catch (err) {
        console.error('Failed to fetch election data:', err);
        setError('Failed to load election data. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load election data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, [toast]);

  const handleVote = async () => {
    if (!selectedCandidate || !election) return;

    try {
      setVoting(true);
      
      // Generate a voter ID hash (in production, this would be based on authenticated user)
      const voterId = `voter_${Date.now()}`; // Temporary demo voter ID
      const voterIdHash = generateVoterIdHash(voterId);
      
      const response = await electionApi.castVote(
        election.id,
        parseInt(selectedCandidate),
        voterIdHash
      );

      if (response.success) {
        toast({
          title: "Vote Cast Successfully!",
          description: `Transaction: ${response.transactionHash?.slice(0, 10)}...`,
        });
        
        // Redirect to confirmation page
        window.location.href = '/confirmation';
      } else {
        throw new Error(response.error || 'Failed to cast vote');
      }
    } catch (err: any) {
      console.error('Failed to cast vote:', err);
      toast({
        title: "Voting Failed",
        description: err.message || "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle font-display flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading election data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-subtle font-display flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Election</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle font-display">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Civix</h1>
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
                {step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                  step <= 1 ? 'bg-success' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Selection Card */}
        <Card className="mb-8 shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Make Your Selection</h2>
              <p className="text-muted-foreground">{election?.description || 'Choose your preferred candidate'}</p>
              {election && (
                <p className="text-sm text-muted-foreground mt-2">
                  Election: {election.title}
                </p>
              )}
            </div>

            <RadioGroup 
              value={selectedCandidate} 
              onValueChange={setSelectedCandidate}
              className="space-y-6"
            >
              {candidates.map((candidate) => (
                <div key={candidate.id} className="group">
                  <Label 
                    htmlFor={candidate.id.toString()}
                    className="cursor-pointer block"
                  >
                    <Card className={`
                      transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2
                      ${selectedCandidate === candidate.id.toString() 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-accent'
                      }
                    `}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <RadioGroupItem 
                            value={candidate.id.toString()} 
                            id={candidate.id.toString()}
                            className="w-6 h-6 border-2"
                          />
                          
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="w-12 h-12 bg-gradient-accent rounded-md opacity-50"></div>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {candidate.description}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                ID: {candidate.id}
                              </Badge>
                              {candidate.voteCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Votes: {candidate.voteCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Next Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            disabled={!selectedCandidate || voting}
            className="w-full max-w-md h-14 text-base font-semibold bg-gradient-accent hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            onClick={handleVote}
          >
            <span className="flex items-center gap-2">
              {voting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Casting Vote...
                </>
              ) : (
                <>
                  Cast Vote
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 Your vote is encrypted and secure • 🔍 Verifiable audit trail
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;