/**
 * Smart contractor matching engine.
 *
 * Designed to be modular: each scoring factor is an entry in FACTORS with a
 * weight and a pure `score()` returning 0..1. Adding a new signal (e.g.
 * completion rate, response rate) is a one-line addition — no other code
 * changes. Total weights sum to 100.
 */

const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance in km between two [lng, lat] coordinate pairs.
export const haversineKm = (a, b) => {
  if (!a || !b || a.length !== 2 || b.length !== 2) return null;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
};

const clamp01 = (n) => Math.max(0, Math.min(1, n));

// Closer is better; full score within ~5km, fading to 0 by ~100km. Unknown
// distance is neutral so contractors without coords aren't unfairly buried.
const distanceScore = (distanceKm) => {
  if (distanceKm == null) return 0.5;
  if (distanceKm <= 5) return 1;
  return clamp01(1 - (distanceKm - 5) / 95);
};

const specializationScore = (project, profile) => {
  const category = (project.category || "").toLowerCase();
  if (!category) return 0.5;
  const services = (profile.services || []).map((s) => s.toLowerCase());
  const specialization = (profile.specialization || "").toLowerCase();
  if (services.some((s) => s.includes(category) || category.includes(s))) return 1;
  if (specialization.includes(category)) return 1;
  return 0.3; // general capability
};

// Parse a freeform pricing range like "₹10L - ₹20L" / "500000-2000000" into [min,max].
const parsePricing = (raw = "") => {
  const text = String(raw).toLowerCase();
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map((n) => {
    let value = Number(n);
    if (/l|lakh/.test(text)) value *= 100000;
    else if (/cr|crore/.test(text)) value *= 10000000;
    return value;
  });
  if (!nums.length) return null;
  return [Math.min(...nums), Math.max(...nums)];
};

const budgetScore = (project, profile) => {
  const range = parsePricing(profile.pricingRange);
  if (!range || !project.budget) return 0.6; // unknown → neutral
  const [min, max] = range;
  if (project.budget >= min && project.budget <= max) return 1;
  if (project.budget >= min * 0.6 && project.budget <= max * 1.5) return 0.7;
  return 0.4;
};

const availabilityScore = (profile) => {
  const map = { available: 1, busy: 0.5, unavailable: 0 };
  return map[profile.availability] ?? 1;
};

// Modular factor list — extend here to add new signals.
const FACTORS = [
  { key: "location", weight: 30, score: ({ distanceKm }) => distanceScore(distanceKm) },
  { key: "rating", weight: 20, score: ({ profile }) => clamp01((profile.rating || 0) / 5) },
  { key: "specialization", weight: 20, score: ({ project, profile }) => specializationScore(project, profile) },
  { key: "budget", weight: 15, score: ({ project, profile }) => budgetScore(project, profile) },
  { key: "experience", weight: 10, score: ({ profile }) => clamp01((profile.experience || 0) / 10) },
  { key: "availability", weight: 5, score: ({ profile }) => availabilityScore(profile) }
];

export const matchLabel = (score) => {
  if (score >= 90) return "Best Match";
  if (score >= 75) return "Highly Recommended";
  if (score >= 60) return "Good Match";
  return "Potential Match";
};

/**
 * Score a single contractor against a project.
 * @returns { total, label, distanceKm, breakdown }
 */
export const scoreContractor = (project, contractor) => {
  const profile = contractor.contractorProfile || {};
  const distanceKm =
    project.geo?.coordinates && contractor.geo?.coordinates
      ? haversineKm(project.geo.coordinates, contractor.geo.coordinates)
      : null;

  const ctx = { project, contractor, profile, distanceKm };
  const breakdown = {};
  let total = 0;
  for (const factor of FACTORS) {
    const points = Math.round(factor.weight * clamp01(factor.score(ctx)));
    breakdown[factor.key] = points;
    total += points;
  }

  return { total, label: matchLabel(total), distanceKm, breakdown };
};

export const FACTOR_WEIGHTS = FACTORS.map(({ key, weight }) => ({ key, weight }));
