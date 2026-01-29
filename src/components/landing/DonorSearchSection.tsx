import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge-custom";
import { BloodTypeGrid } from "@/components/ui/blood-type-badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Search, MapPin, Filter, ChevronDown, Shield, Clock, Phone } from "lucide-react";

type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

// Mock donor data
const mockDonors = [
  {
    id: 1,
    name: "Ahmad K.",
    bloodType: "B+" as BloodType,
    location: "Soura, Srinagar",
    distance: "1.2 km",
    status: "available" as const,
    lastDonation: "3 months ago",
    verified: true,
    responseTime: "< 10 min",
  },
  {
    id: 2,
    name: "Fatima S.",
    bloodType: "O-" as BloodType,
    location: "Hazratbal, Srinagar",
    distance: "2.8 km",
    status: "available" as const,
    lastDonation: "6 months ago",
    verified: true,
    responseTime: "< 15 min",
  },
  {
    id: 3,
    name: "Mohammad R.",
    bloodType: "A+" as BloodType,
    location: "Bemina, Srinagar",
    distance: "3.5 km",
    status: "later" as const,
    lastDonation: "2 months ago",
    verified: true,
    responseTime: "< 30 min",
  },
  {
    id: 4,
    name: "Saima B.",
    bloodType: "AB+" as BloodType,
    location: "Lal Chowk, Srinagar",
    distance: "4.1 km",
    status: "available" as const,
    lastDonation: "4 months ago",
    verified: true,
    responseTime: "< 20 min",
  },
];

export function DonorSearchSection() {
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDonors = mockDonors.filter((donor) => {
    if (selectedBloodType && donor.bloodType !== selectedBloodType) return false;
    if (searchQuery && !donor.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <section id="donors" className="py-20 lg:py-28 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Donor Network
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Find Nearby Donors
          </h2>
          <p className="text-lg text-muted-foreground">
            Search our verified donor network by blood type and location. Get connected in minutes.
          </p>
        </div>

        {/* Search Panel */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 lg:p-8 mb-8">
          <div className="grid lg:grid-cols-[1fr,auto] gap-6">
            {/* Blood Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Blood Type</label>
              <BloodTypeGrid
                selected={selectedBloodType}
                onSelect={setSelectedBloodType}
              />
            </div>

            {/* Location & Filters */}
            <div className="lg:w-80 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter area or district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button variant="hero" className="w-full">
                <Search className="w-4 h-4" />
                Search Donors
              </Button>

              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4" />
                More Filters
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">
              {filteredDonors.length} Donors Found
              {selectedBloodType && ` for ${selectedBloodType}`}
            </h3>
            <span className="text-sm text-muted-foreground">
              Sorted by proximity
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredDonors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>

          {filteredDonors.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No donors found matching your criteria.</p>
              <p className="text-sm mt-1">Try adjusting your filters or expanding the search area.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface DonorCardProps {
  donor: {
    id: number;
    name: string;
    bloodType: BloodType;
    location: string;
    distance: string;
    status: "available" | "later" | "unavailable";
    lastDonation: string;
    verified: boolean;
    responseTime: string;
  };
}

function DonorCard({ donor }: DonorCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-lg font-semibold">
            {donor.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{donor.name}</span>
              {donor.verified && (
                <Shield className="w-3.5 h-3.5 text-secondary" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {donor.distance}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {donor.bloodType}
        </div>
      </div>

      {/* Status */}
      <StatusIndicator
        status={donor.status}
        pulse={donor.status === "available"}
        className="mb-3"
      />

      {/* Info */}
      <div className="space-y-2 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Response: {donor.responseTime}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 text-center">💉</span>
          Last donated: {donor.lastDonation}
        </div>
      </div>

      {/* Action */}
      <Button
        variant={donor.status === "available" ? "hero" : "outline"}
        size="sm"
        className="w-full"
        disabled={donor.status === "unavailable"}
      >
        <Phone className="w-3.5 h-3.5" />
        {donor.status === "available" ? "Contact Donor" : "Request Later"}
      </Button>
    </div>
  );
}
