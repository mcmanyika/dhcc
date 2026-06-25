"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Sparkles,
  Ticket,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RegisteredEventsList } from "@/components/events/RegisteredEventsList";
import { EditBusinessProfileForm } from "@/components/member/EditBusinessProfileForm";
import { MembershipPaymentButton } from "@/components/member/MembershipPaymentButton";
import { PaymentHistory } from "@/components/member/PaymentHistory";
import {
  canStartMembershipCheckout,
  needsMembershipPayment,
} from "@/lib/membership-payment";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { MEMBERSHIP_TIERS, type Member, type PaymentRecord } from "@/types";
import type { UserEventRegistration } from "@/types";

interface MemberDashboardViewProps {
  member: Member;
  payments: PaymentRecord[];
  paymentsLoading: boolean;
  registrations: UserEventRegistration[];
  registrationsLoading: boolean;
  syncingPayment: boolean;
  paymentSuccess: boolean;
  editingProfile: boolean;
  onEditProfile: (open: boolean) => void;
  onMemberUpdated: (member: Member) => void;
  onSyncPayment: () => void;
  onLogout: () => void;
  needsPaymentRefresh: boolean;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  className,
}: {
  icon: ElementType;
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
      {sub && (
        <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{sub}</p>
      )}
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ElementType;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-700/30">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
}

export function MemberDashboardView({
  member,
  payments,
  paymentsLoading,
  registrations,
  registrationsLoading,
  syncingPayment,
  paymentSuccess,
  editingProfile,
  onEditProfile,
  onMemberUpdated,
  onSyncPayment,
  onLogout,
  needsPaymentRefresh,
}: MemberDashboardViewProps) {
  const tier = MEMBERSHIP_TIERS.find((t) => t.value === member.membershipTier);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) / 100;
  const showPaymentCta = needsMembershipPayment(member);
  const canPay = canStartMembershipCheckout(member);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-background to-background dark:from-slate-900 dark:via-background dark:to-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {paymentSuccess && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200/80 bg-green-50/90 p-4 shadow-sm backdrop-blur dark:border-green-800/50 dark:bg-green-950/40">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                Payment successful
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Your membership is active. Welcome to the chamber!
              </p>
            </div>
          </div>
        )}

        {showPaymentCta && canPay && (
          <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Membership payment required
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  Complete your {member.membershipTier} membership
                  {tier ? ` (${formatCurrency(tier.price)}/year)` : ""} to activate
                  full member benefits.
                </p>
              </div>
              <MembershipPaymentButton member={member} compact />
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-2 ring-white/25 backdrop-blur-sm">
                {getInitials(member.firstName, member.lastName)}
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-teal-100">
                  <Sparkles className="h-4 w-4" />
                  Member Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back, {member.firstName}
                </h1>
                <p className="mt-1 text-teal-100/90">{member.businessName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">
                    {member.status}
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">
                    {member.paymentStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {member.isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/events">
                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <Calendar className="h-4 w-4" />
                  Events
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => onLogout()}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 -mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Sparkles}
            label="Membership"
            value={tier?.label ?? member.membershipTier}
            sub={tier ? `${formatCurrency(tier.price)}/year` : undefined}
          />
          <StatCard
            icon={Ticket}
            label="Registered Events"
            value={String(registrations.length)}
            sub={
              registrations.length === 0
                ? "none yet"
                : registrations.length === 1
                  ? "upcoming event"
                  : "upcoming events"
            }
          />
          <StatCard
            icon={CreditCard}
            label="Total Paid"
            value={totalPaid > 0 ? formatCurrency(totalPaid) : "—"}
            sub={payments.length ? `${payments.length} payment(s)` : "No payments yet"}
          />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Profile — 3 cols */}
          <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90 lg:col-span-3">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Business Profile
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Your public chamber listing details
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditProfile(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <ProfileRow icon={User} label="Name">
                {member.firstName} {member.lastName}
              </ProfileRow>
              <ProfileRow icon={Building2} label="Category">
                {member.businessCategory}
              </ProfileRow>
              <ProfileRow icon={Mail} label="Email">
                {member.email}
              </ProfileRow>
              <ProfileRow icon={Phone} label="Phone">
                {member.phone}
              </ProfileRow>
              {member.website && (
                <ProfileRow icon={Globe} label="Website">
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-teal-700 hover:underline dark:text-teal-400"
                  >
                    {member.website.replace(/^https?:\/\//, "")}
                  </a>
                </ProfileRow>
              )}
            </div>
            {member.businessDescription && (
              <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 dark:bg-slate-900/50 dark:text-slate-300">
                {member.businessDescription}
              </p>
            )}
          </section>

          {/* Membership — 2 cols */}
          <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Membership
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Plan & billing status
            </p>
            <dl className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-teal-50/80 px-4 py-3 dark:bg-teal-950/30">
                <dt className="text-sm text-gray-600 dark:text-slate-400">Tier</dt>
                <dd className="font-semibold capitalize text-teal-800 dark:text-teal-300">
                  {member.membershipTier}
                </dd>
              </div>
              {member.membershipStartDate && (
                <div className="flex items-center justify-between px-1">
                  <dt className="text-sm text-gray-500 dark:text-slate-400">Member since</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {formatDate(member.membershipStartDate)}
                  </dd>
                </div>
              )}
              {member.membershipEndDate && (
                <div className="flex items-center justify-between px-1">
                  <dt className="text-sm text-gray-500 dark:text-slate-400">Renews / ends</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {formatDate(member.membershipEndDate)}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status={member.status} />
              <StatusBadge status={member.paymentStatus} />
            </div>
            <MembershipPaymentButton member={member} />
          </section>
        </div>

        {/* Events */}
        <section className="mt-6 rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                My Events
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Workshops and networking you&apos;re attending
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
          {registrationsLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
            </div>
          ) : (
            <RegisteredEventsList registrations={registrations} />
          )}
        </section>

        {/* Payments */}
        <section className="mt-6 rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Payment History
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Stripe membership transactions
              </p>
            </div>
            {needsPaymentRefresh && (
              <Button
                variant="outline"
                size="sm"
                loading={syncingPayment}
                onClick={onSyncPayment}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh status
              </Button>
            )}
          </div>
          <PaymentHistory payments={payments} loading={paymentsLoading || syncingPayment} />
        </section>
      </div>

      <Modal
        open={editingProfile}
        onClose={() => onEditProfile(false)}
        title="Edit Business Profile"
        size="lg"
      >
        <EditBusinessProfileForm
          member={member}
          onCancel={() => onEditProfile(false)}
          onSaved={(updated) => {
            onMemberUpdated(updated);
            onEditProfile(false);
          }}
        />
      </Modal>
    </div>
  );
}
