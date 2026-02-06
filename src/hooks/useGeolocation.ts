import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Attempts to get position with given options, returns a promise.
 */
function tryGetPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      reject,
      options
    );
  });
}

/**
 * Maps GeolocationPositionError codes to user-friendly messages.
 */
function getErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission denied. Please allow location access in your browser/device settings.";
    case err.POSITION_UNAVAILABLE:
      return "Location unavailable. Make sure GPS or mobile data is enabled on your device.";
    case err.TIMEOUT:
      return "Location request timed out. Please try again in an open area.";
    default:
      return "Failed to get location. Please try again.";
  }
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    return new Promise<GeolocationPosition>(async (resolve, reject) => {
      // Check secure context (HTTPS)
      if (!window.isSecureContext) {
        const message = "GPS requires a secure connection (HTTPS).";
        setError(message);
        reject(new Error(message));
        return;
      }

      if (!navigator.geolocation) {
        const message = "Geolocation is not supported by your browser.";
        setError(message);
        reject(new Error(message));
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log("[GPS] Requesting location (high accuracy first)...");

      try {
        // Strategy 1: Try high accuracy (GPS hardware) first — best for outdoor use
        const location = await tryGetPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
        console.log("[GPS] High accuracy location received:", location.latitude, location.longitude, `(±${Math.round(location.accuracy)}m)`);
        setPosition(location);
        setError(null);
        setIsLoading(false);
        resolve(location);
      } catch (highAccError) {
        console.warn("[GPS] High accuracy failed, trying network fallback...", highAccError);

        try {
          // Strategy 2: Fall back to network/WiFi/cell-tower location
          // This works on more devices and in indoor environments
          const location = await tryGetPosition({
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 120000, // Accept 2-min cached position
          });
          console.log("[GPS] Network fallback location received:", location.latitude, location.longitude, `(±${Math.round(location.accuracy)}m)`);
          setPosition(location);
          setError(null);
          setIsLoading(false);
          resolve(location);
        } catch (lowAccError) {
          const geoError = lowAccError as GeolocationPositionError;
          const message = getErrorMessage(geoError);
          console.error("[GPS] Both strategies failed:", geoError.code, geoError.message);
          setError(message);
          setIsLoading(false);
          reject(new Error(message));
        }
      }
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
