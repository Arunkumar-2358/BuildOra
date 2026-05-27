import { ImagePlus, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { api } from "../services/api";

export const PostProject = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    location: "",
    category: "construction",
    timeline: "",
    images: []
  });

  const update = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? Array.from(files) : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "images") value.forEach((file) => formData.append("images", file));
        else formData.append(key, value);
      });
      const { data } = await api.post("/projects", formData);
      navigate(`/projects/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Post a project requirement</h1>
      <form onSubmit={submit} className="mt-6 grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <Input label="Project title" name="title" value={form.title} onChange={update} required />
        <Textarea label="Description" name="description" value={form.description} onChange={update} required />
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Budget" name="budget" type="number" value={form.budget} onChange={update} required />
          <Input label="Location" name="location" value={form.location} onChange={update} required />
          <Select label="Category" name="category" value={form.category} onChange={update}>
            {["construction", "interior", "renovation", "architecture", "landscaping", "other"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
          <Input label="Timeline" name="timeline" value={form.timeline} onChange={update} placeholder="e.g. 3 months" required />
        </div>
        <label className="rounded-lg border border-dashed border-ink/20 bg-mist/60 p-5 text-center">
          <ImagePlus className="mx-auto h-8 w-8 text-moss" />
          <span className="mt-2 block text-sm font-bold text-ink">Upload images or floor plans</span>
          <input className="mt-4 text-sm" name="images" type="file" accept="image/*,application/pdf" multiple onChange={update} />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading} className="justify-self-start">
          <Send className="h-4 w-4" />
          {loading ? "Posting..." : "Post project"}
        </Button>
      </form>
    </main>
  );
};
