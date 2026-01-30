import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LocationLevel = Database["public"]["Enums"]["location_level"];

export interface Location {
  id: string;
  name: string;
  level: LocationLevel;
  parent_id: string | null;
  created_at: string;
}

export function useLocations(level?: LocationLevel, parentId?: string) {
  return useQuery({
    queryKey: ["locations", level, parentId],
    queryFn: async () => {
      let query = supabase.from("locations").select("*");
      
      if (level) {
        query = query.eq("level", level);
      }
      
      if (parentId) {
        query = query.eq("parent_id", parentId);
      } else if (level !== "district") {
        // Only filter by null parent for non-district levels if no specific parent
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useDistricts() {
  return useLocations("district");
}

export function useTehsils(districtId?: string) {
  return useQuery({
    queryKey: ["tehsils", districtId],
    queryFn: async () => {
      if (!districtId) return [];
      
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("level", "tehsil")
        .eq("parent_id", districtId)
        .order("name");

      if (error) throw error;
      return data as Location[];
    },
    enabled: !!districtId,
  });
}
