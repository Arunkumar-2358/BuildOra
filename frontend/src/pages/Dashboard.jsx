import { Briefcase, ClipboardCheck, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ProjectCard } from "../components/ProjectCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);

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
      <section className="rounded-lg bg-ink p-6 text-white shadow-soft md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-white/65">{user.role === "customer" ? "Customer dashboard" : "Contractor dashboard"}</p>
            <h1 className="mt-2 text-3xl font-extrabold">Hello, {user.name}</h1>
          </div>
          <Button variant="accent">
            <Link className="inline-flex items-center gap-2" to={user.role === "customer" ? "/post-project" : "/browse-projects"}>
              <Plus className="h-4 w-4" />
              {user.role === "customer" ? "Post project" : "Find leads"}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          [Briefcase, "Projects", projects.length],
          [ClipboardCheck, "Bids", bids.length],
          [MessageCircle, "Chats", "Live"]
        ].map(([Icon, label, value]) => (
          <div key={label} className="rounded-lg border border-ink/10 bg-white p-5">
            <Icon className="h-7 w-7 text-moss" />
            <p className="mt-4 text-sm font-semibold text-ink/60">{label}</p>
            <p className="text-3xl font-extrabold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">{user.role === "customer" ? "Your projects" : "Open projects"}</h2>
          <Link className="text-sm font-bold text-moss" to={user.role === "customer" ? "/post-project" : "/browse-projects"}>
            View all
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
        </div>
      </section>
    </main>
  );
};
