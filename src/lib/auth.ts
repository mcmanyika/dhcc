import { createRemoteJWKSet, jwtVerify } from "jose";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const firebaseJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export async function verifyAuthToken(
  authHeader: string | null
): Promise<{ uid: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ") || !projectId) return null;

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    if (!payload.sub) return null;

    return {
      uid: payload.sub,
      email: (payload.email as string) ?? "",
    };
  } catch {
    return null;
  }
}
