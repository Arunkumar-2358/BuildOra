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
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Container } from "../components/ui/Container";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { api } from "../services/api";
import { currency } from "../utils/format";

const AVAILABILITY = {
  available: { label: "Available now", tone: "success" },
  busy: { label: "Currently busy", tone: "spark" },
  unavailable: { label: "Unavailable", tone: "neutral" }
};

const MetricCard = ({ icon: Icon, label, value, sub }) => (
  <div className="premium-card rounded-2xl p-5">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 font-display text-2xl font-bold text-content tabular">{value}</p>
    <p className="text-xs font-semibold text-muted">{label}</p>
    {sub && <p className="mt-0.5 text-xs text-subtle">{sub}</p>}
  </div>
);

const Chips = ({ items, tone = "neutral" }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <Badge key={item} tone={tone} size="sm">{item}</Badge>
    ))}
  </div>
);

const PortfolioSkeleton = () => (
  <Container className="space-y-6 py-8">
    <div className="skeleton h-52 rounded-3xl" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
    <div className="skeleton h-64 rounded-2xl" />
  </Container>
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
      <Container className="py-16 text-center">
        <p className="text-lg font-bold text-content">{error}</p>
        <Button as={Link} to="/dashboard" variant="secondary" className="mt-4">Back to dashboard</Button>
      </Container>
    );
  }

  if (!data) return <PortfolioSkeleton />;

  const { contractor, metrics, completedProjects } = data;
  const profile = contractor.contractorProfile || {};
  const displayName = profile.businessName || contractor.name;
  const isSelf = user?._id === contractor._id;
  const availability = AVAILABILITY[profile.availability] || AVAILABILITY.available;
  const portfolioImages = profile.portfolioImages || [];

  return (
    <Container className="space-y-6 py-8">
      {/* Hero banner */}
      <section className="premium-card overflow-hidden rounded-3xl">
        <div className="relative h-32 bg-brand-gradient md:h-40">
          <div className="absolute inset-0 blueprint-grid opacity-20" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="px-6 pb-6 md:px-8">
          <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <span className="rounded-full bg-surface p-1.5 shadow-lg">
                <Avatar src={contractor.profileImage?.url} name={displayName} size="xl" />
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-content md:text-3xl">{displayName}</h1>
                  {profile.isVerified && <Badge tone="success" icon={BadgeCheck}>Verified</Badge>}
                  <Badge tone={availability.tone}>{availability.label}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  {contractor.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {contractor.city}</span>}
                  {profile.experience ? <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {profile.experience} yrs experience</span> : null}
                  {metrics.totalReviews > 0 && <StarDisplay value={metrics.averageRating} size="sm" showValue count={metrics.totalReviews} />}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isSelf && <Button onClick={startChat}><MessageCircle className="h-4 w-4" /> Start chat</Button>}
              <Button as="a" href="#portfolio" variant="secondary">Portfolio</Button>
            </div>
          </div>
          {profile.specialization && (
            <p className="mt-4 inline-block rounded-lg bg-surface-2 px-3 py-1 text-sm font-bold text-content">{profile.specialization}</p>
          )}
          {profile.bio && <p className="mt-3 max-w-3xl leading-7 text-muted">{profile.bio}</p>}
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Award} label="Average rating" value={metrics.totalReviews ? metrics.averageRating.toFixed(1) : "New"} sub={`${metrics.totalReviews} reviews`} />
        <MetricCard icon={CheckCircle2} label="Completed projects" value={metrics.completedProjects} sub={`${metrics.awardedProjects} awarded`} />
        <MetricCard icon={TrendingUp} label="Success rate" value={metrics.successRate !== null ? `${metrics.successRate}%` : "—"} sub="Completed / awarded" />
        <MetricCard icon={Clock} label="Response time" value={metrics.responseTimeHours !== null ? `${metrics.responseTimeHours}h` : "—"} sub="Avg. to first bid" />
      </section>

      {/* Professional details */}
      {(profile.skills?.length || profile.certifications?.length || profile.licenseNumber || profile.services?.length) && (
        <section className="premium-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-content"><ShieldCheck className="h-5 w-5 text-brand" /> Professional details</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {profile.services?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-subtle">Services</p>
                <Chips items={profile.services} />
              </div>
            )}
            {profile.skills?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-subtle">Skills</p>
                <Chips items={profile.skills} tone="brand" />
              </div>
            )}
            {profile.certifications?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-subtle">Certifications</p>
                <Chips items={profile.certifications} />
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-subtle">License</p>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-content">
                <FileText className="h-4 w-4 text-muted" />
                {profile.licenseNumber || "Not provided"}
                {profile.isVerified && profile.licenseNumber && <BadgeCheck className="h-4 w-4 text-success" />}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio */}
      <section id="portfolio" className="premium-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-content">Portfolio</h2>
        {portfolioImages.length === 0 && completedProjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">This contractor hasn&rsquo;t added portfolio work yet.</p>
        ) : (
          <>
            {portfolioImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {portfolioImages.map((image, index) => (
                  <a key={image.publicId || index} href={image.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl">
                    <img src={image.url} alt={`Portfolio ${index + 1}`} className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            )}

            {completedProjects.length > 0 && (
              <>
                <p className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-subtle">Completed projects</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completedProjects.map((project) => (
                    <div key={project._id} className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:border-brand/40 hover:shadow-md">
                      {project.images?.[0]?.url && !/pdf/i.test(project.images[0].mimeType || "") ? (
                        <img src={project.images[0].url} alt={project.title} className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-36 w-full place-items-center bg-surface-2"><Briefcase className="h-8 w-8 text-subtle" /></div>
                      )}
                      <div className="p-4">
                        <Badge tone="neutral" size="sm">{project.category}</Badge>
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

      {/* Reviews */}
      <section id="reviews" className="space-y-4">
        <h2 className="text-xl font-bold text-content">Customer reviews</h2>
        <ContractorReviews contractorId={contractor._id} currentUser={user} />
      </section>
    </Container>
  );
};
