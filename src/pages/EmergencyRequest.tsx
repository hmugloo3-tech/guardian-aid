import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEmergencyRequest } from "@/hooks/useEmergencyRequests";
import { useDistricts, useTehsils } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BloodTypeGrid } from "@/components/ui/blood-type-badge";
import {
  Heart,
  Phone,
  MapPin,
  Droplets,
  AlertTriangle,
  Building2,
  ArrowLeft,
  Loader2,
  Siren,
  Clock,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type EmergencyUrgency = Database["public"]["Enums"]["emergency_urgency"];

const URGENCY_OPTIONS: { value: EmergencyUrgency; label: string; description: string; icon: typeof Siren }[] = [
  {
    value: "critical",
    label: "Critical",
    description: "Life-threatening, need blood within 1 hour",
    icon: Siren,
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Serious condition, need blood within 6 hours",
    icon: Zap,
  },
  {
    value: "standard",
    label: "Standard",
    description: "Scheduled procedure, need blood within 24 hours",
    icon: Clock,
  },
];

export default function EmergencyRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createRequest = useCreateEmergencyRequest();
  const { data: districts } = useDistricts();

  // Form state
  const [bloodType, setBloodType] = useState<BloodType | undefined>();
  const [unitsNeeded, setUnitsNeeded] = useState("1");
  const [urgency, setUrgency] = useState<EmergencyUrgency>("urgent");
  const [hospitalName, setHospitalName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [notes, setNotes] = useState("");

  const { data: tehsils } = useTehsils(selectedDistrict);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bloodType) {
      toast({
        variant: "destructive",
        title: "Blood type required",
        description: "Please select the required blood type.",
      });
      return;
    }

    if (!contactPhone || contactPhone.length < 10) {
      toast({
        variant: "destructive",
        title: "Contact required",
        description: "Please provide a valid contact phone number.",
      });
      return;
    }

    try {
      await createRequest.mutateAsync({
        blood_type: bloodType,
        units_needed: parseInt(unitsNeeded) || 1,
        urgency,
        hospital_name: hospitalName || undefined,
        contact_phone: contactPhone,
        location_id: selectedTehsil || selectedDistrict || undefined,
        notes: notes || undefined,
      });

      toast({
        title: "Emergency request submitted! 🚨",
        description: "Nearby donors are being notified. Stay by your phone.",
      });

      navigate(user ? "/dashboard" : "/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center pulse-emergency">
              <Siren className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Emergency Blood Request</h1>
              <p className="text-muted-foreground">
                Submit a request and we'll notify nearby donors immediately
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Blood Type Selection */}
          <Card className="mb-6 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Blood Type Needed
              </CardTitle>
              <CardDescription>Select the required blood type for this emergency</CardDescription>
            </CardHeader>
            <CardContent>
              <BloodTypeGrid selected={bloodType} onSelect={setBloodType} />

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="units">Units Needed</Label>
                  <Select value={unitsNeeded} onValueChange={setUnitsNeeded}>
                    <SelectTrigger id="units">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "unit" : "units"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgency Selection */}
          <Card className="mb-6 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Urgency Level
              </CardTitle>
              <CardDescription>How quickly is the blood needed?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {URGENCY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = urgency === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUrgency(option.value)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? option.value === "critical"
                            ? "border-primary bg-primary/5"
                            : option.value === "urgent"
                            ? "border-warning bg-warning/5"
                            : "border-secondary bg-secondary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? option.value === "critical"
                              ? "bg-primary/20 text-primary"
                              : option.value === "urgent"
                              ? "bg-warning/20 text-warning"
                              : "bg-secondary/20 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Location & Hospital */}
          <Card className="mb-6 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location Details
              </CardTitle>
              <CardDescription>Where should donors report?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital / Medical Center</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="hospital"
                    placeholder="e.g., SKIMS, Bone & Joint Hospital"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select
                    value={selectedDistrict}
                    onValueChange={(v) => {
                      setSelectedDistrict(v);
                      setSelectedTehsil("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDistrict && tehsils && tehsils.length > 0 && (
                  <div className="space-y-2">
                    <Label>Area / Tehsil</Label>
                    <Select value={selectedTehsil} onValueChange={setSelectedTehsil}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {tehsils.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription>How can donors reach you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone Number *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    +91
                  </span>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information for donors..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            variant="emergency"
            size="xl"
            className="w-full"
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Siren className="w-5 h-5" />
                Submit Emergency Request
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Your request will be reviewed and verified donors in your area will be notified
          </p>
        </form>
      </div>
    </div>
  );
}
