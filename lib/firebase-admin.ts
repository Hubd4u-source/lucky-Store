import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function requireAdminEnv() {
  const projectId =
    readEnv("FIREBASE_ADMIN_PROJECT_ID") ?? readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const clientEmail = readEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = readEnv("FIREBASE_ADMIN_PRIVATE_KEY");
  const storageBucket = readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  const missing: string[] = [];

  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (!storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase Admin environment variables: ${missing.join(", ")}`
    );
  }

  return {
    projectId: projectId as string,
    clientEmail: clientEmail as string,
    privateKey: (privateKey as string).replace(/\\n/g, "\n"),
    storageBucket: storageBucket as string,
  };
}

function createAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }

  const { projectId, clientEmail, privateKey, storageBucket } = requireAdminEnv();

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
}

const adminApp = createAdminApp();
const adminFirestore = getFirestore(adminApp);
const adminStorage = getStorage(adminApp).bucket();
const adminAuth = getAuth(adminApp);

export { adminApp, adminAuth, adminFirestore, adminStorage };
