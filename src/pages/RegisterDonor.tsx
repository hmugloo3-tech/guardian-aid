import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useCreateDonor, useDonor } from "@/hooks/useDonor";
import { useDistricts, useTehsils } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BloodTypeGrid } from "@/components/ui/blood-type-badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Heart, Phone, MapPin, Droplets, Calendar, ArrowRight, ArrowLeft, Check, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useSendOTP, useVerifyOTP } from "@/hooks/usePhoneVerification";
import { clearRecaptcha } from "@/integrations/firebase/config";
import { ConfirmationResult } from "firebase/auth";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];

const STEPS = [
  { id: 1, title: "Blood Type", icon: Droplets },
  { id: 2, title: "Phone", icon: Phone },
  { id: 3, title: "Verify", icon: Shield },
  { id: 4, title: "Location", icon: MapPin },
  { id: 5, title: "Confirm", icon: Check },
];

export default function RegisterDonor() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: existingDonor, isLoading: donorLoading } = useDonor();
  const updateProfile = useUpdateProfile();
  const createDonor = useCreateDonor();
  const { data: districts } = useDistricts();
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [bloodType, setBloodType] = useState<BloodType | undefined>();
  const [phone, setPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedTehsil, setSelectedTehsil] = useState<string>("");
  const [lastDonationDate, setLastDonationDate] = useState("");

  const { data: tehsils } = useTehsils(selectedDistrict);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if already a donor
  if (!donorLoading && existingDonor) {
    return <Navigate to="/dashboard" replace />;
  }

  const isLoading = authLoading || profileLoading || donorLoading;

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!bloodType;
      case 2:
        return phone.length >= 10;
      case 3:
        return isPhoneVerified;
      case 4:
        return !!selectedTehsil || !!selectedDistrict;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    try {
      const result = await sendOTP.mutateAsync(phone);
      setConfirmationResult(result.confirmationResult);
      setOtpSent(true);
      toast({
        title: "OTP Sent! 📱",
        description: "Check your phone for the 6-digit verification code",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
      });
      return;
    }

    if (!confirmationResult) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please request a new OTP",
      });
      return;
    }

    try {
      await verifyOTP.mutateAsync({ phone, otpCode: otpValue, confirmationResult });
      setIsPhoneVerified(true);
      toast({
        title: "Phone Verified! ✓",
        description: "Your phone number has been verified successfully",
      });
      // Auto-advance to next step
      setStep(4);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid OTP code",
      });
    }
  };

  const handleNext = () => {
    if (step === 2 && !otpSent) {
      // On step 2, first send OTP before advancing
      handleSendOTP();
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!bloodType || !profile) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please complete all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile with phone and location
      await updateProfile.mutateAsync({
        phone,
        location_id: selectedTehsil || selectedDistrict || null,
      });

      // Create donor record
      await createDonor.mutateAsync({
        blood_type: bloodType,
        last_donation_date: lastDonationDate || undefined,
      });

      toast({
        title: "Registration complete! 🎉",
        description: "You are now a registered blood donor. Thank you for joining our lifesaving network.",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold">LifeLine Kashmir</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">Become a Donor</h1>
          <p className="text-muted-foreground">
            Complete your profile to join our lifesaving network
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300 -z-10"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg scale-110"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card className="border-border/50 shadow-xl">
          {/* Step 1: Blood Type */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  Select Your Blood Type
                </CardTitle>
                <CardDescription>
                  This helps us match you with compatible recipients during emergencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BloodTypeGrid
                  selected={bloodType}
                  onSelect={(type) => setBloodType(type)}
                />

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-secondary" />
                    Don't know your blood type?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visit your nearest health center for a quick blood test. It's important to know your exact blood type for safe donations.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  We'll only use this to contact you during emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-12"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit mobile number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-donation">Last Donation Date (Optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="last-donation"
                      type="date"
                      value={lastDonationDate}
                      onChange={(e) => setLastDonationDate(e.target.value)}
                      className="pl-10"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This helps us ensure safe intervals between donations
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: OTP Verification */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Verify Your Phone
                </CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent to +91 {phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isPhoneVerified ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Phone Verified!</h3>
                    <p className="text-muted-foreground">+91 {phone}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center space-y-4">
                      <InputOTP
                        maxLength={6}
                        value={otpValue}
                        onChange={setOtpValue}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={handleVerifyOTP}
                      disabled={verifyOTP.isPending || otpValue.length !== 6}
                      className="w-full h-12"
                    >
                      {verifyOTP.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Verify Code
                        </>
                      )}
                    </Button>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={handleSendOTP}
                        disabled={sendOTP.isPending}
                        className="text-sm text-primary hover:underline"
                      >
                        {sendOTP.isPending ? "Sending..." : "Resend OTP"}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep(2);
                          setOtpSent(false);
                          setOtpValue("");
                          setConfirmationResult(null);
                          clearRecaptcha();
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Change phone number
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Your Location
                </CardTitle>
                <CardDescription>
                  We prioritize matching donors by proximity during emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={selectedDistrict} onValueChange={(v) => { setSelectedDistrict(v); setSelectedTehsil(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your district" />
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
                    <Label>Area / Tehsil (Optional)</Label>
                    <Select value={selectedTehsil} onValueChange={setSelectedTehsil}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your area" />
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

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Why location matters:</strong> During emergencies, especially in snow-affected areas, we prioritize nearby donors who can reach patients quickly.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-secondary" />
                  Confirm Your Details
                </CardTitle>
                <CardDescription>
                  Review your information before completing registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Blood Type</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{bloodType}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Phone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">+91 {phone}</span>
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-muted-foreground">Location</span>
                    </div>
                    <span className="font-medium">
                      {tehsils?.find((t) => t.id === selectedTehsil)?.name || 
                       districts?.find((d) => d.id === selectedDistrict)?.name || 
                       "Not specified"}
                    </span>
                  </div>

                  {lastDonationDate && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-muted-foreground">Last Donation</span>
                      </div>
                      <span className="font-medium">
                        {new Date(lastDonationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 border border-secondary/30 bg-secondary/5 rounded-lg">
                  <h4 className="font-medium text-secondary mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Your Commitment
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    By registering, you agree to respond to emergency requests when available and maintain accurate availability status.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex gap-4">
            {step > 1 && step !== 3 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            {step < 5 && step !== 3 ? (
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={!canProceed() || (step === 2 && sendOTP.isPending)}
                className="flex-1"
              >
                {step === 2 && sendOTP.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : step === 2 ? (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : step === 5 ? (
              <Button
                variant="emergency"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
