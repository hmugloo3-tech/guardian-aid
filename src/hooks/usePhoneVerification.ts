import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSendOTP() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (phone: string) => {
      if (!user) throw new Error("Must be logged in to verify phone");

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone, user_id: user.id },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to send OTP");

      return data;
    },
  });
}

export function useVerifyOTP() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ phone, otpCode }: { phone: string; otpCode: string }) => {
      if (!user) throw new Error("Must be logged in to verify phone");

      // Call the edge function with action=verify query param
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp?action=verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ phone, user_id: user.id, otp_code: otpCode }),
        }
      );

      const data = await response.json();
      if (!data?.success) throw new Error(data?.error || "Failed to verify OTP");

      return data;
    },
  });
}

export function usePhoneVerification() {
  const [step, setStep] = useState<"phone" | "otp" | "verified">("phone");
  const [phone, setPhone] = useState("");
  
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  const handleSendOTP = async (phoneNumber: string) => {
    setPhone(phoneNumber);
    await sendOTP.mutateAsync(phoneNumber);
    setStep("otp");
  };

  const handleVerifyOTP = async (otpCode: string) => {
    await verifyOTP.mutateAsync({ phone, otpCode });
    setStep("verified");
  };

  const reset = () => {
    setStep("phone");
    setPhone("");
  };

  return {
    step,
    phone,
    handleSendOTP,
    handleVerifyOTP,
    reset,
    isSending: sendOTP.isPending,
    isVerifying: verifyOTP.isPending,
    sendError: sendOTP.error,
    verifyError: verifyOTP.error,
  };
}
