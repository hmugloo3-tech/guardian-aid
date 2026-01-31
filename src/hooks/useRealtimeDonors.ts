import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export interface DonorWithProfile {
  id: string;
  profile_id: string;
  blood_type: BloodType;
  status: AvailabilityStatus;
  last_donation_date: string | null;
  is_verified: boolean;
  total_donations: number;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    phone: string | null;
    location_id: string | null;
    locations?: {
      id: string;
      name: string;
      level: string;
    } | null;
  };
}

export function useRealtimeDonors(filters?: {
  bloodType?: BloodType;
  status?: AvailabilityStatus;
  verifiedOnly?: boolean;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["donors-realtime", filters],
    queryFn: async () => {
      let q = supabase
        .from("donors")
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            phone,
            location_id,
            locations (
              id,
              name,
              level
            )
          )
        `)
        .order("updated_at", { ascending: false });

      if (filters?.bloodType) {
        q = q.eq("blood_type", filters.bloodType);
      }

      if (filters?.status) {
        q = q.eq("status", filters.status);
      }

      if (filters?.verifiedOnly !== false) {
        q = q.eq("is_verified", true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as DonorWithProfile[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("donors-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donors",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["donors-realtime"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useAllDonors() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["all-donors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donors")
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            phone,
            location_id,
            locations (
              id,
              name,
              level
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DonorWithProfile[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("all-donors-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donors",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-donors"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
