// Small helpers for the user profile object that useAuth() gives a screen
// (the users/{uid} document, see docs/FIRESTORE_SCHEMA.md).

// The Firebase user id. Member 1's getUserProfile should include it as `uid`
// (or `id`), because the document id is not a field inside the document.
export function getUserId(user) {
  return user?.uid ?? user?.id ?? null;
}

// "Juan Dela Cruz" -> "Juan". Returns '' when there is no name.
export function getFirstName(user) {
  const name = typeof user?.name === 'string' ? user.name.trim() : '';
  return name.split(/\s+/)[0] ?? '';
}
