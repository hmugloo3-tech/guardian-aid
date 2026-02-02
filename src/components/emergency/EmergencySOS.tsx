import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEmergencyRequest } from "@/hooks/useEmergencyRequests";
import { useGeolocation, useUpdateProfileLocation } from "@/hooks/useGeolocation";
import { useDistricts, useTehsils } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BloodTypeGrid } from "@/components/ui/blood-type-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type EmergencyUrgency = Database["public"]["Enums"]["emergency_urgency"];

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_OPTIONS: { value: EmergencyUrgency; label: string; description: string; icon: typeof Siren; color: string }[] = [
  {
    value: "critical",
    label: "Critical",
    description: "Life-threatening, need blood within 1 hour",
    icon: Siren,
    color: "primary",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Serious condition, need blood within 6 hours",
    icon: Zap,
    color: "warning",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Scheduled procedure, need blood within 24 hours",
    icon: Clock,
    color: "secondary",
  },
];

export function EmergencySOSButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="emergency"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="group pulse-emergency"
      >
        <Siren className="w-5 h-5" />
        <span>SOS Emergency</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <EmergencySOSForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EmergencySOSForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createRequest = useCreateEmergencyRequest();
  const { data: districts } = useDistricts();
  const geolocation = useGeolocation();
  const updateProfileLocation = useUpdateProfileLocation();

  // Form state - multi-step
  const [step, setStep] = useState<"blood" | "urgency" | "details">("blood");
  const [bloodType, setBloodType] = useState<BloodType | undefined>();
  const [urgency, setUrgency] = useState<EmergencyUrgency>("urgent");
  const [unitsNeeded, setUnitsNeeded] = useState("1");
  const [hospitalName, setHospitalName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [notes, setNotes] = useState("");
  const [useGPS, setUseGPS] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: tehsils } = useTehsils(selectedDistrict);

  const handleGetLocation = async () => {
    try {
      const pos = await geolocation.getCurrentPosition();
      setGpsLocation({ lat: pos.latitude, lng: pos.longitude });
      setUseGPS(true);
      toast({
        title: "Location captured",
        description: "Your GPS coordinates will help find nearby donors faster.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Location failed",
        description: error instanceof Error ? error.message : "Could not get location",
      });
    }
  };

  const handleSubmit = async () => {
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

      // Update profile location if GPS was captured
      if (gpsLocation && user) {
        await updateProfileLocation.mutateAsync({
          latitude: gpsLocation.lat,
          longitude: gpsLocation.lng,
          accuracy: 0,
        });
      }

      toast({
        title: "🚨 Emergency request submitted!",
        description: "Nearby donors are being notified via SMS. Stay by your phone.",
      });

      onSuccess?.();
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
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center pulse-emergency">
            <Siren className="w-6 h-6 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl">Emergency Blood Request</DialogTitle>
            <DialogDescription>1-Tap SOS - We'll notify nearby donors immediately</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Step 1: Blood Type Selection */}
      {step === "blood" && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Select Blood Type Needed</h3>
            <p className="text-sm text-muted-foreground">Tap the blood group you urgently need</p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {BLOOD_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setBloodType(type);
                  setStep("urgency");
                }}
                className={`aspect-square rounded-2xl text-xl font-bold transition-all duration-200 border-2 ${
                  bloodType === type
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg"
                    : "bg-primary/5 text-primary border-primary/20 hover:border-primary hover:scale-105"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Urgency Selection */}
      {step === "urgency" && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold mb-4">
              <Droplets className="w-4 h-4" />
              {bloodType}
            </div>
            <h3 className="text-lg font-semibold mb-2">How urgent is this?</h3>
            <p className="text-sm text-muted-foreground">This helps us prioritize notifications</p>
          </div>

          <div className="space-y-3">
            {URGENCY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setUrgency(option.value);
                    setStep("details");
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                    option.value === "critical"
                      ? "border-primary/30 hover:border-primary bg-primary/5"
                      : option.value === "urgent"
                      ? "border-warning/30 hover:border-warning bg-warning/5"
                      : "border-secondary/30 hover:border-secondary bg-secondary/5"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      option.value === "critical"
                        ? "bg-primary/20 text-primary"
                        : option.value === "urgent"
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <Button variant="ghost" onClick={() => setStep("blood")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to blood type
          </Button>
        </div>
      )}

      {/* Step 3: Contact Details */}
      {step === "details" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">{bloodType}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {URGENCY_OPTIONS.find((o) => o.value === urgency)?.label} Request
              </p>
              <p className="text-xs text-muted-foreground">
                {URGENCY_OPTIONS.find((o) => o.value === urgency)?.description}
              </p>
            </div>
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Phone *
            </Label>
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
                className="pl-12 h-12 text-lg"
                required
              />
            </div>
          </div>

          {/* Hospital */}
          <div className="space-y-2">
            <Label htmlFor="hospital" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Hospital / Location
            </Label>
            <Input
              id="hospital"
              placeholder="e.g., SKIMS, Bone & Joint Hospital"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* GPS Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={useGPS ? "default" : "outline"}
                onClick={handleGetLocation}
                disabled={geolocation.isLoading}
                className="h-12"
              >
                {geolocation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : useGPS ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Navigation className="w-4 h-4 mr-2" />
                )}
                {useGPS ? "GPS Captured" : "Use GPS"}
              </Button>
              <Select
                value={selectedDistrict}
                onValueChange={(v) => {
                  setSelectedDistrict(v);
                  setSelectedTehsil("");
                  setUseGPS(false);
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select District" />
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
              <Select value={selectedTehsil} onValueChange={setSelectedTehsil}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select Area / Tehsil" />
                </SelectTrigger>
                <SelectContent>
                  {tehsils.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Units */}
          <div className="space-y-2">
            <Label>Units Needed</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUnitsNeeded(n.toString())}
                  className={`flex-1 h-10 rounded-lg font-medium transition-all ${
                    unitsNeeded === n.toString()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="pt-4 space-y-3">
            <Button
              type="button"
              variant="emergency"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Siren className="w-5 h-5" />
                  Send Emergency Alert
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setStep("urgency")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
