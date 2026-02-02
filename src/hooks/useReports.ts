import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReportType = "spam" | "fake_profile" | "harassment" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_emergency_id: string | null;
  report_type: ReportType;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      reported_user_id?: string;
      reported_emergency_id?: string;
      report_type: ReportType;
      description?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to create a report");

      const { data: report, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
}

export function useMyReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!user,
  });
}

export function useAdminReports(status?: ReportStatus) {
  return useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Report[];
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: ReportStatus;
      admin_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("reports")
        .update({
          status,
          admin_notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });
}
