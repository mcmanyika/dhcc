"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Pencil, Trash2, CreditCard } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import {
  BUSINESS_CATEGORIES,
  MEMBER_STATUSES,
  MEMBERSHIP_TIERS,
  PAYMENT_STATUSES,
  type Member,
  type MemberStatus,
  type MembershipTier,
  type PaymentStatus,
} from "@/types";

export default function AdminMembersPage() {
  const { getIdToken } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/members?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, [getIdToken, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const patchMember = async (
    id: string,
    updates: Partial<Member>
  ): Promise<boolean> => {
    const token = await getIdToken();
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update member");
      return false;
    }
    return true;
  };

  const updateStatus = async (id: string, status: MemberStatus) => {
    const ok = await patchMember(id, { status });
    if (ok) fetchMembers();
  };

  const updateTier = async (id: string, membershipTier: MembershipTier) => {
    const ok = await patchMember(id, { membershipTier });
    if (ok) fetchMembers();
  };

  const saveMember = async () => {
    if (!editMember) return;
    const ok = await patchMember(editMember.id, {
      firstName: editMember.firstName,
      lastName: editMember.lastName,
      businessName: editMember.businessName,
      email: editMember.email,
      phone: editMember.phone,
      businessCategory: editMember.businessCategory,
      membershipTier: editMember.membershipTier,
      status: editMember.status,
      paymentStatus: editMember.paymentStatus,
      businessDescription: editMember.businessDescription,
      isAdmin: editMember.isAdmin,
    });
    if (ok) {
      setEditMember(null);
      fetchMembers();
    }
  };

  const deleteMember = async () => {
    if (!deleteId) return;
    const token = await getIdToken();
    await fetch(`/api/members/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteId(null);
    fetchMembers();
  };

  const exportCsv = async () => {
    const token = await getIdToken();
    const res = await fetch("/api/members/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const initiatePayment = async (memberId: string, paymentType: string) => {
    const token = await getIdToken();
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId, paymentType }),
    });
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Members</h1>
          <p className="mt-1 text-gray-500">Manage membership applications and members.</p>
        </div>
        <Button onClick={exportCsv} variant="outline">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, business, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            ...MEMBER_STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            })),
          ]}
          className="sm:max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Business</TableHeader>
                <TableHeader>Tier</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Payment</TableHeader>
                <TableHeader>Access</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </TableCell>
                  <TableCell>{member.businessName}</TableCell>
                  <TableCell>
                    <select
                      value={member.membershipTier}
                      onChange={(e) =>
                        updateTier(
                          member.id,
                          e.target.value as MembershipTier
                        )
                      }
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm capitalize dark:border-slate-600 dark:bg-slate-900"
                    >
                      {MEMBERSHIP_TIERS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={member.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    {member.isAdmin ? (
                      <span className="inline-flex rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        Member
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(member.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(member.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {member.status === "approved" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => initiatePayment(member.id, "one_time")}
                          >
                            <CreditCard className="h-3 w-3" />
                            Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              initiatePayment(member.id, "subscription")
                            }
                          >
                            Subscribe
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditMember(member)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-gray-500">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        open={!!editMember}
        onClose={() => setEditMember(null)}
        title="Edit Member"
        size="lg"
      >
        {editMember && (
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={editMember.firstName}
                onChange={(e) =>
                  setEditMember({ ...editMember, firstName: e.target.value })
                }
              />
              <Input
                label="Last Name"
                value={editMember.lastName}
                onChange={(e) =>
                  setEditMember({ ...editMember, lastName: e.target.value })
                }
              />
            </div>
            <Input
              label="Business Name"
              value={editMember.businessName}
              onChange={(e) =>
                setEditMember({ ...editMember, businessName: e.target.value })
              }
            />
            <Input
              label="Email"
              value={editMember.email}
              onChange={(e) =>
                setEditMember({ ...editMember, email: e.target.value })
              }
            />
            <Input
              label="Phone"
              value={editMember.phone}
              onChange={(e) =>
                setEditMember({ ...editMember, phone: e.target.value })
              }
            />
            <Select
              label="Category"
              value={editMember.businessCategory}
              onChange={(e) =>
                setEditMember({ ...editMember, businessCategory: e.target.value })
              }
              options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <div className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Access level
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Change membership tier, account status, payment state, or grant
                admin access.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Membership tier"
                  value={editMember.membershipTier}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      membershipTier: e.target.value as Member["membershipTier"],
                    })
                  }
                  options={MEMBERSHIP_TIERS.map((t) => ({
                    value: t.value,
                    label: `${t.label} (${t.price}/yr)`,
                  }))}
                />
                <Select
                  label="Account status"
                  value={editMember.status}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      status: e.target.value as MemberStatus,
                    })
                  }
                  options={MEMBER_STATUSES.map((s) => ({
                    value: s,
                    label: s.charAt(0).toUpperCase() + s.slice(1),
                  }))}
                />
                <Select
                  label="Payment status"
                  value={editMember.paymentStatus}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      paymentStatus: e.target.value as PaymentStatus,
                    })
                  }
                  options={PAYMENT_STATUSES.map((s) => ({
                    value: s,
                    label: s
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" "),
                  }))}
                />
                <div className="flex flex-col justify-end">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editMember.isAdmin === true}
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          isAdmin: e.target.checked,
                        })
                      }
                      disabled={!editMember.userId}
                      className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-500"
                    />
                    Grant admin access
                  </label>
                  {!editMember.userId && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Member must sign in before admin access can be granted.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Textarea
              label="Description"
              rows={3}
              value={editMember.businessDescription}
              onChange={(e) =>
                setEditMember({
                  ...editMember,
                  businessDescription: e.target.value,
                })
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditMember(null)}>
                Cancel
              </Button>
              <Button onClick={saveMember}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Member"
      >
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Are you sure you want to delete this member? This action cannot be
          undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteMember}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
