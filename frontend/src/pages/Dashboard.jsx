import { ArrowRight, Briefcase, ClipboardCheck, MessageCircle, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "../components/Button";
import { ProjectCard } from "../components/ProjectCard";
import { SubscriptionGate } from "../components/SubscriptionGate";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);
  const chartData = [
    { name: "Mon", value: 3 },
    { name: "Tue", value: 7 },
    { name: "Wed", value: 5 },
    { name: "Thu", value: 9 },
    { name: "Fri", value: 8 },
    { name: "Sat", value: 11 },
    { name: "Sun", value: 10 }
  ];

  useEffect(() => {
    const load = async () => {
      const projectUrl = user.role === "customer" ? "/projects?mine=true" : "/projects?status=open&limit=6";
      const [{ data: projectData }, { data: bidData }] = await Promise.all([
        api.get(projectUrl),
        api.get("/bids")
      ]);
      setProjects(projectData.projects || []);
      setBids(bidData || []);
    };
    load();
  }, [user.role]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-glow md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white/75">
              <Sparkles className="h-4 w-4 text-gold" />
              {user.role === "customer" ? "Customer command center" : "Contractor growth desk"}
            </p>
            <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">Hello, {user.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              {user.role === "customer"
                ? "Track projects, compare quotations, and keep every contractor conversation in one place."
                : "Find qualified leads, submit sharper quotations, and move deals forward with realtime chat."}
            </p>
          </div>
          <Button as={Link} to={user.role === "customer" ? "/post-project" : "/browse-projects"} className="px-5 py-3">
            <Plus className="h-4 w-4" />
            {user.role === "customer" ? "Post project" : "Find leads"}
          </Button>
        </div>
      </section>

      {user.role === "contractor" && <SubscriptionGate />}

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          [Briefcase, "Projects", projects.length],
          [ClipboardCheck, "Bids", bids.length],
          [MessageCircle, "Chats", "Live"]
        ].map(([Icon, label, value]) => (
          <div key={label} className="premium-card rounded-2xl p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2">
              <Icon className="h-6 w-6 text-accent" />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
            <p className="text-3xl font-extrabold text-content">{value}</p>
          </div>
        ))}
        <div className="premium-card rounded-2xl p-5">
          <p className="text-sm font-semibold text-muted">Weekly momentum</p>
          <div className="mt-3 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#60A5FA" fillOpacity={1} fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-content">{user.role === "customer" ? "Your projects" : "Open projects"}</h2>
          <Link className="inline-flex items-center gap-1 text-sm font-bold text-accent" to={user.role === "customer" ? "/post-project" : "/browse-projects"}>
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
        </div>
        {!projects.length && (
          <div className="premium-card rounded-2xl p-8 text-center">
            <p className="text-lg font-extrabold text-content">
              {user.role === "customer" ? "No projects yet." : "No open projects loaded yet."}
            </p>
            <p className="mt-2 text-sm text-muted">
              {user.role === "customer" ? "Create your first requirement and watch bids arrive here." : "Check the browse page for fresh leads."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};
