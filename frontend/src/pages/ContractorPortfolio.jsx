import {
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ContractorReviews } from "../components/ContractorReviews";
import { StarDisplay } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { currency } from "../utils/format";

const availabilityStyles = {
  available: { label: "Available now", className: "bg-emerald-500/10 text-success" },
  busy: { label: "Currently busy", className: "bg-amber-500/10 text-amber-400" },
  unavailable: { label: "Unavailable", className: "bg-red-500/10 text-red-400" }
};

const MetricCard = ({ icon: Icon, label, value, sub }) => (
  <div className="premium-card rounded-2xl p-4">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2">
      <Icon className="h-5 w-5 text-accent" />
    </div>
    <p className="mt-3 text-2xl font-extrabold text-content">{value}</p>
    <p className="text-xs font-semibold text-muted">{label}</p>
    {sub && <p className="mt-0.5 text-xs text-subtle">{sub}</p>}
  </div>
);

const Chips = ({ items, tone = "default" }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <span
        key={item}
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          tone === "skill" ? "border border-primary/30 bg-primary/10 text-accent" : "border border-line-strong bg-surface-2 text-muted"
        }`}
      >
        {item}
      </span>
    ))}
  </div>
);

const PortfolioSkeleton = () => (
  <main className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-8">
    <div className="premium-card h-44 rounded-2xl" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="premium-card h-28 rounded-2xl" />)}
    </div>
    <div className="premium-card h-64 rounded-2xl" />
  </main>
);

export const ContractorPortfolio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api
      .get(`/users/${id}/portfolio`)
      .then(({ data }) => active && setData(data))
      .catch((err) => active && setError(err.response?.data?.message || "Unable to load contractor profile"));
    return () => {
      active = false;
    };
  }, [id]);

  const startChat = async () => {
    const { data } = await api.post("/chats/start", { participantId: id });
    navigate(`/chat/${data._id}`);
  };

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-extrabold text-content">{error}</p>
        <Button as={Link} to="/dashboard" variant="secondary" className="mt-4">Back to dashboard</Button>
      </main>
    );
  }

  if (!data) return <PortfolioSkeleton />;

  const { contractor, metrics, completedProjects } = data;
  const profile = contractor.contractorProfile || {};
  const displayName = profile.businessName || contractor.name;
  const isSelf = user?._id === contractor._id;
  const availability = availabilityStyles[profile.availability] || availabilityStyles.available;
  const portfolioImages = profile.portfolioImages || [];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* A. Basic information */}
      <section className="premium-card rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <img
            src={contractor.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563EB&color=fff&size=160`}
            alt={displayName}
            className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover shadow-md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-content">{displayName}</h1>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-success">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${availability.className}`}>{availability.label}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              {contractor.city && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {contractor.city}</span>
              )}
              {profile.experience ? (
                <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {profile.experience} yrs experience</span>
              ) : null}
              {metrics.totalReviews > 0 && <StarDisplay value={metrics.averageRating} size="sm" showValue count={metrics.totalReviews} />}
            </div>
            {profile.specialization && (
              <p className="mt-3 inline-block rounded-lg bg-surface-2 px-3 py-1 text-sm font-bold text-content">{profile.specialization}</p>
            )}
            {profile.bio && <p className="mt-3 max-w-2xl leading-7 text-muted">{profile.bio}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
              {!isSelf && (
                <Button onClick={startChat}><MessageCircle className="h-4 w-4" /> Start chat</Button>
              )}
              <Button as="a" href="#portfolio" variant="secondary">View portfolio</Button>
              <Button as="a" href="#reviews" variant="ghost">Read reviews</Button>
            </div>
          </div>
        </div>
      </section>

      {/* D. Performance metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Award} label="Average rating" value={metrics.totalReviews ? metrics.averageRating.toFixed(1) : "New"} sub={`${metrics.totalReviews} reviews`} />
        <MetricCard icon={CheckCircle2} label="Completed projects" value={metrics.completedProjects} sub={`${metrics.awardedProjects} awarded`} />
        <MetricCard icon={TrendingUp} label="Success rate" value={metrics.successRate !== null ? `${metrics.successRate}%` : "—"} sub="Completed / awarded" />
        <MetricCard icon={Clock} label="Response time" value={metrics.responseTimeHours !== null ? `${metrics.responseTimeHours}h` : "—"} sub="Avg. to first bid" />
      </section>

      {/* B. Professional details */}
      {(profile.skills?.length || profile.certifications?.length || profile.licenseNumber || profile.services?.length) && (
        <section className="premium-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-content"><ShieldCheck className="h-5 w-5 text-accent" /> Professional details</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {profile.services?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted">Services</p>
                <Chips items={profile.services} />
              </div>
            )}
            {profile.skills?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted">Skills</p>
                <Chips items={profile.skills} tone="skill" />
              </div>
            )}
            {profile.certifications?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted">Certifications</p>
                <Chips items={profile.certifications} />
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted">License</p>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-content">
                <FileText className="h-4 w-4 text-muted" />
                {profile.licenseNumber || "Not provided"}
                {profile.isVerified && profile.licenseNumber && <BadgeCheck className="h-4 w-4 text-success" />}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* C. Portfolio */}
      <section id="portfolio" className="premium-card rounded-2xl p-6">
        <h2 className="text-xl font-extrabold text-content">Portfolio</h2>
        {portfolioImages.length === 0 && completedProjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">This contractor hasn't added portfolio work yet.</p>
        ) : (
          <>
            {portfolioImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {portfolioImages.map((image, index) => (
                  <a key={image.publicId || index} href={image.url} target="_blank" rel="noreferrer">
                    <img src={image.url} alt={`Portfolio ${index + 1}`} className="h-32 w-full rounded-xl object-cover transition hover:opacity-90" />
                  </a>
                ))}
              </div>
            )}

            {completedProjects.length > 0 && (
              <>
                <p className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-muted">Completed projects</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completedProjects.map((project) => (
                    <div key={project._id} className="overflow-hidden rounded-xl border border-line bg-surface">
                      {project.images?.[0]?.url && !/pdf/i.test(project.images[0].mimeType || "") ? (
                        <img src={project.images[0].url} alt={project.title} className="h-36 w-full object-cover" />
                      ) : (
                        <div className="grid h-36 w-full place-items-center bg-surface-2"><Briefcase className="h-8 w-8 text-subtle" /></div>
                      )}
                      <div className="p-4">
                        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold capitalize text-muted">{project.category}</span>
                        <h3 className="mt-2 truncate font-bold text-content">{project.title}</h3>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted">
                          <span>{project.location}</span>
                          <span className="font-bold text-content">{currency(project.budget)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* E. Reviews */}
      <section id="reviews" className="space-y-4">
        <h2 className="text-xl font-extrabold text-content">Customer reviews</h2>
        <ContractorReviews contractorId={contractor._id} currentUser={user} />
      </section>
    </main>
  );
};
