import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signInWithPhoneNumber, PhoneAuthProvider, ConfirmationResult } from "firebase/auth";
import { auth, getRecaptchaVerifier, clearRecaptcha } from "@/integrations/firebase/config";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Format phone to E.164 format for Firebase
function formatPhoneForFirebase(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Add +91 prefix for Indian numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  throw new Error("Please enter a valid 10-digit phone number");
}

export function useSendOTP() {
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  return useMutation({
    mutationFn: async (phone: string): Promise<{ confirmationResult: ConfirmationResult }> => {
      const formattedPhone = formatPhoneForFirebase(phone);
      
      // Ensure reCAPTCHA container exists
      let container = document.getElementById('recaptcha-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'recaptcha-container';
        document.body.appendChild(container);
      }
      
      try {
        const recaptchaVerifier = getRecaptchaVerifier('recaptcha-container');
        
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        confirmationResultRef.current = confirmationResult;
        
        return { confirmationResult };
      } catch (error: unknown) {
        // Clear reCAPTCHA on error so user can retry
        clearRecaptcha();
        
        const firebaseError = error as { code?: string; message?: string };
        
        // Handle specific Firebase errors
        if (firebaseError.code === 'auth/invalid-phone-number') {
          throw new Error("Invalid phone number format. Please enter a valid Indian number.");
        }
        if (firebaseError.code === 'auth/too-many-requests') {
          throw new Error("Too many OTP requests. Please wait before trying again.");
        }
        if (firebaseError.code === 'auth/quota-exceeded') {
          throw new Error("SMS quota exceeded. Please try again later.");
        }
        if (firebaseError.code === 'auth/captcha-check-failed') {
          throw new Error("Security verification failed. Please refresh and try again.");
        }
        if (firebaseError.code === 'auth/network-request-failed') {
          throw new Error("Network error. Please check your internet connection.");
        }
        
        throw new Error(firebaseError.message || "Failed to send OTP. Please try again.");
      }
    },
  });
}

export function useVerifyOTP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      phone, 
      otpCode, 
      confirmationResult 
    }: { 
      phone: string; 
      otpCode: string; 
      confirmationResult: ConfirmationResult;
    }) => {
      if (!user) throw new Error("Must be logged in to verify phone");
      
      try {
        // Verify OTP with Firebase
        await confirmationResult.confirm(otpCode);
        
        // Clear reCAPTCHA after successful verification
        clearRecaptcha();
        
        // Update profile in Supabase to mark phone as verified
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: phone,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error("Failed to update profile:", updateError);
          // Don't throw - phone is verified even if profile update fails
        }
        
        // Invalidate profile query to refresh data
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        
        return { success: true, phone };
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        
        if (firebaseError.code === 'auth/invalid-verification-code') {
          throw new Error("Invalid OTP code. Please check and try again.");
        }
        if (firebaseError.code === 'auth/code-expired') {
          throw new Error("OTP has expired. Please request a new code.");
        }
        if (firebaseError.code === 'auth/session-expired') {
          throw new Error("Session expired. Please request a new OTP.");
        }
        
        throw new Error(firebaseError.message || "Failed to verify OTP.");
      }
    },
  });
}

export function usePhoneVerification() {
  const [step, setStep] = useState<"phone" | "otp" | "verified">("phone");
  const [phone, setPhone] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  const handleSendOTP = useCallback(async (phoneNumber: string) => {
    setPhone(phoneNumber);
    const result = await sendOTP.mutateAsync(phoneNumber);
    setConfirmationResult(result.confirmationResult);
    setStep("otp");
  }, [sendOTP]);

  const handleVerifyOTP = useCallback(async (otpCode: string) => {
    if (!confirmationResult) {
      throw new Error("No verification session. Please request OTP again.");
    }
    await verifyOTP.mutateAsync({ phone, otpCode, confirmationResult });
    setStep("verified");
  }, [phone, confirmationResult, verifyOTP]);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setConfirmationResult(null);
    clearRecaptcha();
  }, []);

  return {
    step,
    phone,
    confirmationResult,
    handleSendOTP,
    handleVerifyOTP,
    reset,
    isSending: sendOTP.isPending,
    isVerifying: verifyOTP.isPending,
    sendError: sendOTP.error,
    verifyError: verifyOTP.error,
  };
}
