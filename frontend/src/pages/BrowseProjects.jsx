import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input, Select } from "../components/Input";
import { ProjectCard } from "../components/ProjectCard";
import { api } from "../services/api";

export const BrowseProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", city: "" });

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams({ status: "open", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/projects?${params}`);
      setProjects(data.projects || []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [filters]);

  const update = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">Browse available projects</h1>
          <p className="mt-2 text-ink/65">Search qualified leads and submit a quotation.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input aria-label="Search" name="search" placeholder="Search" value={filters.search} onChange={update} />
          <Input aria-label="City" name="city" placeholder="City" value={filters.city} onChange={update} />
          <Select aria-label="Category" name="category" value={filters.category} onChange={update}>
            <option value="">All categories</option>
            {["construction", "interior", "renovation", "architecture", "landscaping", "other"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink/65">
        <Search className="h-4 w-4" />
        {projects.length} matching projects
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
      </div>
    </main>
  );
};
