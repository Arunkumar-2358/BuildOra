import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ContractorReviews } from "../components/ContractorReviews";
import { Input, Textarea } from "../components/Input";
import { MapView } from "../components/MapView";
import { RecommendedContractors } from "../components/RecommendedContractors";
import { ReviewCard } from "../components/ReviewCard";
import { ReviewForm } from "../components/ReviewForm";
import { Avatar } from "../components/ui/Avatar";
import { Badge, StatusPill } from "../components/ui/Badge";
import { Container } from "../components/ui/Container";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { currency, formatBytes, shortDate } from "../utils/format";
import { isPdf } from "../utils/upload";

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidForm, setBidForm] = useState({ quotationAmount: "", estimatedDuration: "", proposalMessage: "" });
  const [error, setError] = useState("");
  const [gate, setGate] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewsKey, setReviewsKey] = useState(0);

  const load = async () => {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data.project);
    setBids(data.bids);
    const { data: existingReview } = await api.get(`/reviews/project/${id}`);
    setReview(existingReview);
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitBid = async (event) => {
    event.preventDefault();
    setError("");
    setGate(null);
    try {
      await api.post("/bids", { ...bidForm, project: id });
      await load();
      setBidForm({ quotationAmount: "", estimatedDuration: "", proposalMessage: "" });
    } catch (err) {
      const code = err.response?.data?.code;
      if (err.response?.status === 402 || ["SUBSCRIPTION_REQUIRED", "FREE_LIMIT_REACHED", "PREMIUM_REQUIRED"].includes(code)) {
        setGate({
          message: err.response?.data?.message || "Subscribe to keep bidding.",
          premium: code === "PREMIUM_REQUIRED"
        });
      } else {
        setError(err.response?.data?.message || "Unable to submit bid");
      }
    }
  };

  const updateBid = async (bidId, status) => {
    await api.patch(`/bids/${bidId}/status`, { status });
    load();
  };

  const markCompleted = async () => {
    await api.patch(`/projects/${id}/status`, { status: "completed" });
    load();
  };

  const startChat = async (participantId) => {
    const { data } = await api.post("/chats/start", { participantId, projectId: id });
    navigate(`/chat/${data._id}`);
  };

  const onReviewMutated = (updated) => {
    setReview(updated);
    setReviewsKey((key) => key + 1);
  };

  if (!project) {
    return (
      <Container className="space-y-4 py-8">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </Container>
    );
  }

  const isOwner = project.customer?._id === user._id;
  const acceptedBid = bids.find((bid) => bid.status === "accepted");
  const awardedContractorId = acceptedBid?.contractor?._id;
  const isCompleted = project.status === "completed";
  const canReview = isOwner && isCompleted && acceptedBid && !review;
  const canBid = user.role === "contractor" && !isOwner && !["completed", "awarded"].includes(project.status);

  const META = [
    { icon: IndianRupee, label: "Budget", value: currency(project.budget) },
    { icon: MapPin, label: "Location", value: project.location || "—" },
    { icon: Clock, label: "Timeline", value: project.timeline || "—" }
  ];

  return (
    <Container className="space-y-8 py-8">
      <Link to={isOwner ? "/dashboard" : "/browse-projects"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-content">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Main */}
        <section className="premium-card rounded-2xl p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{project.category}</Badge>
            <StatusPill status={project.status} />
            {project.visibility === "premium" && <Badge tone="spark">Premium</Badge>}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-content">{project.title}</h1>
          <p className="mt-4 leading-7 text-muted">{project.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {META.map((m) => (
              <div key={m.label} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-subtle">
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </p>
                <p className="mt-1.5 font-display text-lg font-bold text-content">{m.value}</p>
              </div>
            ))}
          </div>

          {project.images?.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {project.images.map((image, index) =>
                isPdf(image.mimeType || image.url) ? (
                  <a
                    key={image.publicId || index}
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    download={image.originalName || `floor-plan-${index + 1}.pdf`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-brand/50"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-content">{image.originalName || "Floor plan.pdf"}</p>
                      <p className="text-xs font-semibold text-brand">{image.bytes ? formatBytes(image.bytes) : "PDF document"} · View</p>
                    </div>
                  </a>
                ) : (
                  <a key={image.publicId || index} href={image.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl">
                    <img
                      src={image.url}
                      alt={image.originalName || project.title}
                      className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>
                )
              )}
            </div>
          )}

          {project.geo?.coordinates?.length === 2 && (
            <div className="mt-6">
              <p className="mb-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-muted">
                <MapPin className="h-3.5 w-3.5" /> Project location{project.pincode ? ` · ${project.pincode}` : ""}
              </p>
              <MapView
                center={{ lat: project.geo.coordinates[1], lng: project.geo.coordinates[0] }}
                markers={[{ id: "project", lat: project.geo.coordinates[1], lng: project.geo.coordinates[0], title: project.title, type: "project" }]}
                height="14rem"
                zoom={13}
              />
            </div>
          )}

          {isOwner && project.status === "awarded" && (
            <Button variant="spark" className="mt-6" onClick={markCompleted}>
              <CheckCircle2 className="h-4 w-4" /> Mark project completed
            </Button>
          )}
        </section>

        {/* Aside */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          {canBid && (
            <form onSubmit={submitBid} className="premium-card rounded-2xl p-5">
              <h2 className="text-lg font-bold text-content">Submit your quotation</h2>
              <p className="mt-1 text-sm text-muted">Stand out with a clear, scoped proposal.</p>
              <div className="mt-4 grid gap-4">
                <Input label="Quotation amount (₹)" name="quotationAmount" type="number" value={bidForm.quotationAmount} onChange={(e) => setBidForm({ ...bidForm, quotationAmount: e.target.value })} required />
                <Input label="Estimated duration" name="estimatedDuration" placeholder="e.g. 8 weeks" value={bidForm.estimatedDuration} onChange={(e) => setBidForm({ ...bidForm, estimatedDuration: e.target.value })} required />
                <Textarea label="Proposal message" name="proposalMessage" value={bidForm.proposalMessage} onChange={(e) => setBidForm({ ...bidForm, proposalMessage: e.target.value })} required />
                {gate && (
                  <div className="rounded-xl border border-spark/30 bg-spark/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-spark">
                      <Sparkles className="h-4 w-4" /> {gate.premium ? "Premium required" : "Upgrade to keep bidding"}
                    </p>
                    <p className="mt-1 text-sm text-muted">{gate.message}</p>
                    <Button as={Link} to="/plans" className="mt-3 w-full">View plans</Button>
                  </div>
                )}
                {error && <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}
                <Button type="submit"><Send className="h-4 w-4" /> Submit bid</Button>
              </div>
            </form>
          )}

          <div className="premium-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-content">Bids</h2>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted">{bids.length}</span>
            </div>
            <div className="mt-4 space-y-4">
              {bids.map((bid) => (
                <div key={bid._id} className="rounded-xl border border-line p-4 transition hover:border-line-strong">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/contractors/${bid.contractor._id}`} className="group flex items-center gap-3">
                      <Avatar src={bid.contractor?.profileImage?.url} name={bid.contractor?.contractorProfile?.businessName || bid.contractor?.name} size="md" />
                      <div>
                        <p className="font-bold text-content transition group-hover:text-brand">{bid.contractor?.contractorProfile?.businessName || bid.contractor?.name}</p>
                        <p className="text-xs text-subtle">{shortDate(bid.createdAt)}</p>
                      </div>
                    </Link>
                    <StatusPill status={bid.status} />
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold text-content tabular">{currency(bid.quotationAmount)}</p>
                  <p className="mt-0.5 text-sm font-semibold text-muted">{bid.estimatedDuration}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{bid.proposalMessage}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button as={Link} to={`/contractors/${bid.contractor._id}`} variant="secondary" size="sm">
                      <Briefcase className="h-4 w-4" /> Profile
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startChat(bid.contractor._id)}>
                      <MessageCircle className="h-4 w-4" /> Chat
                    </Button>
                    {isOwner && bid.status === "pending" && (
                      <>
                        <Button variant="spark" size="sm" onClick={() => updateBid(bid._id, "accepted")}><Check className="h-4 w-4" /> Accept</Button>
                        <Button variant="ghost" size="sm" onClick={() => updateBid(bid._id, "rejected")}><X className="h-4 w-4" /> Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!bids.length && <p className="py-4 text-center text-sm text-muted">No bids yet — be the first to quote.</p>}
            </div>
          </div>
        </aside>
      </div>

      {isOwner && ["open", "in-review"].includes(project.status) && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-content">
            <Sparkles className="h-6 w-6 text-brand" /> Recommended contractors
          </h2>
          <p className="-mt-2 text-sm text-muted">Best matches for this project by location, rating, specialization, and more.</p>
          <RecommendedContractors projectId={id} />
        </section>
      )}

      {(awardedContractorId || review) && (
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-content">
            <Star className="h-6 w-6 fill-spark text-spark" /> Ratings & reviews
          </h2>

          {canReview && <ReviewForm projectId={id} onSubmitted={onReviewMutated} />}

          {isOwner && isCompleted && !acceptedBid && (
            <p className="premium-card rounded-2xl p-5 text-sm text-muted">
              This project was completed without an awarded contractor, so there is no one to review.
            </p>
          )}

          {review && (
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Review for this project</p>
              <ReviewCard review={review} currentUser={user} onUpdated={onReviewMutated} />
            </div>
          )}

          {awardedContractorId && (
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Contractor reputation</p>
              <ContractorReviews contractorId={awardedContractorId} currentUser={user} refreshKey={reviewsKey} />
            </div>
          )}
        </section>
      )}
    </Container>
  );
};
