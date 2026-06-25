import { readFileSync } from "fs";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function loadServiceAccount() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    const json = readFileSync(credentialsPath, "utf8");
    return JSON.parse(json) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
  }

  return {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

function isPlaceholderCredentials(account: {
  client_email?: string;
  private_key?: string;
}): boolean {
  return (
    !account.client_email ||
    !account.private_key ||
    account.client_email.includes("your_project") ||
    account.private_key.includes("...")
  );
}

async function getAdminApp(): Promise<App> {
  if (adminApp) return adminApp;

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();

  if (isPlaceholderCredentials(serviceAccount)) {
    throw new Error(
      "Firebase Admin credentials are not configured. Set FIREBASE_ADMIN_* in .env.local or GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });

  return adminApp;
}

export async function getAdminAuth(): Promise<Auth> {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getAdminApp());
}

export async function getAdminDb(): Promise<Firestore> {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(await getAdminApp());
}
