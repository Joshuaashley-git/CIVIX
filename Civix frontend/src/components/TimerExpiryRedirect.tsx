import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalCountdown } from "@/lib/CountdownContext";

const TimerExpiryRedirect = () => {
  const { isComplete } = useGlobalCountdown();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isComplete) return;
    const allowedPaths = ["/timeout", "/confirmation"]; // do not force redirect from confirmation
    if (!allowedPaths.includes(location.pathname)) {
      navigate("/timeout", { replace: true });
    }
  }, [isComplete, navigate, location.pathname]);

  return null;
};

export default TimerExpiryRedirect;
