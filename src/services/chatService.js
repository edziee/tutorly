// Real-time chat between a student and a tutor.
// Data: conversations/{id} and its subcollection conversations/{id}/messages.
// Owner: Member 4.   Replaces: src/data/mockConversations.jsx and the sample
// messages in src/screens/shared/ChatScreen.jsx.
//
// Use onSnapshot from 'firebase/firestore' for the subscribe functions so new
// messages appear without refreshing.
import { notImplemented } from './notImplemented';

/**
 * Live list of a user's conversations for the Messages screen, newest first.
 * @param {string} userId
 * @param {(conversations: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToConversations(userId, callback) {
  throw notImplemented('chatService.subscribeToConversations', 'Member 4');
}

/**
 * Live messages of one conversation, oldest first.
 * @param {string} conversationId
 * @param {(messages: object[]) => void} callback
 * @returns {() => void} function that stops listening
 */
export function subscribeToMessages(conversationId, callback) {
  throw notImplemented('chatService.subscribeToMessages', 'Member 4');
}

/**
 * Find the chat between this student and tutor, or create it.
 * @param {string} studentId
 * @param {string} tutorId
 * @returns {Promise<string>} the conversation id
 */
export async function getOrCreateConversation(studentId, tutorId) {
  throw notImplemented('chatService.getOrCreateConversation', 'Member 4');
}

/**
 * Add a message and update the conversation's preview and unread state.
 * Also creates a 'new_message' notification for the other person.
 * @param {string} conversationId
 * @param {{ senderId: string, text: string }} message
 * @returns {Promise<void>}
 */
export async function sendMessage(conversationId, message) {
  throw notImplemented('chatService.sendMessage', 'Member 4');
}

/**
 * Clear the unread flag for this user when they open the conversation.
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function markConversationRead(conversationId, userId) {
  throw notImplemented('chatService.markConversationRead', 'Member 4');
}
