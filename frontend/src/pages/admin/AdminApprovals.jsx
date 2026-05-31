import { Award, BadgeCheck, Briefcase, Check, FileText, Mail, MapPin, MessageCircleQuestion, Pause, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton, StatusBadge } from "../../components/admin/AdminPrimitives";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";

const FILTERS = ["pending", "approved", "rejected", "suspended", ""];
const FILTER_LABELS = { pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended", "": "All" };

export const AdminApprovals = () => {
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [contractors, setContractors] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError("");
    setContractors(null);
    const query = status ? `?status=${status}` : "";
    api
      .get(`/admin/contractors${query}`)
      .then(({ data }) => setContractors(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load contractors"));
  };

  useEffect(load, [status]);

  const act = async (id, action) => {
    let note;
    if (action === "request_info") {
      note = window.prompt("What additional information do you need from this contractor?");
      if (note === null) return; // cancelled
    }
    setBusyId(id);
    try {
      await api.patch(`/admin/contractors/${id}/verification`, { action, note });
      toast.success(`Contractor ${action.replace("_", " ")} successful`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setStatus(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              status === f ? "bg-brand-gradient text-white" : "border border-line-strong text-muted hover:text-content"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !contractors ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : contractors.length === 0 ? (
        <EmptyState icon={ShieldEmptyIcon} title="Nothing here" message={`No contractors with status "${FILTER_LABELS[status]}".`} />
      ) : (
        <div className="grid gap-4">
          {contractors.map((c) => {
            const p = c.contractorProfile || {};
            return (
              <div key={c._id} className="premium-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={c.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563EB&color=fff`}
                      alt={c.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-content">{p.businessName || c.name}</p>
                        <StatusBadge status={p.verificationStatus} />
                        {p.isVerified && <BadgeCheck className="h-4 w-4 text-success" />}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {c.email}</span>
                        {c.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.city}</span>}
                        {p.experience ? <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {p.experience} yrs</span> : null}
                        {p.reviewsCount ? <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {p.rating} ({p.reviewsCount})</span> : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submitted details */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Specialization" value={p.specialization} />
                  <Detail label="License" value={p.licenseNumber} icon={FileText} />
                  <Detail label="Skills" value={p.skills?.join(", ")} />
                  <Detail label="Certifications" value={p.certifications?.join(", ")} />
                </div>
                {p.bio && <p className="mt-3 rounded-xl bg-surface-2/60 p-3 text-sm text-muted">{p.bio}</p>}
                {p.adminNote && <p className="mt-2 text-xs text-amber-400">Admin note: {p.adminNote}</p>}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionBtn onClick={() => act(c._id, "approve")} disabled={busyId === c._id} tone="success" icon={Check}>Approve</ActionBtn>
                  <ActionBtn onClick={() => act(c._id, "reject")} disabled={busyId === c._id} tone="danger" icon={X}>Reject</ActionBtn>
                  <ActionBtn onClick={() => act(c._id, "request_info")} disabled={busyId === c._id} icon={MessageCircleQuestion}>Request info</ActionBtn>
                  <ActionBtn onClick={() => act(c._id, "suspend")} disabled={busyId === c._id} tone="danger" icon={Pause}>Suspend</ActionBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, icon: Icon }) => (
  <div>
    <p className="text-xs font-bold uppercase text-muted">{label}</p>
    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-content">
      {Icon && value && <Icon className="h-3.5 w-3.5 text-muted" />}
      {value || <span className="font-normal text-subtle">Not provided</span>}
    </p>
  </div>
);

const toneClasses = {
  default: "border-line-strong text-content hover:bg-surface-2",
  success: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  danger: "border-red-500/40 text-red-400 hover:bg-red-500/10"
};

const ActionBtn = ({ children, onClick, disabled, tone = "default", icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 ${
      tone === "success" ? `border-transparent ${toneClasses.success}` : toneClasses[tone]
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
    {children}
  </button>
);

const ShieldEmptyIcon = (props) => <BadgeCheck {...props} />;
