import { AlertCircle, FileText, ImagePlus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { LocationPicker } from "../components/LocationPicker";
import { api } from "../services/api";
import { formatBytes } from "../utils/format";
import { MAX_FILE_BYTES, MAX_PROJECT_FILES, isPdf, validateFiles } from "../utils/upload";

export const PostProject = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    location: "",
    state: "",
    pincode: "",
    lat: "",
    lng: "",
    category: "construction",
    timeline: "",
    images: []
  });

  // LocationPicker uses `city`; map it onto the project's `location` field.
  const onLocation = ({ city, ...rest }) =>
    setForm((current) => ({ ...current, ...rest, ...(city !== undefined ? { location: city } : {}) }));

  // Object URLs for image previews — memoized so they're stable per file.
  const previews = useMemo(
    () => form.images.map((file) => ({ file, url: isPdf(file.type) ? null : URL.createObjectURL(file) })),
    [form.images]
  );

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addFiles = (event) => {
    const { valid, errors } = validateFiles(event.target.files, { existingCount: form.images.length });
    setFileErrors(errors);
    if (valid.length) {
      setForm((current) => {
        // De-duplicate by name+size so re-selecting the same file is a no-op.
        const seen = new Set(current.images.map((f) => `${f.name}:${f.size}`));
        const merged = [...current.images, ...valid.filter((f) => !seen.has(`${f.name}:${f.size}`))];
        return { ...current, images: merged.slice(0, MAX_PROJECT_FILES) };
      });
    }
    event.target.value = ""; // allow re-selecting the same file after removal
  };

  const removeFile = (index) =>
    setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setProgress(0);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "images") value.forEach((file) => formData.append("images", file));
        else formData.append(key, value);
      });
      const { data } = await api.post("/projects", formData, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      navigate(`/projects/${data._id}`);
    } catch (err) {
      // Stay on the page so the user can retry; surface a clear reason.
      setError(err.response?.data?.message || "Unable to create project. Please try again.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-content">Post a project requirement</h1>
      <p className="mt-2 text-muted">Step {step} of 3 - crafted to help contractors respond with high-quality bids.</p>
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
              <label className="mb-1.5 block text-sm font-semibold text-muted">Budget (INR)</label>
              <input className="w-full accent-blue-500" name="budget" type="range" min="100000" max="20000000" step="50000" value={form.budget || 100000} onChange={update} />
              <p className="mt-2 text-sm font-bold text-accent">₹{Number(form.budget || 100000).toLocaleString("en-IN")}</p>
            </div>
            <LocationPicker
              label="Project location"
              value={{ city: form.location, state: form.state, pincode: form.pincode, lat: form.lat, lng: form.lng }}
              onChange={onLocation}
            />
            <p className="-mt-1 text-xs text-muted">Adding a precise location helps us match you with the best nearby contractors.</p>
            <Input label="Timeline" name="timeline" value={form.timeline} onChange={update} placeholder="e.g. 3 months" required />
          </>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <label className="block cursor-pointer rounded-xl border border-dashed border-line-strong bg-surface/60 p-6 text-center transition hover:border-primary hover:bg-surface-2/40">
              <ImagePlus className="mx-auto h-8 w-8 text-accent" />
              <span className="mt-2 block text-sm font-bold text-content">Upload images or floor plans</span>
              <span className="mt-1 block text-xs text-muted">
                PDF, JPG, JPEG, PNG · up to {formatBytes(MAX_FILE_BYTES)} each · max {MAX_PROJECT_FILES} files
              </span>
              <input
                className="sr-only"
                name="images"
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                multiple
                onChange={addFiles}
              />
              <span className="mt-4 inline-block rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-content">
                Choose files
              </span>
            </label>

            {fileErrors.length > 0 && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {fileErrors.map((msg) => (
                  <p key={msg} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {msg}
                  </p>
                ))}
              </div>
            )}

            {/* Selected file previews */}
            {previews.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {previews.map(({ file, url }, index) => (
                  <div key={`${file.name}:${file.size}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                    {url ? (
                      <img src={url} alt={file.name} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-400">
                        <FileText className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">{file.name}</p>
                      <p className="text-xs text-muted">{isPdf(file.type) ? "PDF" : "Image"} · {formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                      aria-label={`Remove ${file.name}`}
                      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted hover:text-red-400 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload progress */}
            {loading && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-muted">
                  {progress < 100 ? `Uploading… ${progress}%` : "Finalizing project…"}
                </p>
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-3">
          {step > 1 && <Button type="button" variant="secondary" disabled={loading} onClick={() => setStep((v) => v - 1)}>Back</Button>}
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
