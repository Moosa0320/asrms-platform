import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { demoUsers, type Role } from "./mockData";

export type SessionUser = {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  status: string;
};

const normalizeLogin = (identifier: string) => {
  if (identifier.trim().toLowerCase() === "admin") return "admin@asrms.io";
  return identifier.trim().toLowerCase();
};

export async function signIn(identifier: string, password: string) {
  const email = normalizeLogin(identifier);

  if (isFirebaseConfigured && auth) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  const seededUser = demoUsers.find(
    (user) => user.email === email && user.password === password,
  );

  if (!seededUser && !isFirebaseConfigured) {
    throw new Error("Invalid credentials. Try admin/admin for the demo.");
  }

  const user = seededUser ?? demoUsers[0];
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function signInWithGoogle() {
  if (isFirebaseConfigured && auth) {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  return {
    uid: "u-google",
    displayName: "Google Workspace User",
    email: "workspace.user@example.com",
    role: "viewer" as Role,
    status: "active",
  };
}

export async function createUser(email: string, password: string) {
  if (isFirebaseConfigured && auth) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  return {
    uid: `u-${Date.now()}`,
    displayName: email.split("@")[0],
    email,
    role: "viewer" as Role,
    status: "active",
  };
}

export async function signOut() {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
  }
}
