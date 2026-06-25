/**
 * Promote a user to admin and approve their membership.
 * Usage: node scripts/promote-admin.mjs partsonmanyika@gmail.com
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { Firestore } from "@google-cloud/firestore";

const email = process.argv[2] ?? "partsonmanyika@gmail.com";
const credPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  resolve(process.cwd(), "firebase/serviceAccount.json");

const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));

const db = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

const now = new Date().toISOString();

let memberQuery = await db
  .collection("members")
  .where("email", "==", email)
  .limit(1)
  .get();

if (memberQuery.empty) {
  console.error(`No member found with email: ${email}`);
  process.exit(1);
}

const memberDoc = memberQuery.docs[0];
const memberData = memberDoc.data();
const userId = memberData.userId;

if (!userId) {
  console.error("Member record has no userId — user must sign in and apply first.");
  process.exit(1);
}

await db.collection("admins").doc(userId).set({
  email,
  role: "admin",
  createdAt: now,
});

await memberDoc.ref.update({
  status: "active",
  isAdmin: true,
  userId,
  updatedAt: now,
});

console.log(`Admin access granted to ${email}`);
console.log(`Member ${memberDoc.id} → status: active, isAdmin: true`);
console.log(`Admin doc: admins/${userId}`);
