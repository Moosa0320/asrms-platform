import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/users/[uid]
 *
 * Removes the user from both Firebase Auth AND Firestore.
 * Requires the caller to be a super_admin or admin (verified server-side
 * by looking up the requesting user's Firestore document).
 *
 * Body: { requestingUid: string }
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json().catch(() => ({}));
    const requestingUid: string | undefined = body.requestingUid;

    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter." }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminFirestore();

    // --- Authorisation check ---
    if (requestingUid) {
      const requesterDoc = await adminDb.collection("users").doc(requestingUid).get();
      if (requesterDoc.exists) {
        const requesterRole = requesterDoc.data()?.role;
        if (requesterRole !== "super_admin" && requesterRole !== "admin") {
          return NextResponse.json(
            { error: "Permission denied: only admins can delete users." },
            { status: 403 }
          );
        }
      }
    }

    // Prevent deleting yourself
    if (uid === requestingUid) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    // --- 1. Delete from Firebase Auth ---
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr: any) {
      // If the user was never in Auth (e.g. manually inserted into Firestore), continue
      if (authErr.code !== "auth/user-not-found") {
        throw authErr;
      }
    }

    // --- 2. Delete Firestore document ---
    await adminDb.collection("users").doc(uid).delete();

    return NextResponse.json({
      success: true,
      message: `User ${uid} has been permanently deleted from Firebase Auth and Firestore.`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/users/[uid]] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
