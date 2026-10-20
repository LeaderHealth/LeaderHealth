import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function trimmed(name: string) {
  return process.env[name]?.trim() ?? "";
}

function privateKey() {
  let key = trimmed("FIREBASE_PRIVATE_KEY");
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

export function affiliateFirebaseConfigured() {
  const projectId = trimmed("FIREBASE_PROJECT_ID");
  const clientEmail = trimmed("FIREBASE_CLIENT_EMAIL");
  const key = trimmed("FIREBASE_PRIVATE_KEY");
  if (projectId && clientEmail && key) return true;
  return Boolean(trimmed("FIRESTORE_EMULATOR_HOST") && projectId);
}

let database: Firestore | null = null;

export function affiliateFirestore() {
  if (database) return database;
  const projectId = trimmed("FIREBASE_PROJECT_ID");
  const clientEmail = trimmed("FIREBASE_CLIENT_EMAIL");
  const key = privateKey();
  const app =
    getApps()[0] ??
    initializeApp(
      clientEmail && key
        ? { credential: cert({ projectId, clientEmail, privateKey: key }) }
        : { projectId },
    );
  database = getFirestore(app);
  return database;
}
