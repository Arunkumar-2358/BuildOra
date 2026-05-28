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
  const [step, setStep] = useState(1);
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
      <h1 className="text-3xl font-extrabold text-slate-100">Post a project requirement</h1>
      <p className="mt-2 text-slate-400">Step {step} of 3 - crafted to help contractors respond with high-quality bids.</p>
      <form onSubmit={submit} className="premium-card mt-6 grid gap-5 rounded-2xl p-6 shadow-sm">
        {step === 1 && (
          <>
            <Input label="Project title" name="title" value={form.title} onChange={update} required />
            <Textarea label="Description" name="description" value={form.description} onChange={update} required />
            <Select label="Category" name="category" value={form.category} onChange={update}>
              {["construction", "interior", "renovation", "architecture", "landscaping", "other"].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">Budget (INR)</label>
              <input className="w-full accent-blue-500" name="budget" type="range" min="100000" max="20000000" step="50000" value={form.budget || 100000} onChange={update} />
              <p className="mt-2 text-sm font-bold text-blue-300">₹{Number(form.budget || 100000).toLocaleString("en-IN")}</p>
            </div>
            <Input label="Location" name="location" value={form.location} onChange={update} required />
            <Input label="Timeline" name="timeline" value={form.timeline} onChange={update} placeholder="e.g. 3 months" required />
          </>
        )}
        {step === 3 && (
          <label className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-5 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-blue-300" />
            <span className="mt-2 block text-sm font-bold text-slate-100">Upload images or floor plans</span>
            <input className="mt-4 text-sm text-slate-300" name="images" type="file" accept="image/*,application/pdf" multiple onChange={update} />
            <p className="mt-2 text-xs text-slate-400">{form.images.length} files selected</p>
          </label>
        )}
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}
        <div className="flex flex-wrap gap-3">
          {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep((v) => v - 1)}>Back</Button>}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep((v) => v + 1)}>Continue</Button>
          ) : (
            <Button disabled={loading} className="justify-self-start">
              <Send className="h-4 w-4" />
              {loading ? "Posting..." : "Post project"}
            </Button>
          )}
        </div>
      </form>
    </main>
  );
};
