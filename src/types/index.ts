export type MemberStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "expired";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "subscription_active"
  | "subscription_cancelled"
  | "failed";

export type MembershipTier = "basic" | "standard" | "premium" | "corporate";

export type AttendanceStatus = "registered" | "attended" | "cancelled";

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface Member {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  website?: string;
  businessCategory: string;
  membershipTier: MembershipTier;
  businessDescription: string;
  socialMedia: SocialMediaLinks;
  agreedToTerms: boolean;
  status: MemberStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentStatus: PaymentStatus;
  membershipStartDate?: string;
  membershipEndDate?: string;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberInput {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  website?: string;
  businessCategory: string;
  membershipTier: MembershipTier;
  businessDescription: string;
  socialMedia: SocialMediaLinks;
  agreedToTerms: boolean;
}

export interface MemberProfileUpdate {
  firstName: string;
  lastName: string;
  businessName: string;
  phone: string;
  website?: string;
  businessCategory: string;
  businessDescription: string;
  socialMedia: SocialMediaLinks;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  status: AttendanceStatus;
  registeredAt: string;
  checkedInAt?: string;
}

export interface UserEventRegistration {
  registration: EventRegistration;
  event: Event;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  rating: number;
  liked: string;
  improvements: string;
  topicSuggestions: string;
  wouldAttendAgain: boolean;
  name?: string;
  email?: string;
  createdAt: string;
}

export interface FeedbackInput {
  eventId: string;
  rating: number;
  liked: string;
  improvements: string;
  topicSuggestions: string;
  wouldAttendAgain: boolean;
  name?: string;
  email?: string;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  createdAt: string;
}

export interface AdminPaymentRecord extends PaymentRecord {
  memberName?: string;
  memberEmail?: string;
  businessName?: string;
}

export interface AnalyticsSummary {
  totalMembers: number;
  pendingApplications: number;
  activeMembers: number;
  expiredMembers: number;
  totalEvents: number;
  eventRegistrations: number;
  averageFeedbackRating: number;
  stripeRevenue: number;
}

export const MEMBERSHIP_TIERS: { value: MembershipTier; label: string; price: number }[] = [
  { value: "basic", label: "Basic", price: 99 },
  { value: "standard", label: "Standard", price: 199 },
  { value: "premium", label: "Premium", price: 349 },
  { value: "corporate", label: "Corporate", price: 599 },
];

export const BUSINESS_CATEGORIES = [
  "Acupuncture",
  "Chiropractic",
  "Counseling & Therapy",
  "Fitness & Yoga",
  "Holistic Health",
  "Massage Therapy",
  "Nutrition & Wellness",
  "Spa & Beauty",
  "Other Wellness",
];

export const MEMBER_STATUSES: MemberStatus[] = [
  "pending",
  "approved",
  "rejected",
  "active",
  "expired",
];
