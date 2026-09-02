import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

/**
 * Lazily initialise the Firebase Admin SDK once per process.
 * Credentials come from the FIREBASE_SERVICE_ACCOUNT_JSON environment variable
 * (a JSON string of the service-account key downloaded from Firebase Console →
 *  Project Settings → Service Accounts → Generate new private key).
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON env var is not set. " +
        "Download the service-account key from Firebase Console → Project Settings → Service Accounts."
    );
  }

  const serviceAccount = JSON.parse(raw);

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminAuth(): Auth {
  getAdminApp();
  return getAuth();
}

export function getAdminFirestore(): Firestore {
  getAdminApp();
  return getFirestore();
}
