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

import { mockTutors } from '../data/mockTutors';
import { mockConversations } from '../data/mockConversations';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const filters = ['All Messages', 'Active Tutors', 'Faculty / Profs'];
const accent = colors.secondary;

function Avatar({ initials, color, size = 42, online = false }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || colors.secondary,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>
        {initials || '?'}
      </Text>
      {online && <View style={styles.onlineDot} />}
    </View>
  );
}

function MessageCard({ message, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${message.name}`}
      onPress={onPress}
      style={styles.messageCard}
    >
      <Avatar initials={message.initials} color={message.color} />

      <View style={styles.messageContent}>
        <View style={styles.messageTopRow}>
          <Text numberOfLines={1} style={styles.personName}>
            {message.name}
          </Text>
          {message.unread && <View style={styles.unreadDot} />}
          <Text style={styles.time}>{message.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.roleTag,
              { backgroundColor: message.roleColor || colors.background },
            ]}
          >
            {message.role}
          </Text>
          <Text numberOfLines={1} style={styles.course}>
            {message.course}
          </Text>
        </View>

        <Text numberOfLines={1} style={styles.preview}>
          {message.preview}
        </Text>

        {message.session ? (
          <View style={styles.sessionRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.mutedText}
            />
            <Text numberOfLines={1} style={styles.sessionText}>
              {message.session}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [messages, setMessages] = useState(() =>
    mockConversations.map((message) => ({ ...message })),
  );

  const onlineTutors = mockTutors.filter((tutor) => tutor.online !== false);

  const visibleMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages
      .map((message) => {
        const tutor = mockTutors.find(
          (item) => item.id === message.tutorId,
        );

        return {
          ...message,
          name: message.name || tutor?.name || 'Tutor',
          initials:
            message.initials ||
            tutor?.initials ||
            tutor?.name
              ?.split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2),
          color: message.color || tutor?.color,
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

  function markAllRead() {
    setMessages((current) =>
      current.map((message) => ({ ...message, unread: false })),
    );
  }

  function openConversation(name) {
    Alert.alert(name, 'Conversation screen will be connected here.');
  }

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inboxSwitcher}>
          <View style={[styles.switchButton, styles.switchSelected]}>
            <Text style={styles.switchSelectedText}>
              Inbox ({messages.length})
            </Text>
          </View>
          <View style={styles.switchButton}>
            <Text style={styles.switchText}>Marcus</Text>
            <View style={styles.switchOnlineDot} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.mutedText} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tutors, messages, course codes"
            placeholderTextColor={colors.mutedText}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Ionicons
            name="options-outline"
            size={19}
            color={colors.text}
          />
        </View>
        <Text style={styles.searchHint}>(e.g. CS 240)</Text>

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>AVAILABLE FOR ON-DEMAND HELP</Text>
          <Text style={styles.onlineCount}>{onlineTutors.length} Online</Text>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.onlineList}
          showsHorizontalScrollIndicator={false}
        >
          {onlineTutors.map((tutor) => {
            const initials =
              tutor.initials ||
              tutor.name
                ?.split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2);

            return (
              <Pressable
                key={tutor.id}
                onPress={() => openConversation(tutor.name)}
                style={styles.onlineTutor}
              >
                <Avatar
                  initials={initials}
                  color={tutor.color}
                  size={44}
                  online
                />
                <Text numberOfLines={1} style={styles.onlineName}>
                  {tutor.shortName || tutor.name}
                </Text>
                <Text numberOfLines={1} style={styles.subjectTag}>
                  {tutor.subject}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ACTIVE INQUIRIES & PREP</Text>
          <Pressable onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </Pressable>
        </View>

        {visibleMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onPress={() => openConversation(message.name)}
          />
        ))}

        {visibleMessages.length === 0 && (
          <Text style={styles.emptyText}>No matching messages.</Text>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  inboxSwitcher: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#E9EAEE',
    marginBottom: spacing.md,
  },
  switchButton: {
    minHeight: 29,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
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
  },
  switchSelectedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  switchOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: accent,
  },
  searchBox: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
  searchHint: {
    color: colors.mutedText,
    fontSize: 10,
    marginLeft: 31,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  filterList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterChip: {
    minHeight: 27,
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
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  onlineCount: {
    color: accent,
    fontSize: 10,
    fontWeight: '600',
  },
  onlineList: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  onlineTutor: {
    width: 58,
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
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
    maxWidth: 58,
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  subjectTag: {
    maxWidth: 58,
    overflow: 'hidden',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    fontSize: 8,
    marginTop: 3,
  },
  markRead: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  messageCard: {
    minHeight: 86,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 11,
    backgroundColor: colors.surface,
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
    fontSize: 13,
    fontWeight: '700',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: accent,
  },
  time: {
    color: colors.mutedText,
    fontSize: 9,
    marginLeft: 'auto',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 3,
  },
  roleTag: {
    overflow: 'hidden',
    maxWidth: 78,
    color: colors.text,
    paddingHorizontal: spacing.sm,
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
    fontSize: 10,
    marginTop: spacing.xs,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sessionText: {
    flex: 1,
    color: colors.mutedText,
    fontSize: 9,
  },
  emptyText: {
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});