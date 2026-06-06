import { Pause, Play, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton, StatusBadge } from "../../components/admin/AdminPrimitives";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import { shortDate } from "../../utils/format";

const ROLE_FILTERS = ["", "customer", "contractor"];
const ROLE_LABELS = { "": "All roles", customer: "Customers", contractor: "Contractors" };

export const AdminUsers = () => {
  const toast = useToast();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError("");
    setData(null);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (query) params.set("search", query);
    api
      .get(`/admin/users?${params.toString()}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load users"));
  };

  useEffect(load, [role, query]);

  const toggleStatus = async (user) => {
    const next = user.status === "suspended" ? "active" : "suspended";
    if (next === "suspended" && !window.confirm(`Suspend ${user.name}? They won't be able to log in.`)) return;
    setBusyId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/status`, { status: next });
      toast.success(`${user.name} ${next === "suspended" ? "suspended" : "reactivated"}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r || "all"}
              onClick={() => setRole(r)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                role === r ? "bg-brand-gradient text-white" : "border border-line-strong text-muted hover:text-content"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
          className="ml-auto flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 py-2"
        >
          <Search className="h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-44 bg-transparent text-sm text-content outline-none placeholder:text-subtle"
          />
        </form>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <Skeleton className="h-72" />
      ) : data.users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="Try a different filter or search term." />
      ) : (
        <div className="premium-card overflow-hidden rounded-2xl">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id} className="border-b border-line/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=D62D14&color=fff`}
                          alt={u.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-content">{u.name}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted">{shortDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={busyId === u._id}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                          u.status === "suspended"
                            ? "border-success/40 text-success hover:bg-success/10"
                            : "border-brand/40 text-brand hover:bg-brand/10"
                        }`}
                      >
                        {u.status === "suspended" ? <><Play className="h-3.5 w-3.5" /> Reactivate</> : <><Pause className="h-3.5 w-3.5" /> Suspend</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
