import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export interface PublicDonor {
  id: string;
  blood_type: BloodType;
  status: AvailabilityStatus;
  is_verified: boolean;
  last_donation_date: string | null;
  profile: {
    full_name: string;
    location_id: string | null;
    location?: {
      name: string;
      parent?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

interface UsePublicDonorsOptions {
  bloodType?: BloodType;
  locationId?: string;
  onlyAvailable?: boolean;
}

export function usePublicDonors(options: UsePublicDonorsOptions = {}) {
  const { bloodType, locationId, onlyAvailable = false } = options;

  return useQuery({
    queryKey: ["public-donors", bloodType, locationId, onlyAvailable],
    queryFn: async () => {
      let query = supabase
        .from("donors")
        .select(`
          id,
          blood_type,
          status,
          is_verified,
          last_donation_date,
          profiles!inner (
            full_name,
            location_id,
            locations (
              name,
              parent:locations!parent_id (
                name
              )
            )
          )
        `)
        .eq("is_verified", true);

      if (bloodType) {
        query = query.eq("blood_type", bloodType);
      }

      if (onlyAvailable) {
        query = query.in("status", ["available", "available_later"]);
      }

      const { data, error } = await query.order("status", { ascending: true });

      if (error) throw error;

      // Transform the data to a cleaner format
      return (data || []).map((donor: any) => ({
        id: donor.id,
        blood_type: donor.blood_type,
        status: donor.status,
        is_verified: donor.is_verified,
        last_donation_date: donor.last_donation_date,
        profile: donor.profiles ? {
          full_name: donor.profiles.full_name,
          location_id: donor.profiles.location_id,
          location: donor.profiles.locations ? {
            name: donor.profiles.locations.name,
            parent: donor.profiles.locations.parent,
          } : null,
        } : null,
      })) as PublicDonor[];
    },
  });
}

export function usePublicDonorCount(bloodType?: BloodType) {
  return useQuery({
    queryKey: ["public-donors-count", bloodType],
    queryFn: async () => {
      let query = supabase
        .from("donors")
        .select("id", { count: "exact", head: true })
        .eq("is_verified", true);

      if (bloodType) {
        query = query.eq("blood_type", bloodType);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
  });
}
