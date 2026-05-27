import { Check, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { currency, shortDate } from "../utils/format";

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidForm, setBidForm] = useState({ quotationAmount: "", estimatedDuration: "", proposalMessage: "" });
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data.project);
    setBids(data.bids);
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitBid = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/bids", { ...bidForm, project: id });
      setBids((current) => [data, ...current]);
      setBidForm({ quotationAmount: "", estimatedDuration: "", proposalMessage: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit bid");
    }
  };

  const updateBid = async (bidId, status) => {
    await api.patch(`/bids/${bidId}/status`, { status });
    load();
  };

  const startChat = async (participantId) => {
    const { data } = await api.post("/chats/start", { participantId, projectId: id });
    navigate(`/chat/${data._id}`);
  };

  if (!project) return <main className="mx-auto max-w-7xl px-4 py-8">Loading project...</main>;

  const isOwner = project.customer?._id === user._id;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold capitalize text-moss">{project.category}</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">{project.title}</h1>
        <p className="mt-4 text-ink/70 leading-7">{project.description}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-mist p-4">
            <p className="text-xs font-bold uppercase text-ink/50">Budget</p>
            <p className="mt-1 font-extrabold text-ink">{currency(project.budget)}</p>
          </div>
          <div className="rounded-lg bg-mist p-4">
            <p className="text-xs font-bold uppercase text-ink/50">Location</p>
            <p className="mt-1 font-extrabold text-ink">{project.location}</p>
          </div>
          <div className="rounded-lg bg-mist p-4">
            <p className="text-xs font-bold uppercase text-ink/50">Timeline</p>
            <p className="mt-1 font-extrabold text-ink">{project.timeline}</p>
          </div>
        </div>
        {project.images?.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {project.images.map((image) => (
              <img key={image.url} src={image.url} alt={project.title} className="h-56 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-5">
        {user.role === "contractor" && !isOwner && (
          <form onSubmit={submitBid} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-ink">Submit quotation</h2>
            <div className="mt-4 grid gap-4">
              <Input label="Quotation amount" name="quotationAmount" type="number" value={bidForm.quotationAmount} onChange={(e) => setBidForm({ ...bidForm, quotationAmount: e.target.value })} required />
              <Input label="Estimated duration" name="estimatedDuration" value={bidForm.estimatedDuration} onChange={(e) => setBidForm({ ...bidForm, estimatedDuration: e.target.value })} required />
              <Textarea label="Proposal message" name="proposalMessage" value={bidForm.proposalMessage} onChange={(e) => setBidForm({ ...bidForm, proposalMessage: e.target.value })} required />
              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
              <Button><Send className="h-4 w-4" /> Submit bid</Button>
            </div>
          </form>
        )}

        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-ink">Bids</h2>
          <div className="mt-4 space-y-4">
            {bids.map((bid) => (
              <div key={bid._id} className="rounded-lg border border-ink/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{bid.contractor?.contractorProfile?.businessName || bid.contractor?.name}</p>
                    <p className="text-sm text-ink/60">{shortDate(bid.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold capitalize text-moss">{bid.status}</span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-ink">{currency(bid.quotationAmount)}</p>
                <p className="mt-1 text-sm font-semibold text-ink/60">{bid.estimatedDuration}</p>
                <p className="mt-3 text-sm leading-6 text-ink/70">{bid.proposalMessage}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => startChat(bid.contractor._id)}>
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
            {!bids.length && <p className="text-sm text-ink/60">No bids yet.</p>}
          </div>
        </div>
      </aside>
    </main>
  );
};
