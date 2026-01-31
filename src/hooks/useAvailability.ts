import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDonor } from "./useDonor";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { data: donor } = useDonor();

  return useMutation({
    mutationFn: async ({
      status,
      expiresInHours,
    }: {
      status: AvailabilityStatus;
      expiresInHours?: number;
    }) => {
      if (!donor) throw new Error("No donor record found");

      // Update donor status
      const { error: donorError } = await supabase
        .from("donors")
        .update({ status })
        .eq("id", donor.id);

      if (donorError) throw donorError;

      // Create availability record with expiry if specified
      if (expiresInHours && expiresInHours > 0) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        const { error: availabilityError } = await supabase
          .from("donor_availability")
          .insert({
            donor_id: donor.id,
            status,
            expires_at: expiresAt.toISOString(),
          });

        if (availabilityError) throw availabilityError;
      }

      return { status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor"] });
    },
  });
}
