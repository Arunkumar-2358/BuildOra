import { AlertCircle, ArrowLeft, ArrowRight, Check, FileText, ImagePlus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { LocationPicker } from "../components/LocationPicker";
import { Container } from "../components/ui/Container";
import { cn } from "../lib/cn";
import { api } from "../services/api";
import { formatBytes } from "../utils/format";
import { MAX_FILE_BYTES, MAX_PROJECT_FILES, isPdf, validateFiles } from "../utils/upload";

const STEPS = ["Basics", "Budget & location", "Floor plans"];
const CATEGORIES = ["construction", "interior", "renovation", "architecture", "landscaping", "other"];

const Stepper = ({ step }) => (
  <ol className="mt-8 flex items-center">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const active = step === n;
      const done = step > n;
      return (
        <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                done && "bg-brand text-white",
                active && "bg-brand text-white shadow-glow",
                !done && !active && "border border-line-strong bg-surface text-subtle"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span className={cn("hidden text-sm font-semibold sm:block", active || done ? "text-content" : "text-subtle")}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className={cn("mx-3 h-0.5 flex-1 rounded-full transition-colors", done ? "bg-brand" : "bg-line")} />
          )}
        </li>
      );
    })}
  </ol>
);

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

  const onLocation = ({ city, ...rest }) =>
    setForm((current) => ({ ...current, ...rest, ...(city !== undefined ? { location: city } : {}) }));

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
        const seen = new Set(current.images.map((f) => `${f.name}:${f.size}`));
        const merged = [...current.images, ...valid.filter((f) => !seen.has(`${f.name}:${f.size}`))];
        return { ...current, images: merged.slice(0, MAX_PROJECT_FILES) };
      });
    }
    event.target.value = "";
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
      setError(err.response?.data?.message || "Unable to create project. Please try again.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = step === 1 ? form.title && form.description : step === 2 ? form.timeline : true;

  return (
    <Container className="max-w-3xl py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-content md:text-4xl">Post a project</h1>
      <p className="mt-2 text-muted">Tell us what you need — it takes about two minutes and helps pros bid accurately.</p>

      <Stepper step={step} />

      <form onSubmit={submit} className="premium-card mt-8 grid gap-5 rounded-2xl p-6 md:p-7">
        {step === 1 && (
          <>
            <Input label="Project title" name="title" value={form.title} onChange={update} placeholder="e.g. 3BHK premium interiors" required />
            <Textarea label="Description" name="description" value={form.description} onChange={update} placeholder="Describe the scope, style, materials and any must-haves…" required />
            <Select label="Category" name="category" value={form.category} onChange={update}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category} className="capitalize">{category}</option>
              ))}
            </Select>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-content">Budget</label>
                <span className="font-display text-lg font-bold text-brand tabular">
                  ₹{Number(form.budget || 100000).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                className="w-full accent-brand"
                name="budget"
                type="range"
                min="100000"
                max="20000000"
                step="50000"
                value={form.budget || 100000}
                onChange={update}
              />
              <div className="mt-1 flex justify-between text-xs text-subtle">
                <span>₹1L</span>
                <span>₹2Cr</span>
              </div>
            </div>
            <LocationPicker
              label="Project location"
              value={{ city: form.location, state: form.state, pincode: form.pincode, lat: form.lat, lng: form.lng }}
              onChange={onLocation}
            />
            <p className="-mt-1 text-xs text-muted">A precise location helps us match you with the best nearby contractors.</p>
            <Input label="Timeline" name="timeline" value={form.timeline} onChange={update} placeholder="e.g. 3 months" required />
          </>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-line-strong bg-surface-2/40 p-8 text-center transition hover:border-brand/50 hover:bg-brand/5">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="mt-3 block text-sm font-bold text-content">Upload images or floor plans</span>
              <span className="mt-1 block text-xs text-muted">
                PDF, JPG, PNG · up to {formatBytes(MAX_FILE_BYTES)} each · max {MAX_PROJECT_FILES} files
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
              <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">
                {fileErrors.map((msg) => (
                  <p key={msg} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
                  </p>
                ))}
              </div>
            )}

            {previews.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {previews.map(({ file, url }, index) => (
                  <div key={`${file.name}:${file.size}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                    {url ? (
                      <img src={url} alt={file.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
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
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-brand disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-muted">
                  {progress < 100 ? `Uploading… ${progress}%` : "Finalizing project…"}
                </p>
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          {step > 1 ? (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setStep((v) => v - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" disabled={!canContinue} onClick={() => setStep((v) => v + 1)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" loading={loading}>
              <Send className="h-4 w-4" /> {loading ? "Posting…" : "Post project"}
            </Button>
          )}
        </div>
      </form>
    </Container>
  );
};
