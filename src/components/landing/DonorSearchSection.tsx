import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BloodTypeGrid } from "@/components/ui/blood-type-badge";
import { Search, MapPin, Filter, ChevronDown, Loader2 } from "lucide-react";
import { usePublicDonors } from "@/hooks/usePublicDonors";
import { DonorCard } from "./DonorCard";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];

export function DonorSearchSection() {
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const { data: donors, isLoading } = usePublicDonors({
    bloodType: selectedBloodType,
    onlyAvailable,
  });

  // Filter by location search query (client-side for now)
  const filteredDonors = donors?.filter((donor) => {
    if (!searchQuery) return true;
    const locationName = donor.profile?.location?.name?.toLowerCase() || "";
    const parentName = donor.profile?.location?.parent?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return locationName.includes(query) || parentName.includes(query);
  }) || [];

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

              <Button 
                variant={onlyAvailable ? "default" : "outline"} 
                className="w-full"
                onClick={() => setOnlyAvailable(!onlyAvailable)}
              >
                <Filter className="w-4 h-4" />
                {onlyAvailable ? "Showing Available Only" : "Show All Donors"}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading donors...
                </span>
              ) : (
                <>
                  {filteredDonors.length} Verified Donors
                  {selectedBloodType && ` for ${selectedBloodType}`}
                </>
              )}
            </h3>
            <span className="text-sm text-muted-foreground">
              Sorted by availability
            </span>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="w-20 h-4 bg-muted rounded" />
                        <div className="w-16 h-3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted" />
                  </div>
                  <div className="w-24 h-6 bg-muted rounded-full mb-3" />
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-3 bg-muted rounded" />
                    <div className="w-full h-3 bg-muted rounded" />
                  </div>
                  <div className="w-full h-9 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredDonors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredDonors.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No verified donors found matching your criteria.</p>
              <p className="text-sm mt-1">
                {donors?.length === 0 
                  ? "Be the first to register as a donor!" 
                  : "Try adjusting your filters or expanding the search area."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
