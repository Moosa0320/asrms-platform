import * as admin from "firebase-admin";

/**
 * Lazily initialise the Firebase Admin SDK once per process.
 * Credentials come from the FIREBASE_SERVICE_ACCOUNT_JSON environment variable
 * (a JSON string containing the service-account key from Firebase Console).
 */
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON env var is not set. " +
        "Download the service-account key from Firebase Console → Project Settings → Service Accounts."
    );
  }

  const serviceAccount = JSON.parse(raw);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}
