import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
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

export async function fetchUserRole(uid: string): Promise<Role> {
  if (!isFirebaseConfigured || !db) return "viewer";
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data().role as Role;
  }
  return "viewer";
}

export async function signIn(identifier: string, password: string): Promise<SessionUser> {
  const email = normalizeLogin(identifier);

  if (isFirebaseConfigured && auth && db) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const role = await fetchUserRole(cred.user.uid);
    return {
      uid: cred.user.uid,
      displayName: cred.user.displayName || email.split("@")[0],
      email: cred.user.email || email,
      role,
      status: "active",
    };
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

export async function signInWithGoogle(): Promise<SessionUser> {
  if (isFirebaseConfigured && auth && db) {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    let role = await fetchUserRole(cred.user.uid);
    
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

  return {
    uid: "u-google",
    displayName: "Google Workspace User",
    email: "workspace.user@example.com",
    role: "viewer" as Role,
    status: "active",
  };
}

export async function createUser(email: string, password: string): Promise<SessionUser> {
  if (isFirebaseConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Automatically assign the admin role to the super admin email
    const role: Role = email.toLowerCase() === "moosashahid0320@gmail.com" ? "admin" : "viewer";
    
    const newUser = {
      uid: cred.user.uid,
      displayName: email.split("@")[0],
      email,
      role,
      status: "active",
    };
    await setDoc(doc(db, "users", cred.user.uid), newUser);
    return newUser;
  }

  return {
    uid: `u-${Date.now()}`,
    displayName: email.split("@")[0],
    email,
    role: email.toLowerCase() === "moosashahid0320@gmail.com" ? "admin" as Role : "viewer" as Role,
    status: "active",
  };
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
      const role = await fetchUserRole(firebaseUser.uid);
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
