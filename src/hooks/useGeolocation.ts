import { useState, useCallback, useRef } from "react";
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
 * Maps GeolocationPositionError codes to user-friendly messages with device-specific tips.
 */
function getErrorMessage(err: GeolocationPositionError): string {
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  switch (err.code) {
    case err.PERMISSION_DENIED:
      if (isAndroid) {
        return "Location permission denied. Go to Settings → Apps → Browser → Permissions → Location → Allow.";
      }
      if (isIOS) {
        return "Location permission denied. Go to Settings → Privacy → Location Services → Safari → While Using.";
      }
      return "Location permission denied. Please allow location access in your browser settings.";
    case err.POSITION_UNAVAILABLE:
      if (isAndroid) {
        return "Location unavailable. Enable GPS: Settings → Location → Turn On. Also try enabling Google Location Accuracy.";
      }
      if (isIOS) {
        return "Location unavailable. Enable Location Services in Settings → Privacy → Location Services.";
      }
      return "Location unavailable. Make sure GPS or mobile data is enabled on your device.";
    case err.TIMEOUT:
      return "Location request timed out. Move to an open area with clear sky and try again.";
    default:
      return "Failed to get location. Please try again.";
  }
}

/**
 * Get accuracy level label and color for display
 */
export function getAccuracyInfo(accuracy: number): { label: string; color: string; description: string } {
  if (accuracy <= 20) {
    return { label: "Excellent", color: "text-success", description: "GPS (±" + Math.round(accuracy) + "m)" };
  }
  if (accuracy <= 100) {
    return { label: "Good", color: "text-secondary", description: "GPS (±" + Math.round(accuracy) + "m)" };
  }
  if (accuracy <= 500) {
    return { label: "Approximate", color: "text-warning", description: "Network (±" + Math.round(accuracy) + "m)" };
  }
  return { label: "Low", color: "text-destructive", description: "Cell tower (±" + Math.round(accuracy / 1000) + "km)" };
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

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
        const message = "Geolocation is not supported by your browser. Please use a modern browser like Chrome or Safari.";
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

  /**
   * Watch position continuously for better accuracy over time
   */
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) return;
    
    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        // Only update if accuracy improved
        if (!position || newPosition.accuracy < position.accuracy) {
          setPosition(newPosition);
          console.log("[GPS] Position updated:", newPosition.latitude, newPosition.longitude, `(±${Math.round(newPosition.accuracy)}m)`);
        }
      },
      (err) => {
        console.warn("[GPS] Watch error:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, [position]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    watchPosition,
    stopWatching,
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
