import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
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

async function createSuperAdmin() {
  const email = "moosashahid0320@gmail.com";
  const password = "Moosa@0320";

  try {
    console.log("Creating user in Firebase Auth...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    
    console.log("User created! UID:", uid);
    console.log("Assigning admin role in Firestore...");
    
    const newUser = {
      uid: uid,
      displayName: "Moosa Shahid",
      email: email,
      role: "admin",
      status: "active",
    };
    
    await setDoc(doc(db, "users", uid), newUser);
    
    console.log("Success! Super admin account created and synced to Firestore.");
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Account already exists! Let's ensure they have the admin role in Firestore.");
      // We can't fetch the UID easily without signing in if it already exists,
      // but let's try signing in to get the UID and update it.
      import("firebase/auth").then(async ({ signInWithEmailAndPassword }) => {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const uid = cred.user.uid;
          await setDoc(doc(db, "users", uid), {
            uid: uid,
            displayName: "Moosa Shahid",
            email: email,
            role: "admin",
            status: "active",
          });
          console.log("Success! Account already existed, but has now been granted admin privileges in Firestore.");
          process.exit(0);
        } catch (signInErr) {
          console.error("Error signing in to update role:", signInErr.message);
          process.exit(1);
        }
      });
    } else {
      console.error("Error creating super admin:", error.message);
      process.exit(1);
    }
  }
}

createSuperAdmin();
