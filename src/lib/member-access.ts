import type { Member, MemberStatus } from "@/types";

export function hasMemberDashboardAccess(status: MemberStatus): boolean {
  return status === "approved" || status === "active";
}

export function getPostAuthPath(member: Member | null): string {
  if (!member) return "/apply";
  if (hasMemberDashboardAccess(member.status)) return "/dashboard";
  if (member.status === "pending") return "/apply";
  return "/apply";
}
