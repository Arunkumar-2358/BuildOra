import { useEffect, useState } from "react";

// Lazily injects the Google Maps JS SDK once, using VITE_GOOGLE_MAPS_API_KEY.
// Degrades gracefully: when no key is configured, `hasKey` is false and callers
// render a non-map fallback instead.
let scriptPromise = null;

const loadScript = (key) => {
  if (window.google?.maps) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

export const useGoogleMaps = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [loaded, setLoaded] = useState(Boolean(window.google?.maps));

  useEffect(() => {
    if (!key || window.google?.maps) {
      if (window.google?.maps) setLoaded(true);
      return;
    }
    let active = true;
    loadScript(key)
      .then(() => active && setLoaded(true))
      .catch(() => active && setLoaded(false));
    return () => {
      active = false;
    };
  }, [key]);

  return { loaded, hasKey: Boolean(key) };
};
