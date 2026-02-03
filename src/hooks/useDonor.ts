import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export interface Donor {
  id: string;
  profile_id: string;
  blood_type: BloodType;
  status: AvailabilityStatus;
  last_donation_date: string | null;
  next_eligible_date: string | null;
  donation_locked_until: string | null;
  is_verified: boolean;
  verification_notes: string | null;
  total_donations: number;
  created_at: string;
  updated_at: string;
}

export function useDonor() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["donor", profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as Donor | null;
    },
    enabled: !!profile,
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (data: { blood_type: BloodType; last_donation_date?: string }) => {
      if (!profile) throw new Error("Profile not found");

      const { data: donor, error } = await supabase
        .from("donors")
        .insert({
          profile_id: profile.id,
          blood_type: data.blood_type,
          last_donation_date: data.last_donation_date || null,
          status: "available",
        })
        .select()
        .single();

      if (error) throw error;
      return donor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor"] });
    },
  });
}

export function useUpdateDonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Donor> & { id: string }) => {
      const { data, error } = await supabase
        .from("donors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor"] });
    },
  });
}
