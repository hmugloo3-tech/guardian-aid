import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useMapEvents } from "react-leaflet";

// Lazy-load leaflet to avoid impacting initial bundle
const MapContainer = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.MapContainer }))
);
const TileLayer = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.TileLayer }))
);
const Marker = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.Marker }))
);
const Popup = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.Popup }))
);
const Circle = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.Circle }))
);

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
import L from "leaflet";

// Custom marker icons using CSS variables
const createIcon = (cssColor: string) =>
  new L.DivIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; 
      background: ${cssColor}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

// Pre-create icons with theme colors
const emergencyIcon = createIcon("#dc2626"); // primary red
const userIcon = createIcon("#0284c7");      // info blue
const donorIcon = createIcon("#16a34a");     // success green

// Kashmir center coordinates
const KASHMIR_CENTER: [number, number] = [34.0837, 74.7973];
const DEFAULT_ZOOM = 10;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: "emergency" | "user" | "donor";
  details?: string;
}

interface LocationMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  userPosition?: { lat: number; lng: number; accuracy?: number } | null;
  height?: string;
  className?: string;
  showAccuracyCircle?: boolean;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

function MapLoading() {
  return (
    <div className="flex items-center justify-center bg-muted/30 rounded-xl border border-border" style={{ height: "100%" }}>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  );
}

/**
 * Component to handle map click events
 */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMap({
  center,
  zoom = DEFAULT_ZOOM,
  markers = [],
  userPosition,
  height = "250px",
  className = "",
  showAccuracyCircle = true,
  interactive = true,
  onMapClick,
}: LocationMapProps) {
  const mapCenter = center 
    || (userPosition ? [userPosition.lat, userPosition.lng] as [number, number] : KASHMIR_CENTER);

  const getIcon = (type: MapMarker["type"]) => {
    switch (type) {
      case "emergency": return emergencyIcon;
      case "user": return userIcon;
      case "donor": return donorIcon;
      default: return userIcon;
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <Suspense fallback={<MapLoading />}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={interactive}
          dragging={interactive}
          zoomControl={interactive}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User position */}
          {userPosition && (
            <>
              <Marker
                position={[userPosition.lat, userPosition.lng]}
                icon={userIcon}
              >
                <Popup>
                  <div className="text-sm font-medium">📍 Your Location</div>
                  {userPosition.accuracy && (
                    <div className="text-xs opacity-60">±{Math.round(userPosition.accuracy)}m accuracy</div>
                  )}
                </Popup>
              </Marker>
              {showAccuracyCircle && userPosition.accuracy && (
                <Circle
                  center={[userPosition.lat, userPosition.lng]}
                  radius={userPosition.accuracy}
                  pathOptions={{
                    color: "#0284c7",
                    fillColor: "#0284c7",
                    fillOpacity: 0.1,
                    weight: 1,
                  }}
                />
              )}
            </>
          )}

          {/* Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getIcon(marker.type)}
            >
              <Popup>
                <div className="text-sm font-medium">{marker.label}</div>
                {marker.details && (
                  <div className="text-xs opacity-60">{marker.details}</div>
                )}
              </Popup>
            </Marker>
          ))}

          {/* Map click handler */}
          {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        </MapContainer>
      </Suspense>
    </div>
  );
}
