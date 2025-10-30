import { Button } from "@/components/ui/button";
import { useGlobalCountdown } from "@/lib/CountdownContext";
import { useNavigate } from "react-router-dom";

const Timeout = () => {
  const { reset } = useGlobalCountdown();
  const navigate = useNavigate();

  const restart = () => {
    reset(120); // restart 2-minute session
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold">Session timed out</h1>
        <p className="text-muted-foreground">For security, the voting session lasts 2 minutes. Please restart to try again.</p>
        <Button onClick={restart} className="mt-2">Restart session</Button>
      </div>
    </div>
  );
};

export default Timeout;
