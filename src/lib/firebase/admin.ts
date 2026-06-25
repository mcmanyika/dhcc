import { readFileSync } from "fs";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccountJson(raw: string): ServiceAccountJson {
  const parsed = JSON.parse(raw) as ServiceAccountJson;
  if (parsed.private_key?.includes("\\n")) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

function loadServiceAccount(): ServiceAccountJson {
  const inlineJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (inlineJson?.trim().startsWith("{")) {
    return parseServiceAccountJson(inlineJson);
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    // On Vercel, users often paste the full JSON into GOOGLE_APPLICATION_CREDENTIALS.
    if (credentialsPath.trim().startsWith("{")) {
      return parseServiceAccountJson(credentialsPath);
    }
    const json = readFileSync(credentialsPath, "utf8");
    return parseServiceAccountJson(json);
  }

  return {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID ?? "",
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "",
    private_key:
      process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
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
      "Firebase Admin credentials are not configured. Locally: set GOOGLE_APPLICATION_CREDENTIALS to a file path or FIREBASE_ADMIN_* vars. On Vercel: set FIREBASE_SERVICE_ACCOUNT_JSON to the full service account JSON (or paste JSON into GOOGLE_APPLICATION_CREDENTIALS)."
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
