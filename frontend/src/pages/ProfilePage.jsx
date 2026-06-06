import { Briefcase, Check, ExternalLink, ImagePlus, Save, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Field, Input, Select, Textarea } from "../components/Input";
import { LocationPicker } from "../components/LocationPicker";
import { Avatar } from "../components/ui/Avatar";
import { Container } from "../components/ui/Container";
import { Tabs } from "../components/ui/Tabs";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const ProfilePage = () => {
  const { user, refreshMe } = useAuth();
  const isContractor = user.role === "contractor";
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("account");
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    city: user.city || "",
    businessName: user.contractorProfile?.businessName || "",
    experience: user.contractorProfile?.experience || "",
    services: user.contractorProfile?.services?.join(", ") || "",
    pricingRange: user.contractorProfile?.pricingRange || "",
    bio: user.contractorProfile?.bio || "",
    specialization: user.contractorProfile?.specialization || "",
    skills: user.contractorProfile?.skills?.join(", ") || "",
    certifications: user.contractorProfile?.certifications?.join(", ") || "",
    licenseNumber: user.contractorProfile?.licenseNumber || "",
    availability: user.contractorProfile?.availability || "available",
    state: user.state || "",
    pincode: user.pincode || "",
    lat: user.geo?.coordinates?.[1] || "",
    lng: user.geo?.coordinates?.[0] || "",
    profileImage: null,
    portfolioImages: []
  });

  const onLocation = ({ city, ...rest }) =>
    setForm((current) => ({ ...current, ...rest, ...(city !== undefined ? { city } : {}) }));

  const update = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? (name === "portfolioImages" ? Array.from(files) : files[0]) : value }));
  };

  const avatarPreview = useMemo(
    () => (form.profileImage ? URL.createObjectURL(form.profileImage) : user.profileImage?.url),
    [form.profileImage, user.profileImage]
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "portfolioImages") value.forEach((file) => formData.append(key, file));
        else if (value) formData.append(key, value);
      });
      await api.put("/users/profile", formData);
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { value: "account", label: "Account", icon: UserCog },
    ...(isContractor ? [{ value: "business", label: "Business", icon: Briefcase }] : [])
  ];

  return (
    <Container className="max-w-4xl py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={avatarPreview} name={form.name} size="xl" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-content md:text-3xl">{form.name || "Your profile"}</h1>
            <p className="text-sm capitalize text-muted">{user.role}</p>
          </div>
        </div>
        {isContractor && (
          <Link to={`/contractors/${user._id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
            View public portfolio <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isContractor && <Tabs className="mt-6" tabs={TABS} value={tab} onChange={setTab} />}

      <form onSubmit={submit} className="premium-card mt-6 grid gap-5 rounded-2xl p-6 md:p-7">
        {tab === "account" && (
          <>
            <Field label="Profile photo">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-3.5 py-3 text-sm text-muted transition hover:border-brand/40">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-brand"><ImagePlus className="h-4 w-4" /></span>
                <span className="truncate">{form.profileImage ? form.profileImage.name : "Upload a new photo"}</span>
                <input type="file" name="profileImage" accept="image/*" onChange={update} className="hidden" />
              </label>
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Name" name="name" value={form.name} onChange={update} />
              <Input label="Phone" name="phone" value={form.phone} onChange={update} />
              <Input label="City" name="city" value={form.city} onChange={update} />
            </div>
          </>
        )}

        {tab === "business" && isContractor && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Business name" name="businessName" value={form.businessName} onChange={update} />
              <Input label="Experience (years)" name="experience" type="number" value={form.experience} onChange={update} />
              <Input label="Specialization" name="specialization" value={form.specialization} onChange={update} placeholder="e.g. Interior design" />
              <Input label="Pricing range" name="pricingRange" value={form.pricingRange} onChange={update} placeholder="e.g. ₹1,200 – ₹2,500 / sqft" />
              <Input label="Services" hint="comma separated" name="services" value={form.services} onChange={update} placeholder="construction, interior" />
              <Input label="Skills" hint="comma separated" name="skills" value={form.skills} onChange={update} placeholder="tiling, modular kitchen" />
              <Input label="Certifications" hint="comma separated" name="certifications" value={form.certifications} onChange={update} />
              <Input label="License number" name="licenseNumber" value={form.licenseNumber} onChange={update} />
              <Select label="Availability" name="availability" value={form.availability} onChange={update}>
                <option value="available">Available now</option>
                <option value="busy">Currently busy</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </div>
            <Textarea label="Bio" name="bio" value={form.bio} onChange={update} placeholder="Tell customers about your work, approach and standout projects…" />
            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <LocationPicker
                label="Service location (helps customers find you nearby)"
                value={{ city: form.city, state: form.state, pincode: form.pincode, lat: form.lat, lng: form.lng }}
                onChange={onLocation}
              />
            </div>
            <Field label="Portfolio images" hint="showcase your best work">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-3.5 py-3 text-sm text-muted transition hover:border-brand/40">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-brand"><ImagePlus className="h-4 w-4" /></span>
                <span className="truncate">
                  {form.portfolioImages.length ? `${form.portfolioImages.length} image(s) selected` : "Upload portfolio images"}
                </span>
                <input type="file" name="portfolioImages" accept="image/*" multiple onChange={update} className="hidden" />
              </label>
            </Field>
          </>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-5">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save profile"}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Profile updated
            </span>
          )}
        </div>
      </form>
    </Container>
  );
};
