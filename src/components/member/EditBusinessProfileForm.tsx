"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  BUSINESS_CATEGORIES,
  type Member,
  type MemberProfileUpdate,
} from "@/types";

function memberToForm(member: Member): MemberProfileUpdate {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    businessName: member.businessName,
    phone: member.phone,
    website: member.website ?? "",
    businessCategory: member.businessCategory,
    businessDescription: member.businessDescription,
    socialMedia: {
      facebook: member.socialMedia?.facebook ?? "",
      instagram: member.socialMedia?.instagram ?? "",
      linkedin: member.socialMedia?.linkedin ?? "",
      twitter: member.socialMedia?.twitter ?? "",
    },
  };
}

interface EditBusinessProfileFormProps {
  member: Member;
  onCancel: () => void;
  onSaved: (member: Member) => void;
}

export function EditBusinessProfileForm({
  member,
  onCancel,
  onSaved,
}: EditBusinessProfileFormProps) {
  const { getIdToken } = useAuth();
  const [form, setForm] = useState<MemberProfileUpdate>(memberToForm(member));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = <K extends keyof MemberProfileUpdate>(
    key: K,
    value: MemberProfileUpdate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("You must be signed in to update your profile");
      }

      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }

      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="edit-firstName"
          label="First Name"
          required
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />
        <Input
          id="edit-lastName"
          label="Last Name"
          required
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </div>

      <Input
        id="edit-businessName"
        label="Business Name"
        required
        value={form.businessName}
        onChange={(e) => updateField("businessName", e.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="edit-email"
          label="Email"
          type="email"
          readOnly
          value={member.email}
          className="bg-gray-50 dark:bg-slate-800"
        />
        <Input
          id="edit-phone"
          label="Phone"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
      </div>

      <Input
        id="edit-website"
        label="Website"
        type="url"
        placeholder="https://"
        value={form.website}
        onChange={(e) => updateField("website", e.target.value)}
      />

      <Select
        id="edit-businessCategory"
        label="Business Category"
        required
        placeholder="Select a category"
        value={form.businessCategory}
        onChange={(e) => updateField("businessCategory", e.target.value)}
        options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />

      <Textarea
        id="edit-businessDescription"
        label="Business Description"
        required
        rows={3}
        value={form.businessDescription}
        onChange={(e) => updateField("businessDescription", e.target.value)}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Social Media Links
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="edit-facebook"
            label="Facebook"
            placeholder="https://facebook.com/..."
            value={form.socialMedia.facebook}
            onChange={(e) =>
              updateField("socialMedia", {
                ...form.socialMedia,
                facebook: e.target.value,
              })
            }
          />
          <Input
            id="edit-instagram"
            label="Instagram"
            placeholder="https://instagram.com/..."
            value={form.socialMedia.instagram}
            onChange={(e) =>
              updateField("socialMedia", {
                ...form.socialMedia,
                instagram: e.target.value,
              })
            }
          />
          <Input
            id="edit-linkedin"
            label="LinkedIn"
            placeholder="https://linkedin.com/..."
            value={form.socialMedia.linkedin}
            onChange={(e) =>
              updateField("socialMedia", {
                ...form.socialMedia,
                linkedin: e.target.value,
              })
            }
          />
          <Input
            id="edit-twitter"
            label="Twitter / X"
            placeholder="https://x.com/..."
            value={form.socialMedia.twitter}
            onChange={(e) =>
              updateField("socialMedia", {
                ...form.socialMedia,
                twitter: e.target.value,
              })
            }
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
