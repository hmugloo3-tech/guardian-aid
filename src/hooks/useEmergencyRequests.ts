import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database["public"]["Enums"]["blood_type"];
type EmergencyUrgency = Database["public"]["Enums"]["emergency_urgency"];
type EmergencyStatus = Database["public"]["Enums"]["emergency_status"];

export interface EmergencyRequest {
  id: string;
  requester_id: string | null;
  blood_type: BloodType;
  units_needed: number;
  location_id: string | null;
  hospital_name: string | null;
  contact_phone: string;
  urgency: EmergencyUrgency;
  status: EmergencyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmergencyRequests(status?: EmergencyStatus) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["emergency-requests", status],
    queryFn: async () => {
      let q = supabase
        .from("emergency_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        q = q.eq("status", status);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as EmergencyRequest[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("emergency-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["emergency-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateEmergencyRequest() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (data: {
      blood_type: BloodType;
      units_needed: number;
      location_id?: string;
      hospital_name?: string;
      contact_phone: string;
      urgency: EmergencyUrgency;
      notes?: string;
    }) => {
      const { data: request, error } = await supabase
        .from("emergency_requests")
        .insert({
          ...data,
          requester_id: profile?.id || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger notification to matching donors
      try {
        await supabase.functions.invoke("notify-donors", {
          body: {
            emergency_request_id: request.id,
            blood_type: data.blood_type,
            urgency: data.urgency,
            hospital_name: data.hospital_name,
            location_id: data.location_id,
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify donors:", notifyError);
        // Don't throw - the request was still created successfully
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-requests"] });
    },
  });
}

export function useUpdateEmergencyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<EmergencyRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from("emergency_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-requests"] });
    },
  });
}
