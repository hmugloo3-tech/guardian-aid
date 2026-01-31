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

    const { emergency_request_id, blood_type, urgency, hospital_name, location_id }: NotifyDonorsRequest = 
      await req.json();

    if (!emergency_request_id || !blood_type) {
      throw new Error("Missing required fields: emergency_request_id and blood_type");
    }

    // Find matching verified donors with the same blood type who are available
    let donorQuery = supabase
      .from("donors")
      .select(`
        id,
        profile_id,
        profiles!inner (
          user_id
        )
      `)
      .eq("blood_type", blood_type)
      .eq("is_verified", true)
      .in("status", ["available", "available_later"]);

    // If location_id is provided, we could filter by location hierarchy
    // For now, notify all matching donors

    const { data: donors, error: donorsError } = await donorQuery;

    if (donorsError) {
      throw new Error(`Failed to fetch donors: ${donorsError.message}`);
    }

    if (!donors || donors.length === 0) {
      console.log("No matching donors found for blood type:", blood_type);
      return new Response(
        JSON.stringify({ success: true, notified: 0, message: "No matching donors found" }),
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

    console.log(`Notified ${donors.length} donors for emergency request ${emergency_request_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: donors.length,
        message: `Successfully notified ${donors.length} donors`
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
