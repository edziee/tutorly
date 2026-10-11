// File uploads to Firebase Storage: verification proof (transcripts, IDs) and
// profile photos. Today the proof upload in TutorProfileScreen only keeps the
// picked file in the screen's state, nothing is saved.
// Owner: Member 1.
//
// Suggested paths (document your final choice in docs/FIRESTORE_SCHEMA.md):
//   verification/{uid}/{fileName}   proof files, readable only by the owner and admins
//   avatars/{uid}.jpg               profile photos
//
//   import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// On React Native, fetch(file.uri) then .blob() gives you the bytes to upload.
import { notImplemented } from './notImplemented';

/**
 * @param {string} uid
 * @param {{ uri: string, name: string, mimeType?: string }} file as returned by expo-document-picker
 * @returns {Promise<{ storagePath: string }>}
 */
export async function uploadVerificationDocument(uid, file) {
  throw notImplemented('storageService.uploadVerificationDocument', 'Member 1');
}

/**
 * @param {string} uid
 * @param {string} uri local image uri from expo-image-picker
 * @returns {Promise<string>} the download url to save on the user document
 */
export async function uploadProfilePhoto(uid, uri) {
  throw notImplemented('storageService.uploadProfilePhoto', 'Member 1');
}
