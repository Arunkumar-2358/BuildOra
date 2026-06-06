import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "../hooks/useGoogleMaps";

const PIN_COLORS = { project: "#D62D14", customer: "#FB7A1E", contractor: "#0F9D6B" };

/**
 * Google Maps view with markers. Degrades to a clean list when no API key is
 * configured (VITE_GOOGLE_MAPS_API_KEY), so the feature is usable either way.
 * markers: [{ id, lat, lng, title, type, onClick }]
 */
export const MapView = ({ center, markers = [], zoom = 11, height = "20rem" }) => {
  const { loaded, hasKey } = useGoogleMaps();
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerObjs = useRef([]);

  useEffect(() => {
    if (!loaded || !ref.current || !center) return;
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(ref.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
    } else {
      mapRef.current.setCenter({ lat: center.lat, lng: center.lng });
    }

    markerObjs.current.forEach((m) => m.setMap(null));
    markerObjs.current = markers
      .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng))
      .map((m) => {
        const marker = new window.google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map: mapRef.current,
          title: m.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: m.type === "project" ? 9 : 7,
            fillColor: PIN_COLORS[m.type] || PIN_COLORS.contractor,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2
          }
        });
        if (m.onClick) marker.addListener("click", m.onClick);
        return marker;
      });
  }, [loaded, center, markers, zoom]);

  // Fallback: no key configured (or failed to load) → simple location list.
  if (!hasKey || (!loaded && !window.google?.maps)) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-surface-2/40 p-6 text-center" style={{ minHeight: height }}>
        <MapPin className="h-8 w-8 text-muted" />
        <p className="mt-2 text-sm font-bold text-content">Map preview unavailable</p>
        <p className="mt-1 max-w-xs text-xs text-muted">
          Set <code className="rounded bg-surface-2 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to enable the interactive map. Contractor distances and matching still work below.
        </p>
      </div>
    );
  }

  return <div ref={ref} className="w-full rounded-2xl" style={{ height }} />;
};
