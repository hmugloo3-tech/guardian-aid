import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * This edge function handles phone verification status updates.
 * OTP sending and verification is handled by Firebase Phone Auth on the client.
 * This function is called after successful Firebase verification to update the user's profile.
 */

interface UpdateVerificationRequest {
  phone: string;
  user_id: string;
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
    const action = url.searchParams.get("action") || "update";

    if (action === "update") {
      const { phone, user_id }: UpdateVerificationRequest = await req.json();

      if (!phone || !user_id) {
        throw new Error("Missing required fields: phone and user_id");
      }

      // Update profile phone_verified status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
          phone: phone,
        })
        .eq("user_id", user_id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log(`Phone ${phone} verified for user ${user_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Phone verification status updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid action");
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
