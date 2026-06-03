import { Briefcase, Check, CheckCircle2, FileText, MapPin, MessageCircle, Send, Sparkles, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ContractorReviews } from "../components/ContractorReviews";
import { Input, Textarea } from "../components/Input";
import { MapView } from "../components/MapView";
import { RecommendedContractors } from "../components/RecommendedContractors";
import { ReviewCard } from "../components/ReviewCard";
import { ReviewForm } from "../components/ReviewForm";
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
    try {
      await api.post("/bids", { ...bidForm, project: id });
      await load();
      setBidForm({ quotationAmount: "", estimatedDuration: "", proposalMessage: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit bid");
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

  if (!project) return <main className="mx-auto max-w-7xl px-4 py-8 text-muted">Loading project...</main>;

  const isOwner = project.customer?._id === user._id;
  const acceptedBid = bids.find((bid) => bid.status === "accepted");
  const awardedContractorId = acceptedBid?.contractor?._id;
  const isCompleted = project.status === "completed";
  const canReview = isOwner && isCompleted && acceptedBid && !review;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="premium-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-accent">{project.category}</span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold capitalize text-muted">{project.status}</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-content">{project.title}</h1>
          <p className="mt-4 leading-7 text-muted">{project.description}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-bold uppercase text-muted">Budget</p>
              <p className="mt-1 font-extrabold text-content">{currency(project.budget)}</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-bold uppercase text-muted">Location</p>
              <p className="mt-1 font-extrabold text-content">{project.location}</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-bold uppercase text-muted">Timeline</p>
              <p className="mt-1 font-extrabold text-content">{project.timeline}</p>
            </div>
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
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-primary"
                  >
                    <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-400">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-content">{image.originalName || "Floor plan.pdf"}</p>
                      <p className="text-xs font-semibold text-accent">{image.bytes ? formatBytes(image.bytes) : "PDF document"} · View</p>
                    </div>
                  </a>
                ) : (
                  <a key={image.publicId || index} href={image.url} target="_blank" rel="noreferrer" className="block">
                    <img src={image.url} alt={image.originalName || project.title} className="h-56 w-full rounded-xl object-cover transition hover:opacity-90" />
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
            <Button variant="accent" className="mt-6" onClick={markCompleted}>
              <CheckCircle2 className="h-4 w-4" /> Mark project completed
            </Button>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          {user.role === "contractor" && !isOwner && (
            <form onSubmit={submitBid} className="premium-card rounded-2xl p-5 shadow-sm">
              <h2 className="text-xl font-extrabold text-content">Submit quotation</h2>
              <div className="mt-4 grid gap-4">
                <Input label="Quotation amount" name="quotationAmount" type="number" value={bidForm.quotationAmount} onChange={(e) => setBidForm({ ...bidForm, quotationAmount: e.target.value })} required />
                <Input label="Estimated duration" name="estimatedDuration" value={bidForm.estimatedDuration} onChange={(e) => setBidForm({ ...bidForm, estimatedDuration: e.target.value })} required />
                <Textarea label="Proposal message" name="proposalMessage" value={bidForm.proposalMessage} onChange={(e) => setBidForm({ ...bidForm, proposalMessage: e.target.value })} required />
                {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}
                <Button><Send className="h-4 w-4" /> Submit bid</Button>
              </div>
            </form>
          )}

          <div className="premium-card rounded-2xl p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-content">Bids</h2>
            <div className="mt-4 space-y-4">
              {bids.map((bid) => (
                <div key={bid._id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/contractors/${bid.contractor._id}`} className="group flex items-center gap-3">
                      <img
                        src={bid.contractor?.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.contractor?.name || "C")}&background=2563EB&color=fff`}
                        alt={bid.contractor?.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-bold text-content group-hover:text-accent">{bid.contractor?.contractorProfile?.businessName || bid.contractor?.name}</p>
                        <p className="text-sm text-muted">{shortDate(bid.createdAt)}</p>
                      </div>
                    </Link>
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold capitalize text-accent">{bid.status}</span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-content">{currency(bid.quotationAmount)}</p>
                  <p className="mt-1 text-sm font-semibold text-muted">{bid.estimatedDuration}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{bid.proposalMessage}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button as={Link} to={`/contractors/${bid.contractor._id}`} variant="secondary">
                      <Briefcase className="h-4 w-4" />
                      View profile
                    </Button>
                    <Button variant="ghost" onClick={() => startChat(bid.contractor._id)}>
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </Button>
                    {isOwner && bid.status === "pending" && (
                      <>
                        <Button variant="accent" onClick={() => updateBid(bid._id, "accepted")}><Check className="h-4 w-4" /> Accept</Button>
                        <Button variant="ghost" onClick={() => updateBid(bid._id, "rejected")}><X className="h-4 w-4" /> Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!bids.length && <p className="text-sm text-muted">No bids yet.</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* Smart-matched recommended contractors (owner, while still hiring) */}
      {isOwner && ["open", "in-review"].includes(project.status) && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-content">
            <Sparkles className="h-6 w-6 text-accent" /> Recommended contractors
          </h2>
          <p className="-mt-2 text-sm text-muted">Best matches for this project by location, rating, specialization, and more.</p>
          <RecommendedContractors projectId={id} />
        </section>
      )}

      {/* Ratings & reviews */}
      {(awardedContractorId || review) && (
        <section className="space-y-6">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-content">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" /> Ratings & reviews
          </h2>

          {canReview && <ReviewForm projectId={id} onSubmitted={onReviewMutated} />}

          {isOwner && isCompleted && !acceptedBid && (
            <p className="premium-card rounded-2xl p-5 text-sm text-muted">
              This project was completed without an awarded contractor, so there is no one to review.
            </p>
          )}

          {/* This project's review, with contractor reply controls */}
          {review && (
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Review for this project</p>
              <ReviewCard review={review} currentUser={user} onUpdated={onReviewMutated} />
            </div>
          )}

          {/* The contractor's overall reputation */}
          {awardedContractorId && (
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                Contractor reputation
              </p>
              <ContractorReviews contractorId={awardedContractorId} currentUser={user} refreshKey={reviewsKey} />
            </div>
          )}
        </section>
      )}
    </main>
  );
};
