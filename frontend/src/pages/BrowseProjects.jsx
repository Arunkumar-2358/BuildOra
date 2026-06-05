import { Compass, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input, Select } from "../components/Input";
import { ProjectCard } from "../components/ProjectCard";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";
import { api } from "../services/api";

const CATEGORIES = ["construction", "interior", "renovation", "architecture", "landscaping", "other"];

export const BrowseProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", category: "", city: "" });

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams({
        status: "open",
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });
      try {
        const { data } = await api.get(`/projects?${params}`);
        setProjects(data.projects || []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters]);

  const update = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <Container className="py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-content md:text-4xl">Browse open projects</h1>
        <p className="mt-2 text-muted">Search qualified leads, apply filters, and submit high-conversion quotations.</p>
      </header>

      {/* Filter bar */}
      <div className="premium-card mt-6 grid gap-3 rounded-2xl p-3 md:grid-cols-[1fr_13rem_13rem]">
        <Input icon={Search} aria-label="Search" name="search" placeholder="Search projects…" value={filters.search} onChange={update} />
        <Input aria-label="City" name="city" placeholder="City" value={filters.city} onChange={update} />
        <Select aria-label="Category" name="category" value={filters.category} onChange={update}>
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category} className="capitalize">{category}</option>
          ))}
        </Select>
      </div>

      <p className="mb-4 mt-5 text-sm font-semibold text-muted">
        {loading ? "Searching…" : `${projects.length} open project${projects.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => <ProjectCard key={project._id} project={project} index={i} />)}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="No matching projects"
          description="Try clearing filters or broadening your search — new leads are posted every day."
        />
      )}
    </Container>
  );
};
