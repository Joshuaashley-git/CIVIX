import { Button } from "@/components/ui/button";
import { ArrowUpRight, Shield, Users, CheckCircle } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6 md:px-8 lg:px-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-subtle">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-success rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Trust Indicators */}
        <div className="flex justify-center items-center gap-8 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-success" />
            <span className="text-sm font-medium">Secure</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Transparent</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight mb-8 animate-fade-in-up">
          <span className="text-foreground">Where</span>
          <br />
          <span className="text-foreground">Every </span>
          <span className="bg-gradient-accent bg-clip-text text-transparent font-black">
            Vote
          </span>
          <br />
          <span className="text-muted-foreground">is </span>
          <span className="text-success font-black">Secure</span>
          <br />
          <span className="text-foreground">and Every</span>
          <br />
          <span className="text-foreground">Voice is</span>
          <br />
          <span className="text-foreground font-black">Heard.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up">
          Experience the future of democratic participation with our secure, transparent, 
          and accessible digital voting platform.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in-up">
          <Button 
            variant="hero" 
            size="lg" 
            className="group relative overflow-hidden"
            onClick={() => window.location.href = '/id-proof'}
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Casting
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>End-to-end encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>Real-time results</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Audit trail</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;