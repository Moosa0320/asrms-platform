import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * POST /api/users
 * Creates a real user account in Firebase Authentication AND Firestore.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName, email, password, role = "viewer" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName?.trim() || cleanEmail.split("@")[0];

    // Try Firebase Admin SDK first
    try {
      const adminAuth = getAdminAuth();
      const adminDb = getAdminFirestore();

      // 1. Create in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: password,
        displayName: cleanName,
      });

      // 2. Persist in Firestore users collection
      const userDoc = {
        uid: userRecord.uid,
        displayName: cleanName,
        email: cleanEmail,
        role: role,
        status: "active",
        lastLogin: "Never",
        createdAt: new Date().toISOString(),
      };

      await adminDb.collection("users").doc(userRecord.uid).set(userDoc);

      return NextResponse.json({
        success: true,
        user: userDoc,
        message: `User ${cleanEmail} created successfully in database.`,
      });
    } catch (adminErr: any) {
      console.warn("[POST /api/users] Admin SDK creation fallback:", adminErr.message);

      if (adminErr.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "An account with this email address already exists." },
          { status: 400 }
        );
      }

      // If service account is not configured, inform client so it can run client-side SDK creation
      return NextResponse.json(
        {
          error: adminErr.message || "Failed to create user via Admin SDK",
          useClientFallback: true,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[POST /api/users] General error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
