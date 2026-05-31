// Centralized CORS allow-list handling.
//
// CLIENT_URL may be a single origin or a comma-separated list, e.g.
//   CLIENT_URL=https://buildora-1-wg0e.onrender.com,https://build-ora-amber.vercel.app
// Trailing slashes are tolerated on both sides because a browser's Origin
// header never includes one (a common misconfiguration that breaks CORS).

const stripSlash = (value) => value.trim().replace(/\/+$/, "");

// Parsed lazily (per request) so it reflects env vars loaded after import,
// e.g. via dotenv in local development.
const parseAllowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(stripSlash)
    .filter(Boolean);

export const getAllowedOrigins = parseAllowedOrigins;

// Shared origin validator used by both the HTTP API (cors) and Socket.IO.
// Requests with no Origin header (curl, health checks, server-to-server) are allowed.
export const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const allowed = parseAllowedOrigins();
  if (allowed.includes(stripSlash(origin))) return callback(null, true);
  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

export const corsOptions = {
  origin: corsOrigin,
  credentials: true
};
