import { useState } from "react";

// Wraps the browser Geolocation API in a promise with loading/error state.
// Needs no API key — works everywhere over HTTPS / localhost.
export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.");
        return reject(new Error("unsupported"));
      }
      setLoading(true);
      setError("");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setLoading(false);
          setError(err.code === 1 ? "Location permission denied." : "Unable to get your location.");
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

  return { getPosition, loading, error };
};
