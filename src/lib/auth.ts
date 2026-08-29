import { initializeApp, deleteApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured, firebaseConfig } from "./firebase";
import { type Role } from "./mockData";

export const SUPER_ADMIN_EMAIL = "moosashahid0320@gmail.com";

export type SessionUser = {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  status: string;
};

export async function fetchUserRole(uid: string, email?: string): Promise<Role> {
  // Super admin is always super_admin regardless of Firestore
  if (email?.toLowerCase() === SUPER_ADMIN_EMAIL) return "super_admin";
  if (!isFirebaseConfigured || !db) return "viewer";
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data().role as Role;
  }
  return "viewer";
}

export async function signIn(identifier: string, password: string): Promise<SessionUser> {
  const email = identifier.trim().toLowerCase();

  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error("Firebase is not configured. Cannot sign in.");
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const role = await fetchUserRole(cred.user.uid, cred.user.email || email);

  // Ensure the super admin doc exists in Firestore
  if (role === "super_admin") {
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: "Moosa Shahid",
        email: SUPER_ADMIN_EMAIL,
        role: "super_admin",
        status: "active",
      });
    } else if (userDoc.data().role !== "super_admin") {
      await setDoc(doc(db, "users", cred.user.uid), { role: "super_admin" }, { merge: true });
    }
  }

  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName || email.split("@")[0],
    email: cred.user.email || email,
    role,
    status: "active",
  };
}

export async function signInWithGoogle(): Promise<SessionUser> {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error("Firebase is not configured. Cannot sign in with Google.");
  }

  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  let role = await fetchUserRole(cred.user.uid, cred.user.email || "");

  // Create record if it doesn't exist
  const userDoc = await getDoc(doc(db, "users", cred.user.uid));
  if (!userDoc.exists()) {
    role = "viewer";
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      displayName: cred.user.displayName || "Google User",
      email: cred.user.email || "",
      role: "viewer",
      status: "active",
    });
  }

  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName || "Google User",
    email: cred.user.email || "",
    role,
    status: "active",
  };
}

/**
 * Creates a new Firebase Auth user.
 * If requestedRole is not "viewer", the user starts with role "pending" and
 * their requestedRole is saved on their document for review.
 */
export async function createUser(
  email: string,
  password: string,
  requestedRole: string = "viewer",
): Promise<SessionUser> {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error("Firebase is not configured. Cannot create user.");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Super admin email always gets super_admin role
  const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL;
  
  // If they want anything above viewer, they go into pending state (unless they are super admin)
  const role: Role = isSuperAdmin ? "super_admin" : (requestedRole === "viewer" ? "viewer" : "pending");

  const newUser = {
    uid: cred.user.uid,
    displayName: email.split("@")[0],
    email,
    role,
    requestedRole: role === "pending" ? requestedRole : null,
    status: "active",
  };
  await setDoc(doc(db, "users", cred.user.uid), newUser);

  return newUser;
}

export async function signOut() {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
  }
}

export function subscribeToAuth(callback: (user: SessionUser | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const role = await fetchUserRole(firebaseUser.uid, firebaseUser.email || "");
      callback({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        email: firebaseUser.email || "",
        role,
        status: "active",
      });
    } else {
      callback(null);
    }
  });
}

export async function adminCreateUser(
  displayName: string,
  email: string,
  password: string,
  role: Role,
): Promise<SessionUser> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Cannot create user.");
  }

  const tempAppName = `temp-app-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    const uid = cred.user.uid;

    const newUser = {
      uid,
      displayName,
      email,
      role,
      status: "active",
      lastLogin: "Never",
    };

    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  } finally {
    await deleteApp(tempApp);
  }
}

