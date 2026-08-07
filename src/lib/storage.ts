import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isFirebaseConfigured, storage } from "./firebase";

export async function uploadExport(path: string, blob: Blob) {
  if (!isFirebaseConfigured || !storage) {
    return URL.createObjectURL(blob);
  }

  const uploadRef = ref(storage, path);
  await uploadBytes(uploadRef, blob);
  return getDownloadURL(uploadRef);
}
