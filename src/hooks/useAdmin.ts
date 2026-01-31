import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useVerifyDonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      donorId,
      verified,
      notes,
    }: {
      donorId: string;
      verified: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("donors")
        .update({
          is_verified: verified,
          verification_notes: notes || null,
        })
        .eq("id", donorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors-realtime"] });
      queryClient.invalidateQueries({ queryKey: ["all-donors"] });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [donorsResult, pendingDonorsResult, emergencyResult, activeEmergencyResult] =
        await Promise.all([
          supabase.from("donors").select("id", { count: "exact", head: true }),
          supabase
            .from("donors")
            .select("id", { count: "exact", head: true })
            .eq("is_verified", false),
          supabase.from("emergency_requests").select("id", { count: "exact", head: true }),
          supabase
            .from("emergency_requests")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "active"]),
        ]);

      return {
        totalDonors: donorsResult.count || 0,
        pendingVerification: pendingDonorsResult.count || 0,
        totalEmergencies: emergencyResult.count || 0,
        activeEmergencies: activeEmergencyResult.count || 0,
      };
    },
  });
}
