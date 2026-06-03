import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scoreContractor } from "../utils/matching.js";

const num = (v) => (v === undefined || v === "" ? undefined : Number(v));

// Build the contractor query filters shared by discovery endpoints.
const buildContractorFilter = (query) => {
  const filter = { role: "contractor", status: "active" };
  if (query.minRating) filter["contractorProfile.rating"] = { $gte: num(query.minRating) };
  if (query.minExperience) filter["contractorProfile.experience"] = { $gte: num(query.minExperience) };
  if (query.verified === "true") filter["contractorProfile.isVerified"] = true;
  if (query.availability) filter["contractorProfile.availability"] = query.availability;
  if (query.specialization) {
    const rx = new RegExp(query.specialization, "i");
    filter.$or = [{ "contractorProfile.services": rx }, { "contractorProfile.specialization": rx }];
  }
  return filter;
};

// Attach distance + match score to a plain contractor object given a context.
const decorate = (contractor, pseudoProject, distanceMeters) => {
  const project = { ...pseudoProject };
  const result = scoreContractor(project, contractor);
  return {
    ...contractor,
    distanceKm: distanceMeters != null ? Math.round((distanceMeters / 1000) * 10) / 10 : result.distanceKm,
    matchScore: result.total,
    matchLabel: result.label,
    matchBreakdown: result.breakdown
  };
};

const sortResults = (list, sort) => {
  const by = {
    rating: (a, b) => (b.contractorProfile?.rating || 0) - (a.contractorProfile?.rating || 0),
    experience: (a, b) => (b.contractorProfile?.experience || 0) - (a.contractorProfile?.experience || 0),
    completed: (a, b) => (b.contractorProfile?.reviewsCount || 0) - (a.contractorProfile?.reviewsCount || 0),
    match: (a, b) => b.matchScore - a.matchScore,
    nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
  };
  return by[sort] ? [...list].sort(by[sort]) : list;
};

// GET /api/users/nearby — discover contractors by location + filters.
export const getNearbyContractors = asyncHandler(async (req, res) => {
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);
  const radiusKm = num(req.query.radius) || 50;
  const limit = Math.min(num(req.query.limit) || 30, 60);
  const sort = req.query.sort || (lat != null ? "nearest" : "match");

  const pseudoProject = {
    category: req.query.specialization || req.query.category,
    budget: num(req.query.budget) || 0,
    geo: lat != null && lng != null ? { coordinates: [lng, lat] } : undefined
  };

  let contractors;
  if (lat != null && lng != null) {
    // Geo search via 2dsphere index — returns distance, filtered + capped.
    const docs = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          query: buildContractorFilter(req.query),
          spherical: true
        }
      },
      { $limit: limit },
      { $project: { password: 0, savedProjects: 0 } }
    ]);
    contractors = docs.map((c) => decorate(c, pseudoProject, c.distanceMeters));
  } else {
    // No coordinates → text/attribute filtering only (e.g. city).
    const filter = buildContractorFilter(req.query);
    if (req.query.city) filter.city = new RegExp(req.query.city, "i");
    const docs = await User.find(filter).select("-savedProjects").limit(limit).lean();
    contractors = docs.map((c) => decorate(c, pseudoProject, null));
  }

  res.json(sortResults(contractors, sort).slice(0, limit));
});

// Core ranking used by the recommended endpoint and auto-invitations.
const rankContractorsForProject = async (project, max = 8) => {
  let docs;
  if (project.geo?.coordinates?.length === 2) {
    docs = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: project.geo.coordinates },
          distanceField: "distanceMeters",
          maxDistance: 300 * 1000, // 300km candidate radius
          query: { role: "contractor", status: "active" },
          spherical: true
        }
      },
      { $limit: 100 },
      { $project: { password: 0, savedProjects: 0 } }
    ]);
  } else {
    docs = await User.find({ role: "contractor", status: "active" }).select("-savedProjects").limit(100).lean();
  }

  return docs
    .map((c) => {
      const { total, label, distanceKm, breakdown } = scoreContractor(project, c);
      return { contractor: c, matchScore: total, matchLabel: label, distanceKm, matchBreakdown: breakdown };
    })
    // Rank by score, then prefer verified contractors on ties.
    .sort((a, b) => b.matchScore - a.matchScore || Number(b.contractor.contractorProfile?.isVerified) - Number(a.contractor.contractorProfile?.isVerified))
    .slice(0, max);
};

// GET /api/projects/:id/recommended — best-matching contractors for a project.
export const getRecommendedContractors = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const ranked = await rankContractorsForProject(project, 8);
  res.json(
    ranked.map(({ contractor, matchScore, matchLabel, distanceKm, matchBreakdown }) => ({
      _id: contractor._id,
      name: contractor.name,
      city: contractor.city,
      profileImage: contractor.profileImage,
      contractorProfile: contractor.contractorProfile,
      matchScore,
      matchLabel,
      distanceKm,
      matchBreakdown
    }))
  );
});

// Notify the top matching contractors to invite them to bid (verified first).
export const inviteTopMatches = async (project, max = 5) => {
  const ranked = await rankContractorsForProject(project, max);
  await Promise.all(
    ranked.map(({ contractor, matchScore }) =>
      Notification.create({
        user: contractor._id,
        type: "project",
        title: "You're a great match for a new project",
        body: `"${project.title}" in ${project.location} matches your profile (${matchScore}% match). Submit a bid!`,
        link: `/projects/${project._id}`
      })
    )
  );
  return ranked.length;
};
