import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSubscription } from '../../hooks/useSubscription';
import { createMessageId, markConversationRead, sendMessage, subscribeToConversation, subscribeToMessages } from '../../services/chatService';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { timeAgo } from '../../utils/format';
import { getUserId } from '../../utils/user';

export default function ConversationScreen({ route, navigation }) {
  const conversationId = route.params?.conversationId;
  const { user } = useAuth();
  const uid = getUserId(user);
  const focused = useIsFocused();
  const { notifications } = useNotifications();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(null);
  const sendingRef = useRef(false);
  const list = useRef(null);
  const conversation = useSubscription((onData, onError) => conversationId
    ? subscribeToConversation(conversationId, onData, onError) : undefined, [conversationId, uid]);
  const messages = useSubscription((onData, onError) => conversationId
    ? subscribeToMessages(conversationId, onData, onError) : undefined, [conversationId, uid]);
  const latestId = messages.data?.at(-1)?.id;
  const unreadAlerts = notifications.filter((item) => !item.read && item.data?.conversationId === conversationId).map((item) => item.id).join(',');

  useEffect(() => {
    if (conversation.data) navigation.setOptions({ title: uid === conversation.data.studentId ? conversation.data.tutorName : conversation.data.studentName });
  }, [conversation.data, uid, navigation]);

  useEffect(() => {
    if (!focused || !conversation.data || !uid) return;
    let active = true;
    markConversationRead(conversationId, uid).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [focused, conversationId, uid, latestId, unreadAlerts, Boolean(conversation.data)]);

  const submit = async () => {
    if (sendingRef.current || !text.trim()) return;
    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      // Retain the ID for a retry of the same draft after an uncertain failure.
      if (!pending.current || pending.current.text !== text.trim()) {
        pending.current = { messageId: createMessageId(conversationId), text: text.trim() };
      }
      const result = await sendMessage(conversationId, { ...pending.current, senderId: uid });
      pending.current = null;
      setText('');
      if (result.notificationError) setError('Message sent, but its notification could not be delivered.');
    } catch (failure) { setError(failure.message || 'Could not send your message.'); }
    finally { sendingRef.current = false; setSending(false); }
  };

  if (!conversationId) return <ErrorState message="No conversation was selected." />;
  if (conversation.status === 'error' || messages.status === 'error') {
    return <ErrorState title="Could not open chat" message={(conversation.error || messages.error)?.message} onRetry={() => { conversation.retry(); messages.retry(); }} />;
  }
  if (conversation.status === 'loading' || messages.status === 'loading') return <LoadingState message="Loading conversation…" />;

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={list} data={messages.data || []} keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>Start the conversation. Say hello!</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.senderId === uid && styles.ownBubble]}>
              <Text style={[styles.message, item.senderId === uid && styles.ownText]}>{item.text}</Text>
              <Text style={[styles.time, item.senderId === uid && styles.ownTime]}>{timeAgo(item.createdAt)}</Text>
            </View>
          )}
        />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <View style={styles.composer}>
          <TextInput accessibilityLabel="Message" placeholder="Write a message…" value={text} onChangeText={setText} editable={!sending} maxLength={4000} multiline style={styles.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={sending || !text.trim()} onPress={submit} style={[styles.send, (sending || !text.trim()) && styles.disabled]}>
            <Ionicons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  messages: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  bubble: { alignSelf: 'flex-start', maxWidth: '85%', padding: spacing.md, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: colors.surface },
  ownBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  message: { color: colors.text, fontSize: 14, lineHeight: 21 },
  ownText: { color: colors.white },
  time: { color: colors.mutedText, fontSize: 10, marginTop: spacing.xs },
  ownTime: { color: colors.lavender },
  empty: { textAlign: 'center', color: colors.mutedText, marginTop: spacing.xl },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.inputBackground, color: colors.text, fontSize: 14 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  error: { color: colors.errorText, padding: spacing.md, backgroundColor: colors.errorBackground },
});
