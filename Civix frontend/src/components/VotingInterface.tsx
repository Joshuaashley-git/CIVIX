import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, HelpCircle, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { electionApi, generateVoterIdHash } from "@/lib/election-api";
import { useGlobalCountdown } from "@/lib/CountdownContext";

type Candidate = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
};

type Election = {
  id: number;
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
};
import { useToast } from "@/hooks/use-toast";

const VotingInterface = () => {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const { reset: resetCountdown } = useGlobalCountdown();

  useEffect(() => {
    const fetchElectionData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await electionApi.getCurrentElection();
        
        if (data) {
          // Transform the election data to match our Election type
          const electionData: Election = {
            id: data.election.id,
            title: data.election.title,
            description: data.election.description,
            isActive: data.election.isActive !== false,
            startTime: data.election.startTime ? new Date(data.election.startTime).toISOString() : new Date().toISOString(),
            endTime: data.election.endTime ? new Date(data.election.endTime).toISOString() : undefined
          };

          setElection(electionData);

          // Prefer Admin Panel overrides for initial display to keep names in sync
          const ADMIN_API_BASE = (import.meta as any).env?.VITE_ADMIN_URL || 'http://localhost:3001';
          try {
            const res = await fetch(`${ADMIN_API_BASE}/api/admin/elections/${electionData.id}/candidates`);
            const json = await res.json();
            if (json && json.success && Array.isArray(json.data)) {
              const adminCandidates: Candidate[] = json.data.map((c: any) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                isActive: c.isActive !== false,
              }));
              setCandidates(adminCandidates);
            } else {
              // Fallback to backend candidates
              const candidatesData: Candidate[] = (data.candidates || []).map((candidate: any) => ({
                id: candidate.id,
                name: candidate.name,
                description: candidate.description,
                isActive: candidate.isActive !== false
              }));
              setCandidates(candidatesData);
            }
          } catch {
            // Fallback if admin panel is unavailable
            const candidatesData: Candidate[] = (data.candidates || []).map((candidate: any) => ({
              id: candidate.id,
              name: candidate.name,
              description: candidate.description,
              isActive: candidate.isActive !== false
            }));
            setCandidates(candidatesData);
          }
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
  }, [toast, reloadKey]);

  useEffect(() => {
    if (!election) return;
    const ADMIN_API_BASE = (import.meta as any).env?.VITE_ADMIN_URL || 'http://localhost:3001';
    const es = new EventSource(`${ADMIN_API_BASE}/api/admin/candidate-stream`);
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg || msg.electionId !== election.id) return;
        if (msg.type === 'update') {
          setCandidates((prev) => prev.map((c) => c.id === Number(msg.candidateId) ? { ...c, name: msg.name ?? c.name, description: msg.description ?? c.description } : c));
        } else if (msg.type === 'remove') {
          setCandidates((prev) => prev.filter((c) => c.id !== Number(msg.candidateId)));
        } else if (msg.type === 'add') {
          setCandidates((prev) => {
            const exists = prev.some((c) => c.id === Number(msg.candidateId));
            if (exists) {
              return prev.map((c) => c.id === Number(msg.candidateId) ? { ...c, name: msg.name ?? c.name, description: msg.description ?? c.description, isActive: true } : c);
            }
            return [
              ...prev,
              {
                id: Number(msg.candidateId),
                name: msg.name || 'New Candidate',
                description: msg.description || '',
                isActive: true,
              }
            ];
          });
        }
      } catch {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.close();
    };
  }, [election?.id]);

  const handleVote = async () => {
    if (!selectedCandidate || !election) {
      toast({
        title: "Selection Required",
        description: "Please select a candidate before voting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVoting(true);
      
      // Generate a voter ID hash (in production, this would be based on authenticated user)
      const voterId = `voter_${Date.now()}`; // Temporary demo voter ID
      const voterIdHash = generateVoterIdHash(voterId);
      
      console.log("Submitting vote with data:", {
        electionId: election.id,
        candidateId: parseInt(selectedCandidate),
        voterIdHash
      });
      
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
        // Notify Admin Panel for realtime updates
        try {
          const selected = candidates.find(c => c.id === parseInt(selectedCandidate));
          await fetch('http://localhost:3001/api/admin/notify-vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              electionId: election.id,
              electionTitle: election.title,
              candidateId: parseInt(selectedCandidate),
              candidateName: selected?.name,
              timestamp: new Date().toISOString(),
              transactionHash: response.transactionHash,
              blockNumber: response.blockNumber,
              isHighlighted: true,
            })
          });
        } catch (notifyErr) {
          console.error('Failed to notify admin panel:', notifyErr);
        }

        // Navigate to confirmation first (to avoid timeout redirect race),
        // then end this voter's session immediately
        navigate('/confirmation');
        resetCountdown(0);
      } else {
        toast({
          title: "Voting Failed",
          description: response.error || "Failed to cast vote. Please try again.",
          variant: "destructive",
        });
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
          <Button onClick={() => setReloadKey((k) => k + 1)}>
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
                            <div className="flex gap-2" />
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