import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
}

export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlockedUser[];
    },
    enabled: !!user,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      blocked_id,
      reason,
    }: {
      blocked_id: string;
      reason?: string;
    }) => {
      if (!user) throw new Error("Must be logged in to block a user");

      const { data, error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blocked_id: string) => {
      if (!user) throw new Error("Must be logged in to unblock a user");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blocked_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });
}
