import { Briefcase, MapPin, MessageCircle, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import { LocationPicker } from "../components/LocationPicker";
import { MapView } from "../components/MapView";
import { MatchScore } from "../components/MatchScore";
import { StarDisplay } from "../components/StarRating";
import { api } from "../services/api";

const SORTS = [
  ["nearest", "Nearest first"],
  ["match", "Best match"],
  ["rating", "Highest rated"],
  ["experience", "Most experienced"],
  ["completed", "Most reviewed"]
];

const ContractorRow = ({ c, onChat }) => {
  const profile = c.contractorProfile || {};
  return (
    <div className="premium-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
      <img
        src={c.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.businessName || c.name)}&background=2563EB&color=fff`}
        alt={c.name}
        className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-content">{profile.businessName || c.name}</h3>
          {profile.isVerified && <ShieldCheck className="h-4 w-4 text-success" />}
          {typeof c.matchScore === "number" && <MatchScore score={c.matchScore} label={c.matchLabel} />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
          {profile.rating > 0 && <StarDisplay value={profile.rating} size="sm" showValue count={profile.reviewsCount} />}
          {c.distanceKm != null && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.distanceKm} km away</span>}
          {profile.experience ? <span>{profile.experience} yrs exp</span> : null}
        </div>
        {profile.specialization && <p className="mt-1 text-sm text-muted">{profile.specialization}</p>}
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <Button as={Link} to={`/contractors/${c._id}`} variant="secondary"><Briefcase className="h-4 w-4" /> Profile</Button>
        <Button variant="ghost" onClick={() => onChat(c._id)}><MessageCircle className="h-4 w-4" /> Chat</Button>
      </div>
    </div>
  );
};

const SkeletonRow = () => <div className="premium-card h-28 animate-pulse rounded-2xl" />;

export const FindContractors = () => {
  const navigate = useNavigate();
  const [loc, setLoc] = useState({ lat: "", lng: "", city: "", state: "", pincode: "" });
  const [filters, setFilters] = useState({ radius: 50, minRating: "", specialization: "", minExperience: "", verified: false, availability: "", sort: "nearest" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const search = async () => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (loc.lat && loc.lng) {
        params.set("lat", loc.lat);
        params.set("lng", loc.lng);
        params.set("radius", String(filters.radius));
      } else if (loc.city) {
        params.set("city", loc.city);
      }
      if (filters.minRating) params.set("minRating", filters.minRating);
      if (filters.specialization) params.set("specialization", filters.specialization);
      if (filters.minExperience) params.set("minExperience", filters.minExperience);
      if (filters.verified) params.set("verified", "true");
      if (filters.availability) params.set("availability", filters.availability);
      params.set("sort", filters.sort);

      const { data } = await api.get(`/users/nearby?${params.toString()}`);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (participantId) => {
    const { data } = await api.post("/chats/start", { participantId });
    navigate(`/chat/${data._id}`);
  };

  const hasCoords = Boolean(loc.lat && loc.lng);
  const markers = [
    hasCoords && { id: "me", lat: Number(loc.lat), lng: Number(loc.lng), title: "You", type: "customer" },
    ...results
      .filter((c) => c.geo?.coordinates?.length === 2)
      .map((c) => ({ id: c._id, lat: c.geo.coordinates[1], lng: c.geo.coordinates[0], title: c.name, type: "contractor", onClick: () => navigate(`/contractors/${c._id}`) }))
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-content">Find contractors near you</h1>
      <p className="mt-2 text-muted">Discover and compare verified professionals by distance, rating, and specialization.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Filters */}
        <aside className="premium-card h-fit rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-content"><SlidersHorizontal className="h-5 w-5 text-accent" /> Filters</h2>
          <div className="mt-4 space-y-4">
            <LocationPicker value={loc} onChange={(patch) => setLoc((l) => ({ ...l, ...patch }))} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-muted">Distance: {filters.radius} km</label>
              <input type="range" min="5" max="200" step="5" value={filters.radius} onChange={(e) => setFilter("radius", Number(e.target.value))} className="w-full accent-blue-500" disabled={!hasCoords} />
            </div>
            <Input label="Specialization" value={filters.specialization} onChange={(e) => setFilter("specialization", e.target.value)} placeholder="e.g. interior" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min rating" type="number" min="0" max="5" value={filters.minRating} onChange={(e) => setFilter("minRating", e.target.value)} />
              <Input label="Min exp (yrs)" type="number" min="0" value={filters.minExperience} onChange={(e) => setFilter("minExperience", e.target.value)} />
            </div>
            <Select label="Availability" value={filters.availability} onChange={(e) => setFilter("availability", e.target.value)}>
              <option value="">Any</option>
              <option value="available">Available now</option>
              <option value="busy">Busy</option>
            </Select>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              <input type="checkbox" checked={filters.verified} onChange={(e) => setFilter("verified", e.target.checked)} className="h-4 w-4 accent-blue-500" />
              Verified only
            </label>
            <Select label="Sort by" value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Button className="w-full" onClick={search} disabled={loading}>
              <Search className="h-4 w-4" /> {loading ? "Searching…" : "Search"}
            </Button>
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
          </div>
        </aside>

        {/* Results + map */}
        <section className="space-y-5">
          {(hasCoords || results.length > 0) && (
            <MapView center={hasCoords ? { lat: Number(loc.lat), lng: Number(loc.lng) } : { lat: markers[0]?.lat, lng: markers[0]?.lng }} markers={markers} />
          )}

          {loading ? (
            <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((c) => <ContractorRow key={c._id} c={c} onChat={startChat} />)}
            </div>
          ) : searched ? (
            <div className="premium-card rounded-2xl p-10 text-center">
              <p className="text-lg font-extrabold text-content">No contractors found</p>
              <p className="mt-2 text-sm text-muted">Try widening the distance or relaxing your filters.</p>
            </div>
          ) : (
            <div className="premium-card rounded-2xl p-10 text-center">
              <MapPin className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-2 text-lg font-extrabold text-content">Set your location to start</p>
              <p className="mt-1 text-sm text-muted">Use "Use my current location" or enter a city, then hit Search.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
