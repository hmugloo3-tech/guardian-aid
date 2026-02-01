import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyDonorsRequest {
  emergency_request_id: string;
  blood_type: string;
  urgency: string;
  hospital_name?: string;
  location_id?: string;
  contact_phone?: string;
}

async function sendSMSNotification(
  to: string, 
  message: string, 
  channel: "sms" | "whatsapp" = "sms"
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured, skipping SMS");
      return { success: false, error: "Twilio not configured" };
    }

    // Format phone number
    let formattedTo = to.replace(/\D/g, "");
    if (!formattedTo.startsWith("91")) {
      formattedTo = `91${formattedTo}`;
    }
    formattedTo = `+${formattedTo}`;

    const fromNumber = channel === "whatsapp" 
      ? `whatsapp:${twilioPhoneNumber}` 
      : twilioPhoneNumber;
    const toNumber = channel === "whatsapp" 
      ? `whatsapp:${formattedTo}` 
      : formattedTo;

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
      console.error("Twilio error:", result);
      return { success: false, error: result.message || "Twilio API error" };
    }

    console.log(`SMS sent to ${toNumber} via ${channel}`);
    return { success: true };
  } catch (error) {
    console.error("SMS sending error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
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

    const { emergency_request_id, blood_type, urgency, hospital_name, location_id, contact_phone }: NotifyDonorsRequest = 
      await req.json();

    if (!emergency_request_id || !blood_type) {
      throw new Error("Missing required fields: emergency_request_id and blood_type");
    }

    // Find matching verified donors with the same blood type who are available
    const { data: donors, error: donorsError } = await supabase
      .from("donors")
      .select(`
        id,
        profile_id,
        profiles!inner (
          user_id,
          phone,
          full_name
        )
      `)
      .eq("blood_type", blood_type)
      .eq("is_verified", true)
      .in("status", ["available", "available_later"]);

    if (donorsError) {
      throw new Error(`Failed to fetch donors: ${donorsError.message}`);
    }

    if (!donors || donors.length === 0) {
      console.log("No matching donors found for blood type:", blood_type);
      return new Response(
        JSON.stringify({ success: true, notified: 0, smssSent: 0, message: "No matching donors found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notifications for each matching donor
    const notifications = donors.map((donor: any) => ({
      user_id: donor.profiles.user_id,
      type: "emergency_request",
      title: `🚨 ${urgency.toUpperCase()} Blood Request`,
      message: `${blood_type} blood needed${hospital_name ? ` at ${hospital_name}` : ""}. Can you help?`,
      related_id: emergency_request_id,
      is_read: false,
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      throw new Error(`Failed to create notifications: ${notifyError.message}`);
    }

    // Send SMS/WhatsApp to donors with phone numbers
    let smsSentCount = 0;
    const smsPromises = donors
      .filter((donor: any) => donor.profiles.phone)
      .map(async (donor: any) => {
        const message = `🚨 LIFELINE KASHMIR - ${urgency.toUpperCase()} ALERT\n\n${blood_type} blood urgently needed${hospital_name ? ` at ${hospital_name}` : ""}.\n\n${contact_phone ? `Contact: ${contact_phone}` : ""}\n\nPlease respond ASAP if available.`;
        
        // Try SMS first
        const smsResult = await sendSMSNotification(donor.profiles.phone, message, "sms");
        if (smsResult.success) {
          smsSentCount++;
        }
        return smsResult;
      });

    await Promise.allSettled(smsPromises);

    console.log(`Notified ${donors.length} donors, ${smsSentCount} SMS sent for request ${emergency_request_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: donors.length,
        smsSent: smsSentCount,
        message: `Notified ${donors.length} donors (${smsSentCount} via SMS)`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-donors function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
