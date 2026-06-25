import type { Member } from "@/types";

export function membersToCsv(members: Member[]): string {
  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Business Name",
    "Email",
    "Phone",
    "Website",
    "Category",
    "Tier",
    "Status",
    "Payment Status",
    "Membership Start",
    "Membership End",
    "Created At",
  ];

  const rows = members.map((m) => [
    m.id,
    m.firstName,
    m.lastName,
    m.businessName,
    m.email,
    m.phone,
    m.website ?? "",
    m.businessCategory,
    m.membershipTier,
    m.status,
    m.paymentStatus,
    m.membershipStartDate ?? "",
    m.membershipEndDate ?? "",
    m.createdAt,
  ]);

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
