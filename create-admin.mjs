import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TARGET_EMAIL = "moosashahid0320@gmail.com";
const TARGET_PASSWORD = "superadmin";

// Known previous passwords to try if account already exists
const KNOWN_PASSWORDS = ["Moosa@0320", "superadmin", "Moosa0320", "moosa0320"];

async function upsertFirestore(uid) {
  await setDoc(doc(db, "users", uid), {
    uid,
    displayName: "Moosa Shahid",
    email: TARGET_EMAIL,
    role: "admin",
    status: "active",
  });
  console.log("✅ Firestore record created/updated with admin role.");
}

async function createSuperAdmin() {
  // 1. Try creating a fresh account
  try {
    console.log("Attempting to create new Firebase Auth account...");
    const cred = await createUserWithEmailAndPassword(
      auth,
      TARGET_EMAIL,
      TARGET_PASSWORD
    );
    console.log("✅ Account created! UID:", cred.user.uid);
    await upsertFirestore(cred.user.uid);
    console.log(
      "\n🎉 Super admin ready! Email:",
      TARGET_EMAIL,
      "| Password:",
      TARGET_PASSWORD
    );
    process.exit(0);
  } catch (createErr) {
    if (createErr.code !== "auth/email-already-in-use") {
      console.error("❌ Unexpected error:", createErr.message);
      process.exit(1);
    }
  }

  // 2. Account already exists — try signing in with known passwords
  console.log(
    "Account already exists. Attempting to sign in to update credentials..."
  );
  let signedInCred = null;

  for (const pwd of KNOWN_PASSWORDS) {
    try {
      signedInCred = await signInWithEmailAndPassword(auth, TARGET_EMAIL, pwd);
      console.log(`✅ Signed in with password: "${pwd}"`);
      break;
    } catch {
      // try next
    }
  }

  if (!signedInCred) {
    console.error(
      "❌ Could not sign in with any known password. Please reset the password manually in the Firebase Console:"
    );
    console.error(
      "   https://console.firebase.google.com/project/asrms-e2f19/authentication/users"
    );
    process.exit(1);
  }

  const uid = signedInCred.user.uid;

  // 3. Update password to the target one (if it was different)
  try {
    await updatePassword(signedInCred.user, TARGET_PASSWORD);
    console.log(`✅ Password updated to "${TARGET_PASSWORD}".`);
  } catch (pwErr) {
    console.warn("⚠️  Could not update password:", pwErr.message);
  }

  // 4. Sync Firestore
  await upsertFirestore(uid);

  console.log(
    "\n🎉 Super admin ready! Email:",
    TARGET_EMAIL,
    "| Password:",
    TARGET_PASSWORD
  );
  process.exit(0);
}

createSuperAdmin();
