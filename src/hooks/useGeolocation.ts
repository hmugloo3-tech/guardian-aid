import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        const message = "GPS requires a secure connection (HTTPS).";
        setError(message);
        setIsLoading(false);
        reject(new Error(message));
        return;
      }

      if (!navigator.geolocation) {
        const message = "Geolocation is not supported by your browser.";
        setError(message);
        setIsLoading(false);
        reject(new Error(message));
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log("[GPS] Requesting location...");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("[GPS] Location received:", pos.coords.latitude, pos.coords.longitude);
          const location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(location);
          setError(null);
          setIsLoading(false);
          resolve(location);
        },
        (err) => {
          console.error("[GPS] Error:", err.code, err.message);
          let message = "Failed to get location.";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Location unavailable. Make sure GPS is enabled on your device.";
              break;
            case err.TIMEOUT:
              message = "Location request timed out. Please try again.";
              break;
          }
          setError(message);
          setIsLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    clearError,
  };
}

export function useUpdateProfileLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (location: GeolocationPosition) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
