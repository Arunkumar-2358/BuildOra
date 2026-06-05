import {
  ArrowRight,
  Briefcase,
  ClipboardCheck,
  Compass,
  FolderOpen,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "../components/Button";
import { ProjectCard } from "../components/ProjectCard";
import { SubscriptionGate } from "../components/SubscriptionGate";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { Reveal } from "../components/ui/Reveal";
import { Stat } from "../components/ui/Stat";
import { StatusPill } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { CardSkeleton } from "../components/ui/Skeleton";
import { currency, relativeTime } from "../utils/format";

const CHART = [
  { name: "Mon", value: 3 },
  { name: "Tue", value: 7 },
  { name: "Wed", value: 5 },
  { name: "Thu", value: 9 },
  { name: "Fri", value: 8 },
  { name: "Sat", value: 12 },
  { name: "Sun", value: 10 }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const isCustomer = user.role === "customer";
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const projectUrl = isCustomer ? "/projects?mine=true" : "/projects?status=open&limit=6";
        const [{ data: projectData }, { data: bidData }] = await Promise.all([
          api.get(projectUrl),
          api.get("/bids")
        ]);
        setProjects(projectData.projects || []);
        setBids(bidData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isCustomer]);

  const wonCount = isCustomer
    ? projects.filter((p) => ["awarded", "completed"].includes(p.status)).length
    : bids.filter((b) => b.status === "accepted").length;

  const stats = isCustomer
    ? [
        { icon: Briefcase, label: "Projects posted", value: projects.length },
        { icon: ClipboardCheck, label: "Bids received", value: bids.length },
        { icon: Trophy, label: "Awarded", value: wonCount },
        { icon: TrendingUp, label: "This week", value: 38, suffix: "%", delta: 12 }
      ]
    : [
        { icon: Compass, label: "Open leads", value: projects.length },
        { icon: ClipboardCheck, label: "My bids", value: bids.length },
        { icon: Trophy, label: "Won", value: wonCount },
        { icon: TrendingUp, label: "Win rate", value: bids.length ? Math.round((wonCount / bids.length) * 100) : 0, suffix: "%", delta: 8 }
      ];

  return (
    <Container className="space-y-8 py-8">
      {/* Welcome header */}
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-eyebrow uppercase text-brand">
            <Sparkles className="h-4 w-4" />
            {isCustomer ? "Customer command center" : "Contractor growth desk"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-content md:text-4xl">
            Welcome back, {user.name?.split(" ")[0] || "there"}.
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            {isCustomer
              ? "Track your projects, compare quotations, and keep every contractor conversation in one place."
              : "Find qualified leads, submit sharper quotations, and move deals forward with realtime chat."}
          </p>
        </div>
        <Button as={Link} to={isCustomer ? "/post-project" : "/browse-projects"} size="lg" className="shrink-0">
          <Plus className="h-4 w-4" />
          {isCustomer ? "Post a project" : "Find leads"}
        </Button>
      </Reveal>

      {!isCustomer && <SubscriptionGate />}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <Stat icon={s.icon} label={s.label} value={s.value} suffix={s.suffix} delta={s.delta} />
          </Reveal>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Projects */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-content">{isCustomer ? "Your projects" : "Open leads"}</h2>
            <Link
              to={isCustomer ? "/post-project" : "/browse-projects"}
              className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : projects.length ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {projects.map((project, i) => (
                <ProjectCard key={project._id} project={project} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title={isCustomer ? "No projects yet" : "No open leads loaded"}
              description={
                isCustomer
                  ? "Create your first requirement and watch verified contractor bids arrive here."
                  : "Head to the browse page to discover fresh, matched leads."
              }
              action={
                <Button as={Link} to={isCustomer ? "/post-project" : "/browse-projects"}>
                  {isCustomer ? "Post a project" : "Browse leads"} <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </section>

        {/* Sidebar: momentum + activity */}
        <aside className="space-y-6">
          <div className="premium-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-content">Weekly momentum</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                <TrendingUp className="h-3.5 w-3.5" /> +12%
              </span>
            </div>
            <div className="mt-3 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="momentum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D62D14" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#D62D14" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <Tooltip
                    cursor={{ stroke: "rgb(var(--line-strong))" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgb(var(--line))",
                      background: "rgb(var(--surface))",
                      color: "rgb(var(--content))",
                      fontSize: 12
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#D62D14" strokeWidth={2.5} fill="url(#momentum)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="premium-card rounded-2xl p-5">
            <p className="text-sm font-bold text-content">Recent activity</p>
            <div className="mt-4 space-y-3">
              {bids.slice(0, 5).map((bid) => (
                <div key={bid._id} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">
                      {currency(bid.quotationAmount)} · {bid.project?.title || "Project bid"}
                    </p>
                    <p className="text-xs text-subtle">{relativeTime(bid.createdAt)}</p>
                  </div>
                  <StatusPill status={bid.status} className="hidden sm:inline-flex" />
                </div>
              ))}
              {!bids.length && (
                <p className="py-4 text-center text-sm text-subtle">No activity yet — it’ll show up here.</p>
              )}
            </div>
          </div>

          {/* Smart recommendation */}
          <Link
            to={isCustomer ? "/find-contractors" : "/browse-projects"}
            className="group block overflow-hidden rounded-2xl bg-ink-gradient p-5 text-white"
          >
            <Sparkles className="h-6 w-6 text-spark" />
            <p className="mt-3 font-bold">
              {isCustomer ? "Find top-rated pros near you" : "Discover smart-matched leads"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {isCustomer ? "Hand-picked by rating, location and specialization." : "Ranked for your trade and location."}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-spark">
              Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </aside>
      </div>
    </Container>
  );
};
