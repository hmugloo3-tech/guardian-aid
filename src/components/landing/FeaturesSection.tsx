import { Search, Bell, Clock, Shield, Zap, MapPin, Users, Heart, Smartphone } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Donor Matching",
    description: "AI-powered system finds compatible donors within your micro-zone—village, tehsil, or district.",
    color: "primary",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Emergency broadcasts via SMS & WhatsApp reach verified donors in seconds, not minutes.",
    color: "secondary",
  },
  {
    icon: Clock,
    title: "Real-Time Availability",
    description: "Live donor status tracking with one-tap confirmation. Know who's available right now.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Verified Network",
    description: "Every donor is government ID verified. Trust badges show credibility at a glance.",
    color: "success",
  },
  {
    icon: MapPin,
    title: "Micro-Zone Priority",
    description: "Built for blocked roads & snowfall. Always matches closest accessible donors first.",
    color: "info",
  },
  {
    icon: Zap,
    title: "Works Offline",
    description: "Ultra-light mode for 2G networks and power cuts. Cached data ensures access anytime.",
    color: "warning",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  secondary: "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground",
  accent: "bg-accent/10 text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground",
  success: "bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground",
  info: "bg-info/10 text-info group-hover:bg-info group-hover:text-info-foreground",
  warning: "bg-warning/10 text-warning-foreground group-hover:bg-warning group-hover:text-warning-foreground",
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary text-sm font-medium rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Built for Emergencies.
            <br />
            <span className="text-muted-foreground">Designed for Kashmir.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every feature engineered for real-world challenges—harsh weather, limited connectivity, and life-or-death urgency.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl border border-border p-6 lg:p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${
                  colorClasses[feature.color as keyof typeof colorClasses]
                }`}
              >
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="mt-16 lg:mt-20 bg-gradient-to-r from-primary to-primary-hover rounded-3xl p-8 lg:p-12 text-primary-foreground">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <StatCard icon={Users} value="2,500+" label="Verified Donors" />
            <StatCard icon={Heart} value="180+" label="Lives Saved" />
            <StatCard icon={MapPin} value="12" label="Districts Covered" />
            <StatCard icon={Smartphone} value="98%" label="Response Rate" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-display text-3xl lg:text-4xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
