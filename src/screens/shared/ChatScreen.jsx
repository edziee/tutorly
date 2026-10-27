import { isFirebaseConfigured } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { getOrCreateConversation, markConversationRead, subscribeToChatTutors, subscribeToConversations } from '../../services/chatService';
import { ROUTES } from '../../constants/routes';
import { getUserId } from '../../utils/user';
import { isStudentWorkspace } from '../../utils/workspace';
import { timeAgo } from '../../utils/format';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import StudentAvatar from '../../components/StudentAvatar';

const filters = ['All Messages', 'Active Tutors', 'Faculty / Profs'];
const accent = colors.secondary;

function Avatar({ initials, image, size = 46, online = false }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size }]}
    >
      <StudentAvatar imageUri={image?.uri} initials={initials} size={size} />
      {online && <View style={styles.onlineDot} />}
    </View>
  );
}

function MessageCard({ message, onPress, onAction }) {
  return (
    <View style={styles.messageCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open conversation with ${message.name}`}
        onPress={onPress}
        style={styles.cardBody}
      >
        <Avatar
          initials={message.initials}
          image={message.photoUrl ? { uri: message.photoUrl } : undefined}
        />
        <View style={styles.messageContent}>
          <View style={styles.messageTopRow}>
            <Text numberOfLines={1} style={styles.personName}>{message.name}</Text>
            {message.category === 'Faculty / Profs' && <Ionicons name="school-outline" size={13} color={colors.text} />}
            <Text style={styles.time}>{message.time}</Text>
            {message.unread && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>1</Text></View>}
            <Ionicons name="chevron-down" size={11} color={colors.mutedText} />
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.roleTag, { backgroundColor: message.roleColor }]}>{message.role}</Text>
            <Text numberOfLines={1} style={styles.course}>{message.course}</Text>
          </View>
          <Text numberOfLines={1} style={styles.preview}>{message.preview}</Text>
          {message.sessionPreview && <Text numberOfLines={1} style={styles.sessionText}>{message.sessionPreview}</Text>}
        </View>
      </Pressable>
      {message.action && (
        <View style={styles.cardFooter}>
          <View style={styles.footerDescription}>
            <Ionicons name={message.action === 'Open Chat' ? 'videocam-outline' : message.action === 'Download' ? 'attach-outline' : 'calendar-outline'} size={12} color={message.action === 'Open Chat' ? accent : colors.mutedText} />
            <Text numberOfLines={1} style={[styles.footerText, message.action === 'Open Chat' && styles.videoText]}>{message.session}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${message.action}: ${message.name}`} onPress={onAction} style={[styles.footerAction, message.action === 'Open Chat' && styles.openChatButton]}>
            <Text style={[styles.footerActionText, message.action === 'Open Chat' && styles.openChatText]}>{message.action}{message.action === 'Open Chat' ? ' →' : ''}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const { user, role, workspaceMode } = useAuth();
  const uid = getUserId(user);
  const live = isFirebaseConfigured;
  const showStudentTutorDiscovery = isStudentWorkspace(role, workspaceMode);
  const conversations = useSubscription((onData, onError) => live && uid
    ? subscribeToConversations(uid, onData, onError) : undefined, [uid, live]);
  const availableTutors = useSubscription((onData, onError) => live && uid && showStudentTutorDiscovery
    ? subscribeToChatTutors(onData, onError) : undefined, [uid, live, showStudentTutorDiscovery]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Messages');

  const messages = (conversations.data || []).map((chat) => ({
    ...chat, name: uid === chat.studentId ? chat.tutorName : chat.studentName,
    role: chat.tutorTier, roleColor: colors.mint, course: '', preview: chat.lastMessage || 'Say your first message!',
    time: timeAgo(chat.lastMessageAt), unread: chat.unreadBy?.includes(uid),
    category: chat.tutorTier === 'Professor' ? 'Faculty / Profs' : 'Active Tutors',
  }));
  const onlineTutors = showStudentTutorDiscovery ? (availableTutors.data || []) : [];

  const visibleMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages
      .map((message) => {
        return {
          ...message,
          name: message.name || 'User',
          initials:
            message.initials ||
            message.name
              ?.split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2),
          color: message.color || colors.secondary,
        };
      })
      .filter((message) => {
        const matchesFilter =
          activeFilter === 'All Messages' ||
          message.category === activeFilter;

        const searchableText =
          `${message.name} ${message.course || ''} ${message.preview || ''}`.toLowerCase();

        return matchesFilter && (!query || searchableText.includes(query));
      });
  }, [activeFilter, messages, search]);

  async function markAllRead() {
    try {
      await Promise.all(messages.filter((item) => item.unread).map((item) => markConversationRead(item.id, uid)));
    } catch (error) {
      Alert.alert('Couldn’t mark messages as read', error.message);
    }
  }

  async function openConversation(target, existing = false) {
    try {
      const conversationId = existing ? target.id : await getOrCreateConversation(uid, target.id);
      navigation.navigate(ROUTES.CONVERSATION, { conversationId });
    } catch (error) { Alert.alert('Couldn’t open chat', error.message); }
  }

  if (!live) {
    return (
      <ErrorState
        title="Chat isn’t available yet"
        message="Please try again later."
      />
    );
  }
  if (!uid) {
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title="Sign in to see your messages"
        message="Your conversations will appear here."
      />
    );
  }
  if (conversations.status === 'loading') return <LoadingState message="Loading conversations..." />;
  if (conversations.status === 'error') return <ErrorState title="Messages aren’t available" message={conversations.error.message} onRetry={conversations.retry} />;

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inboxSwitcher}>
          <View style={[styles.switchButton, styles.switchSelected]}>
            <Text style={styles.switchSelectedText}>Inbox</Text>
          </View>
          <View style={styles.switchButton}>
            <Text style={styles.switchText}>{user?.name?.split(' ')[0] || 'You'}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.mutedText} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tutors or messages (e.g. CS 240)"
            placeholderTextColor={colors.mutedText}
            returnKeyType="search"
            style={styles.searchInput}
          />
        </View>
        <ScrollView
          horizontal
          contentContainerStyle={styles.filterList}
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => {
            const selected = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {filter}
                </Text>
                {filter === 'Active Tutors' && (
                  <View style={styles.filterOnlineDot} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {showStudentTutorDiscovery ? (
          <>
            {availableTutors.status === 'error' ? (
              <ErrorState
                compact
                title="Tutors aren’t available"
                message={availableTutors.error.message}
                onRetry={availableTutors.retry}
              />
            ) : null}
            {availableTutors.status === 'loading' ? (
              <LoadingState compact message="Loading tutors..." />
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Tutors</Text>
                  <Text style={styles.onlineCount}>{onlineTutors.length} Tutors</Text>
                </View>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.onlineList}
                  showsHorizontalScrollIndicator={false}
                >
                  {onlineTutors.map((tutor) => {
                    const initials = tutor.name
                      ?.split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2);

                    return (
                      <Pressable
                        key={tutor.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Message ${tutor.name}, active now`}
                        onPress={() => openConversation(tutor)}
                        style={styles.onlineTutor}
                      >
                        <Avatar
                          initials={initials}
                          size={50}
                          image={tutor.photoUrl ? { uri: tutor.photoUrl } : undefined}
                          online={tutor.online === true}
                        />
                        <Text numberOfLines={1} style={styles.onlineName}>
                          {tutor.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.subjectTag}>
                          {tutor.subject?.split(':')[0] || tutor.tier}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {!onlineTutors.length ? (
                    <Text style={styles.emptyText}>No tutors are available yet.</Text>
                  ) : null}
                </ScrollView>
              </>
            )}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Open conversations</Text>
          <Pressable accessibilityRole="button" onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </Pressable>
        </View>

        {visibleMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onPress={() => openConversation(message, true)}
            onAction={() => {
              if (message.action === 'Open Chat') {
                openConversation(message, true);
              } else {
                Alert.alert(message.action, 'This option isn’t available in this chat yet.');
              }
            }}
          />
        ))}

        {visibleMessages.length === 0 && (
          <Text style={styles.emptyText}>No messages match your search.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  inboxSwitcher: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    backgroundColor: '#E9EAEE',
    marginBottom: spacing.md,
  },
  switchButton: {
    minHeight: 34,
    minWidth: 64,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  switchSelected: {
    backgroundColor: colors.primary,
  },
  switchText: {
    color: colors.text,
    fontSize: 11,
    textAlign: 'center',
  },
  switchSelectedText: {
    color: colors.white,
    fontSize: 10,
    lineHeight: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  searchBox: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 12,
    paddingVertical: spacing.sm,
  },
  filterList: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  filterChip: {
    minHeight: 26,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 10,
  },
  filterTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  filterOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: accent,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  onlineCount: {
    color: accent,
    fontSize: 10,
    fontWeight: '600',
  },
  onlineList: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: 2,
  },
  onlineTutor: {
    width: 62,
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  onlineName: {
    maxWidth: 62,
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  subjectTag: {
    maxWidth: 62,
    overflow: 'hidden',
    color: colors.successText,
    backgroundColor: colors.mint,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    fontSize: 9,
    marginTop: 3,
  },
  markRead: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  messageCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardBody: {
    minHeight: 94,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageTopRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  personName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  time: {
    color: colors.mutedText,
    fontSize: 9,
    marginLeft: 'auto',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  roleTag: {
    overflow: 'hidden',
    color: colors.text,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 9,
  },
  course: {
    flex: 1,
    color: colors.mutedText,
    fontSize: 9,
  },
  preview: {
    color: colors.mutedText,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  sessionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  cardFooter: {
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FAFBFC',
  },
  footerDescription: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    flexShrink: 1,
    color: colors.mutedText,
    fontSize: 9,
  },
  videoText: {
    color: colors.successText,
    fontWeight: '600',
  },
  footerAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  footerActionText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  openChatButton: {
    backgroundColor: colors.primary,
  },
  openChatText: {
    color: colors.white,
  },
  emptyText: {
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
