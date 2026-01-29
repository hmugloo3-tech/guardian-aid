import { UserPlus, Search, Bell, Heart, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & Get Verified",
    description: "Sign up with your phone or email. Complete ID verification to join our trusted donor network.",
    details: ["Quick 2-minute signup", "Government ID verification", "Blood type confirmation"],
  },
  {
    icon: Search,
    step: "02",
    title: "Stay Available",
    description: "Set your availability status. One tap to confirm when you're ready to help save lives.",
    details: ["Real-time availability toggle", "Auto-expire after set time", "Location-based matching"],
  },
  {
    icon: Bell,
    step: "03",
    title: "Receive Alerts",
    description: "Get instant notifications when someone nearby needs your blood type. SMS or WhatsApp.",
    details: ["Smart filtering by blood type", "Priority by proximity", "No spam—only verified requests"],
  },
  {
    icon: Heart,
    step: "04",
    title: "Save a Life",
    description: "Respond to emergencies, connect with patients, and be the hero your community needs.",
    details: ["Direct hospital coordination", "Donation tracking", "Impact recognition"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From registration to saving lives—our streamlined process ensures you can help when it matters most.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={step.step} className="relative group">
                {/* Step Number Circle */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-glow">
                  {step.step}
                </div>

                {/* Card */}
                <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/20 transition-all">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7" />
                  </div>

                  <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{step.description}</p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-24 -right-3 w-6 h-6 bg-background rounded-full border border-border items-center justify-center z-20">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
