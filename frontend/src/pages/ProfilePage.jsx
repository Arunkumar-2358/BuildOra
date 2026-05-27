import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
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
      <h1 className="text-3xl font-extrabold text-ink">Profile</h1>
      <form onSubmit={submit} className="mt-6 grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
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
              <Input label="Experience" name="experience" type="number" value={form.experience} onChange={update} />
              <Input label="Services" name="services" value={form.services} onChange={update} placeholder="construction, interior" />
              <Input label="Pricing range" name="pricingRange" value={form.pricingRange} onChange={update} />
            </div>
            <Textarea label="Bio" name="bio" value={form.bio} onChange={update} />
            <Input label="Portfolio images" name="portfolioImages" type="file" accept="image/*" multiple onChange={update} />
          </>
        )}
        {saved && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">Profile updated.</p>}
        <Button className="justify-self-start"><Save className="h-4 w-4" /> Save profile</Button>
      </form>
    </main>
  );
};
