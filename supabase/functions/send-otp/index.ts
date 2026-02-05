import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendOTPRequest {
  phone: string;
  user_id: string;
}

interface VerifyOTPRequest {
  phone: string;
  user_id: string;
  otp_code: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "send";

    if (action === "send") {
      const { phone, user_id }: SendOTPRequest = await req.json();

      if (!phone || !user_id) {
        throw new Error("Missing required fields: phone and user_id");
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

      // Delete any existing unverified OTPs for this user
      await supabase
        .from("phone_verifications")
        .delete()
        .eq("user_id", user_id)
        .eq("verified", false);

      // Insert new OTP record
      const { error: insertError } = await supabase
        .from("phone_verifications")
        .insert({
          user_id,
          phone,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          verified: false,
          attempts: 0,
        });

      if (insertError) {
        throw new Error(`Failed to create OTP record: ${insertError.message}`);
      }

      // Send OTP via SMS
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (accountSid && authToken && twilioPhoneNumber) {
        let formattedPhone = phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("91")) {
          formattedPhone = `91${formattedPhone}`;
        }
        formattedPhone = `+${formattedPhone}`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const credentials = btoa(`${accountSid}:${authToken}`);

        const message = `Your LifeLine Kashmir verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share this code with anyone.`;

        const formData = new URLSearchParams();
        formData.append("To", formattedPhone);
        formData.append("From", twilioPhoneNumber);
        formData.append("Body", message);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const result = await response.json();
          console.error("Twilio error:", result);
         console.error("Twilio error details:", JSON.stringify(result));
         // Return error to user so they know SMS failed
         return new Response(
           JSON.stringify({ 
             success: false, 
             error: `SMS delivery failed: ${result.message || "Twilio error"}. If using trial account, ensure the phone number is verified in Twilio.`,
             twilioError: result
           }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
        } else {
         const result = await response.json();
         console.log(`OTP sent successfully to ${formattedPhone}. SID: ${result.sid}`);
        }
      } else {
       console.log("Twilio not configured - OTP created for testing:", otp);
       // In dev mode without Twilio, return the OTP for testing (REMOVE IN PRODUCTION)
       return new Response(
         JSON.stringify({ 
           success: true, 
           message: "OTP created (Twilio not configured - dev mode)",
           devOtp: otp // Only for testing without Twilio
         }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "verify") {
      const { phone, user_id, otp_code }: VerifyOTPRequest = await req.json();

      if (!phone || !user_id || !otp_code) {
        throw new Error("Missing required fields: phone, user_id, and otp_code");
      }

      // Get the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from("phone_verifications")
        .select("*")
        .eq("user_id", user_id)
        .eq("phone", phone)
        .eq("verified", false)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ success: false, error: "No pending verification found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "OTP has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts (max 5)
      if (otpRecord.attempts >= 5) {
        return new Response(
          JSON.stringify({ success: false, error: "Too many attempts. Please request a new OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP
      if (otpRecord.otp_code !== otp_code) {
        // Increment attempts
        await supabase
          .from("phone_verifications")
          .update({ attempts: otpRecord.attempts + 1 })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ success: false, error: "Invalid OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabase
        .from("phone_verifications")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      // Update profile phone_verified status
      await supabase
        .from("profiles")
        .update({ 
          phone_verified: true, 
          phone_verified_at: new Date().toISOString(),
          phone: phone
        })
        .eq("user_id", user_id);

      console.log(`Phone ${phone} verified for user ${user_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Phone verified successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid action. Use 'send' or 'verify'");
    }
  } catch (error: unknown) {
    console.error("Error in send-otp function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
