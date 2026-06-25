#!/usr/bin/env node
/**
 * Sync completed Stripe checkout sessions into Firestore for a member.
 * Usage: node scripts/sync-stripe-payments.mjs user@example.com
 */
import { readFileSync } from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/sync-stripe-payments.mjs <member-email>");
  process.exit(1);
}

const credPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  new URL("../firebase/serviceAccount.json", import.meta.url).pathname;

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(credPath, "utf8"))) });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
});

async function applyPayment(memberId, session) {
  const existing = await db
    .collection("payments")
    .where("stripeSessionId", "==", session.id)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`Session ${session.id} already recorded`);
    return false;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const updates = {
    paymentStatus: session.mode === "subscription" ? "subscription_active" : "paid",
    status: "active",
    membershipStartDate: now.toISOString(),
    membershipEndDate: endDate.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (session.subscription) {
    updates.stripeSubscriptionId = session.subscription;
  }

  await db.collection("members").doc(memberId).update(updates);
  await db.collection("payments").add({
    memberId,
    stripeSessionId: session.id,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    paymentType: session.mode,
    status: "completed",
    createdAt: now.toISOString(),
  });

  console.log(`Applied payment for session ${session.id} ($${(session.amount_total ?? 0) / 100})`);
  return true;
}

const members = await db.collection("members").where("email", "==", email).get();
if (members.empty) {
  console.error(`No member found for ${email}`);
  process.exit(1);
}

const memberDoc = members.docs[0];
const member = memberDoc.data();
console.log(`Member: ${memberDoc.id} (${member.firstName} ${member.lastName})`);
console.log(`Status: ${member.status}, payment: ${member.paymentStatus}`);
console.log(`Stripe customer: ${member.stripeCustomerId ?? "none"}`);

if (!member.stripeCustomerId) {
  console.error("No stripeCustomerId on member — checkout may not have started.");
  process.exit(1);
}

const sessions = await stripe.checkout.sessions.list({
  customer: member.stripeCustomerId,
  limit: 20,
});

console.log(`Found ${sessions.data.length} checkout session(s)`);

let applied = 0;
for (const session of sessions.data) {
  console.log(
    `- ${session.id}: status=${session.status}, payment_status=${session.payment_status}, mode=${session.mode}, amount=${session.amount_total}`
  );

  const complete =
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      (session.mode === "subscription" && session.subscription));

  if (!complete) continue;

  if (session.metadata?.memberId && session.metadata.memberId !== memberDoc.id) {
    console.log("  Skipped: session belongs to another member");
    continue;
  }

  if (await applyPayment(memberDoc.id, session)) {
    applied++;
  }
}

console.log(applied ? `Done. Applied ${applied} payment(s).` : "No new payments to apply.");
