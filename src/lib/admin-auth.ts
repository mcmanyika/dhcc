import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";

export async function isFirestoreAdmin(uid: string): Promise<boolean> {
  const db = await getAdminDb();
  const doc = await db.collection("admins").doc(uid).get();
  return doc.exists;
}

export async function verifyAdminToken(
  authHeader: string | null
): Promise<{ uid: string; email: string } | null> {
  const user = await verifyAuthToken(authHeader);
  if (!user) return null;

  const isAdmin = await isFirestoreAdmin(user.uid);
  if (!isAdmin) return null;

  return user;
}
