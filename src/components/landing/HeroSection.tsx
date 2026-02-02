import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-custom";
import { ArrowRight, Heart, MapPin, Users, Zap, Shield, Siren, PhoneCall } from "lucide-react";
import { EmergencySOSButton } from "@/components/emergency/EmergencySOS";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-start text-left">
            {/* Trust Badge */}
            <Badge variant="verified" size="lg" className="mb-6 animate-fade-in">
              <Shield className="w-3.5 h-3.5" />
              Verified Emergency Response Platform
            </Badge>

            {/* Main Heading */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 animate-fade-in stagger-1">
              Every{" "}
              <span className="text-primary relative">
                Drop
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,8 Q50,0 100,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary/30"
                  />
                </svg>
              </span>{" "}
              Counts.
              <br />
              <span className="text-muted-foreground">Every Second Matters.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-8 animate-fade-in stagger-2">
              Kashmir's trusted emergency blood donor network. Connecting verified donors with those in need—instantly, even in the harshest conditions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in stagger-3">
              <EmergencySOSButton />
              <Link to="/register-donor">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  <Users className="w-5 h-5" />
                  Become a Donor
                </Button>
              </Link>
            </div>

            {/* Emergency Helpline */}
            <div className="flex items-center gap-4 mt-6 p-4 rounded-xl bg-muted/50 border border-border/50 animate-fade-in stagger-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">24/7 Emergency Helpline</p>
                <p className="text-lg font-bold text-primary">112 • 108 • 104</p>
              </div>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50 w-full max-w-lg animate-fade-in stagger-5">
              <StatItem value="2,500+" label="Verified Donors" />
              <StatItem value="180+" label="Lives Saved" />
              <StatItem value="<15min" label="Avg Response" />
            </div>
          </div>

          {/* Right Content - Hero Visual */}
          <div className="relative hidden lg:block animate-fade-in stagger-3">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      {/* Main Card */}
      <div className="relative bg-card rounded-3xl border border-border shadow-xl p-6 sm:p-8">
        {/* Emergency Request Preview */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="destructive" size="lg" className="mb-2">
                <Zap className="w-3 h-3" />
                Active Emergency
              </Badge>
              <h3 className="font-display text-xl font-bold">Blood Required Urgently</h3>
              <p className="text-sm text-muted-foreground mt-1">SKIMS Hospital, Srinagar</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">B+</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-sm font-medium">2.3 km away</div>
              <div className="text-xs text-muted-foreground">Soura, Srinagar District</div>
            </div>
          </div>

          {/* Matching Donors */}
          <div>
            <div className="text-sm font-medium mb-3">Nearby Verified Donors</div>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                +12
              </div>
            </div>
          </div>

          {/* Action */}
          <Button variant="hero" className="w-full">
            <Heart className="w-4 h-4" />
            View Request Details
          </Button>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-success/10 rounded-2xl border border-success/20 flex flex-col items-center justify-center animate-float">
        <span className="text-2xl font-bold text-success">17</span>
        <span className="text-[10px] text-success/80">Available</span>
      </div>

      <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl border shadow-lg p-4 animate-float" style={{ animationDelay: "1s" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="text-sm font-semibold">All Donors Verified</div>
            <div className="text-xs text-muted-foreground">Government ID checked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
