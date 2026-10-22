// Creates only synthetic LOCAL emulator identities for the browser smoke check.
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, terminate } from 'firebase/firestore';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getOrCreateConversation, sendMessage } from '../src/services/chatService.js';
const projectId = 'demo-tutorly';
const accounts = {};
const clients = [];
for (const role of ['student', 'tutor']) {
  const app = initializeApp({ apiKey: 'local-only-key', projectId }, role);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `${role}-${randomUUID()}@example.test`, password = randomUUID();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  for (const [path, fields] of [
    [`users/${uid}`, { role, name: role === 'student' ? 'Local Student' : 'Local Tutor' }],
    ...(role === 'tutor' ? [[`tutors/${uid}`, { name: 'Local Tutor', tier: 'Peer Tutor', verificationStatus: 'approved', subject: 'CS 240', online: true }]] : []),
  ]) {
    const response = await fetch(`http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents/${path}`, {
      method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value }])) }),
    });
    if (!response.ok) throw new Error('Could not seed local profile');
  }
  accounts[role] = { uid, email, password };
  clients.push({ app, auth, db });
}
globalThis.__tutorlyTestFirebase = clients[0];
accounts.conversationId = await getOrCreateConversation(accounts.student.uid, accounts.tutor.uid);
globalThis.__tutorlyTestFirebase = clients[1];
await sendMessage(accounts.conversationId, { senderId: accounts.tutor.uid, text: 'Hello! Your tutor sent you a message.', messageId: 'local-welcome' });
const directory = join(homedir(), 'runtime/emulate-config');
await mkdir(directory, { recursive: true, mode: 0o700 });
await writeFile(join(directory, 'tutorly-local-accounts.json'), JSON.stringify(accounts), { mode: 0o600 });
for (const client of clients) { await terminate(client.db); await deleteApp(client.app); }
console.log('Local browser fixtures seeded; generated credentials saved privately outside the repository.');
