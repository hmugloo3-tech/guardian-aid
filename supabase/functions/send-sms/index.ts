import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendSMSRequest {
  to: string;
  message: string;
  channel?: "sms" | "whatsapp";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid) {
      throw new Error("TWILIO_ACCOUNT_SID is not configured");
    }
    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN is not configured");
    }
    if (!twilioPhoneNumber) {
      throw new Error("TWILIO_PHONE_NUMBER is not configured");
    }

    const { to, message, channel = "sms" }: SendSMSRequest = await req.json();

    if (!to || !message) {
      throw new Error("Missing required fields: 'to' and 'message'");
    }

    // Format phone number (ensure it has country code)
    let formattedTo = to.replace(/\D/g, "");
    if (!formattedTo.startsWith("91")) {
      formattedTo = `91${formattedTo}`;
    }
    formattedTo = `+${formattedTo}`;

    // Format for WhatsApp if needed
    const fromNumber = channel === "whatsapp" 
      ? `whatsapp:${twilioPhoneNumber}` 
      : twilioPhoneNumber;
    const toNumber = channel === "whatsapp" 
      ? `whatsapp:${formattedTo}` 
      : formattedTo;

    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append("To", toNumber);
    formData.append("From", fromNumber);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", result);
      throw new Error(`Twilio API error [${response.status}]: ${result.message || JSON.stringify(result)}`);
    }

    console.log(`SMS sent successfully to ${toNumber} via ${channel}, SID: ${result.sid}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sid: result.sid,
        channel,
        to: toNumber,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-sms function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
