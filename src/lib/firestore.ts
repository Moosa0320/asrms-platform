import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  alerts,
  auditLogs,
  cloudProviders,
  costRecords,
  demoUsers,
  policies,
  resources,
  scalingEvents,
} from "./mockData";

const demoCollections = {
  alerts,
  audit_logs: auditLogs,
  cloud_providers: cloudProviders,
  cost_records: costRecords,
  policies,
  resources,
  scaling_events: scalingEvents,
  users: demoUsers.map((user) => ({
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
  })),
};

export type CollectionName = keyof typeof demoCollections;

export async function getCollection<T>(name: CollectionName): Promise<T[]> {
  if (!isFirebaseConfigured || !db) {
    return demoCollections[name] as T[];
  }

  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T);
}

export function subscribeCollection<T>(
  name: CollectionName,
  callback: (records: T[]) => void,
) {
  if (!isFirebaseConfigured || !db) {
    callback(demoCollections[name] as T[]);
    return () => undefined;
  }

  const ref = query(collection(db, name), orderBy("timestamp", "desc"));
  return onSnapshot(ref, (snapshot) => {
    callback(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T));
  });
}

export async function createRecord<T extends Record<string, unknown>>(
  name: CollectionName,
  payload: T,
) {
  if (!isFirebaseConfigured || !db) return { id: `demo-${Date.now()}`, ...payload };
  const ref = await addDoc(collection(db, name), payload);
  return { id: ref.id, ...payload };
}

export async function updateRecord(
  name: CollectionName,
  id: string,
  payload: Record<string, unknown>,
) {
  if (!isFirebaseConfigured || !db) return { id, ...payload };
  await updateDoc(doc(db, name, id), payload);
  return { id, ...payload };
}
