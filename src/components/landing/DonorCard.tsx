import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Shield, Clock, MapPin, Phone, Flag } from "lucide-react";
import { ReportDialog } from "@/components/safety/ReportDialog";
import type { PublicDonor } from "@/hooks/usePublicDonors";

interface DonorCardProps {
  donor: PublicDonor;
}

export function DonorCard({ donor }: DonorCardProps) {
  const statusMap: Record<string, "available" | "later" | "unavailable"> = {
    available: "available",
    available_later: "later",
    unavailable: "unavailable",
  };

  // Get the display name (first name + initial for privacy)
  const getDisplayName = () => {
    if (!donor.profile?.full_name) return "Anonymous";
    const parts = donor.profile.full_name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return parts[0];
  };

  // Get location string
  const getLocationString = () => {
    if (!donor.profile?.location) return "Kashmir";
    const loc = donor.profile.location;
    if (loc.parent?.name) {
      return `${loc.name}, ${loc.parent.name}`;
    }
    return loc.name;
  };

  // Calculate days since last donation
  const getLastDonationText = () => {
    if (!donor.last_donation_date) return "No record";
    const lastDate = new Date(donor.last_donation_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 60) return "1 month ago";
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-lg font-semibold">
            {getDisplayName().charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{getDisplayName()}</span>
              {donor.is_verified && (
                <Shield className="w-3.5 h-3.5 text-secondary" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {getLocationString()}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {donor.blood_type}
        </div>
      </div>

      {/* Status */}
      <StatusIndicator
        status={statusMap[donor.status]}
        pulse={donor.status === "available"}
        className="mb-3"
      />

      {/* Info */}
      <div className="space-y-2 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Response: &lt; 30 min
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 text-center">💉</span>
          Last donated: {getLastDonationText()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant={donor.status === "available" ? "hero" : "outline"}
          size="sm"
          className="flex-1"
          disabled={donor.status === "unavailable"}
        >
          <Phone className="w-3.5 h-3.5" />
          {donor.status === "available" ? "Contact" : "Later"}
        </Button>
        <ReportDialog
          reportedUserId={donor.profile_id}
          triggerButton={
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive px-2">
              <Flag className="w-3.5 h-3.5" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
