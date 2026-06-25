"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  BUSINESS_CATEGORIES,
  MEMBERSHIP_TIERS,
  type MemberInput,
} from "@/types";

const emptyForm = (email = ""): MemberInput => ({
  firstName: "",
  lastName: "",
  businessName: "",
  email,
  phone: "",
  website: "",
  businessCategory: "",
  membershipTier: "basic",
  businessDescription: "",
  socialMedia: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  },
  agreedToTerms: false,
});

interface MembershipFormProps {
  defaultEmail?: string;
  onSuccess?: () => void;
}

export function MembershipForm({
  defaultEmail = "",
  onSuccess,
}: MembershipFormProps) {
  const { getIdToken } = useAuth();
  const [form, setForm] = useState<MemberInput>(emptyForm(defaultEmail));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultEmail) {
      setForm((prev) => ({ ...prev, email: defaultEmail }));
    }
  }, [defaultEmail]);

  const updateField = <K extends keyof MemberInput>(
    key: K,
    value: MemberInput[K]
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
        throw new Error("You must be signed in to submit an application");
      }

      const res = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit application");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-teal-700">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying to join the Dallas Holistic Chamber of Commerce.
            We&apos;ll review your application and contact you shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="firstName"
          label="First Name"
          required
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />
        <Input
          id="lastName"
          label="Last Name"
          required
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </div>

      <Input
        id="businessName"
        label="Business Name"
        required
        value={form.businessName}
        onChange={(e) => updateField("businessName", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          readOnly
          value={form.email}
          className="bg-gray-50"
        />
        <Input
          id="phone"
          label="Phone"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
      </div>

      <Input
        id="website"
        label="Website"
        type="url"
        placeholder="https://"
        value={form.website}
        onChange={(e) => updateField("website", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="businessCategory"
          label="Business Category"
          required
          placeholder="Select a category"
          value={form.businessCategory}
          onChange={(e) => updateField("businessCategory", e.target.value)}
          options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Select
          id="membershipTier"
          label="Membership Tier"
          required
          value={form.membershipTier}
          onChange={(e) =>
            updateField(
              "membershipTier",
              e.target.value as MemberInput["membershipTier"]
            )
          }
          options={MEMBERSHIP_TIERS.map((t) => ({
            value: t.value,
            label: `${t.label} — $${t.price}/yr`,
          }))}
        />
      </div>

      <Textarea
        id="businessDescription"
        label="Short Business Description"
        required
        rows={4}
        value={form.businessDescription}
        onChange={(e) => updateField("businessDescription", e.target.value)}
        placeholder="Tell us about your wellness business..."
      />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-gray-700">
          Social Media Links
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="facebook"
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
            id="instagram"
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
            id="linkedin"
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
            id="twitter"
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

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          required
          checked={form.agreedToTerms}
          onChange={(e) => updateField("agreedToTerms", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-500"
        />
        <span className="text-sm text-gray-600">
          I agree to the membership terms and conditions, and confirm that the
          information provided is accurate.
        </span>
      </label>

      <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
        Submit Application
      </Button>
    </form>
  );
}
