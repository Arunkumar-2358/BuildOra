import { Crosshair, Loader2, MapPin } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { Input } from "./Input";

// Reverse-geocode coordinates to address parts when the Google SDK is loaded.
const reverseGeocode = (lat, lng) =>
  new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) return resolve(null);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return resolve(null);
      const get = (type) => results[0].address_components.find((c) => c.types.includes(type))?.long_name;
      resolve({
        city: get("locality") || get("administrative_area_level_2"),
        state: get("administrative_area_level_1"),
        pincode: get("postal_code")
      });
    });
  });

/**
 * Captures a location via GPS and/or manual city/state/pincode entry.
 * `value` = { lat, lng, city, state, pincode }; `onChange` receives a partial patch.
 */
export const LocationPicker = ({ value = {}, onChange, label = "Location" }) => {
  const { getPosition, loading, error } = useGeolocation();

  const useMyLocation = async () => {
    try {
      const { lat, lng } = await getPosition();
      const parts = (await reverseGeocode(lat, lng)) || {};
      onChange({ lat, lng, ...parts });
    } catch {
      /* error surfaced via hook */
    }
  };

  const hasCoords = Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        {hasCoords && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
            <MapPin className="h-3.5 w-3.5" /> GPS captured
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-content transition hover:border-primary disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4 text-accent" />}
        Use my current location
      </button>
      {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="City" value={value.city || ""} onChange={(e) => onChange({ city: e.target.value })} placeholder="City" />
        <Input label="State" value={value.state || ""} onChange={(e) => onChange({ state: e.target.value })} placeholder="State" />
        <Input label="Pincode" value={value.pincode || ""} onChange={(e) => onChange({ pincode: e.target.value })} placeholder="Pincode" />
      </div>
    </div>
  );
};
