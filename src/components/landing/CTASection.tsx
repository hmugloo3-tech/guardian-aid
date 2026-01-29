import { Button } from "@/components/ui/button";
import { Heart, Phone, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="relative bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

          <div className="relative p-8 sm:p-12 lg:p-16">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Heart className="w-4 h-4 fill-current" />
                Join 2,500+ verified donors
              </div>

              {/* Heading */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Be the Difference.
                <br />
                <span className="text-primary">Save a Life Today.</span>
              </h2>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Every 2 seconds, someone needs blood. Your registration takes 2 minutes but could give someone a lifetime. Join Kashmir's most trusted donor network.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button variant="emergency" size="xl" className="group">
                  <Heart className="w-5 h-5 fill-current" />
                  Register as Donor
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="hero-outline" size="xl">
                  <Phone className="w-5 h-5" />
                  Emergency Helpline
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  Free Forever
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  100% Privacy Protected
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  Government Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
