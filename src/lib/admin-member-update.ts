import type { Firestore } from "firebase-admin/firestore";
import type { Member } from "@/types";

const ALLOWED_MEMBER_UPDATE_FIELDS = [
  "firstName",
  "lastName",
  "businessName",
  "email",
  "phone",
  "website",
  "businessCategory",
  "membershipTier",
  "businessDescription",
  "socialMedia",
  "status",
  "paymentStatus",
  "isAdmin",
  "membershipStartDate",
  "membershipEndDate",
] as const satisfies readonly (keyof Member)[];

export type AdminMemberUpdate = Partial<
  Pick<Member, (typeof ALLOWED_MEMBER_UPDATE_FIELDS)[number]>
>;

export function pickAdminMemberUpdates(
  body: Record<string, unknown>
): AdminMemberUpdate {
  const updates: AdminMemberUpdate = {};
  for (const field of ALLOWED_MEMBER_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      (updates as Record<string, unknown>)[field] = body[field];
    }
  }
  return updates;
}

export async function syncMemberAdminRole(
  db: Firestore,
  userId: string | undefined,
  email: string,
  isAdmin: boolean
): Promise<{ error?: string }> {
  if (!userId) {
    return {
      error:
        "This member has not signed in yet. Admin access requires a linked account.",
    };
  }

  const adminRef = db.collection("admins").doc(userId);
  if (isAdmin) {
    const existing = await adminRef.get();
    await adminRef.set(
      {
        email,
        role: "admin",
        updatedAt: new Date().toISOString(),
        ...(existing.exists
          ? {}
          : { createdAt: new Date().toISOString() }),
      },
      { merge: true }
    );
  } else {
    await adminRef.delete();
  }

  return {};
}

export async function getAdminUserIds(db: Firestore): Promise<Set<string>> {
  const snapshot = await db.collection("admins").get();
  return new Set(snapshot.docs.map((doc) => doc.id));
}

export function withAdminFlag<T extends { userId?: string; isAdmin?: boolean }>(
  member: T,
  adminUserIds: Set<string>
): T & { isAdmin: boolean } {
  return {
    ...member,
    isAdmin: adminUserIds.has(member.userId ?? "") || member.isAdmin === true,
  };
}
