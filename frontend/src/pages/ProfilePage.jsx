import { Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const ProfilePage = () => {
  const { user, refreshMe } = useAuth();
  const [saved, setSaved] = useState(false);
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
    profileImage: null,
    portfolioImages: []
  });

  const update = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? (name === "portfolioImages" ? Array.from(files) : files[0]) : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "portfolioImages") value.forEach((file) => formData.append(key, file));
      else if (value) formData.append(key, value);
    });
    await api.put("/users/profile", formData);
    await refreshMe();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-content">Profile</h1>
      <form onSubmit={submit} className="premium-card mt-6 grid gap-5 rounded-2xl p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Name" name="name" value={form.name} onChange={update} />
          <Input label="Phone" name="phone" value={form.phone} onChange={update} />
          <Input label="City" name="city" value={form.city} onChange={update} />
          <Input label="Profile image" name="profileImage" type="file" accept="image/*" onChange={update} />
        </div>
        {user.role === "contractor" && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Business name" name="businessName" value={form.businessName} onChange={update} />
              <Input label="Experience (years)" name="experience" type="number" value={form.experience} onChange={update} />
              <Input label="Specialization" name="specialization" value={form.specialization} onChange={update} placeholder="e.g. Interior design" />
              <Input label="Pricing range" name="pricingRange" value={form.pricingRange} onChange={update} />
              <Input label="Services" name="services" value={form.services} onChange={update} placeholder="construction, interior" />
              <Input label="Skills" name="skills" value={form.skills} onChange={update} placeholder="tiling, plumbing, modular kitchen" />
              <Input label="Certifications" name="certifications" value={form.certifications} onChange={update} placeholder="comma separated" />
              <Input label="License number" name="licenseNumber" value={form.licenseNumber} onChange={update} />
              <Select label="Availability" name="availability" value={form.availability} onChange={update}>
                <option value="available">Available now</option>
                <option value="busy">Currently busy</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </div>
            <Textarea label="Bio" name="bio" value={form.bio} onChange={update} />
            <Input label="Portfolio images" name="portfolioImages" type="file" accept="image/*" multiple onChange={update} />
            <Link to={`/contractors/${user._id}`} className="text-sm font-bold text-accent">View my public portfolio →</Link>
          </>
        )}
        {saved && <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-success">Profile updated.</p>}
        <Button className="justify-self-start"><Save className="h-4 w-4" /> Save profile</Button>
      </form>
    </main>
  );
};
