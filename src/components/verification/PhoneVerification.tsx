import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Loader2, CheckCircle2, Shield, ArrowLeft } from "lucide-react";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";
import { useToast } from "@/hooks/use-toast";

interface PhoneVerificationProps {
  onVerified?: () => void;
  triggerButton?: React.ReactNode;
}

export function PhoneVerification({ onVerified, triggerButton }: PhoneVerificationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <Shield className="w-4 h-4" />
            Verify Phone Number
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <PhoneVerificationForm
          onVerified={() => {
            setIsOpen(false);
            onVerified?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function PhoneVerificationForm({ onVerified }: { onVerified?: () => void }) {
  const { toast } = useToast();
  const {
    step,
    phone,
    handleSendOTP,
    handleVerifyOTP,
    reset,
    isSending,
    isVerifying,
    sendError,
    verifyError,
  } = usePhoneVerification();

  const [phoneInput, setPhoneInput] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const onSendOTP = async () => {
    if (phoneInput.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    try {
      await handleSendOTP(phoneInput);
      toast({
        title: "OTP Sent!",
        description: "Check your phone for the verification code",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const onVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
      });
      return;
    }

    try {
      await handleVerifyOTP(otpValue);
      toast({
        title: "Phone Verified! ✓",
        description: "Your phone number has been verified successfully",
      });
      onVerified?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid OTP",
      });
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            step === "verified" 
              ? "bg-success/10 text-success" 
              : "bg-primary/10 text-primary"
          }`}>
            {step === "verified" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </div>
          <div>
            <DialogTitle className="text-xl">
              {step === "verified" ? "Phone Verified!" : "Verify Your Phone"}
            </DialogTitle>
            <DialogDescription>
              {step === "phone" && "We'll send you a verification code via SMS"}
              {step === "otp" && `Enter the 6-digit code sent to +91 ${phone}`}
              {step === "verified" && "Your phone number is now verified"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {step === "phone" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          <Button
            onClick={onSendOTP}
            disabled={isSending || phoneInput.length !== 10}
            className="w-full h-12"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending OTP...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Send Verification Code
              </>
            )}
          </Button>

          {sendError && (
            <p className="text-sm text-destructive text-center">
              {sendError instanceof Error ? sendError.message : "Failed to send OTP"}
            </p>
          )}
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-6 animate-fade-in">
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
            onClick={onVerifyOTP}
            disabled={isVerifying || otpValue.length !== 6}
            className="w-full h-12"
          >
            {isVerifying ? (
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
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                setPhoneInput("");
                setOtpValue("");
              }}
              className="text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change phone number
            </Button>
            <button
              onClick={onSendOTP}
              disabled={isSending}
              className="text-sm text-primary hover:underline"
            >
              {isSending ? "Sending..." : "Resend OTP"}
            </button>
          </div>

          {verifyError && (
            <p className="text-sm text-destructive text-center">
              {verifyError instanceof Error ? verifyError.message : "Invalid OTP"}
            </p>
          )}
        </div>
      )}

      {step === "verified" && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <p className="font-semibold text-lg">+91 {phone}</p>
            <p className="text-sm text-muted-foreground">Verified successfully</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 text-sm">
            <p className="flex items-center gap-2 justify-center">
              <Shield className="w-4 h-4 text-success" />
              Your account now has a verified badge
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
