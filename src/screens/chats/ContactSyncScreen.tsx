import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useIdentity } from '@hooks/useIdentity';
import { useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { chatSelectors } from '@store/slices/chatSlice';
import { ContactMatch, ProcessedContact } from '@types';
import Avatar from '@components/common/Avatar';

const ContactSyncScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const currentUser = useAppSelector(state => state.auth.user);
  const chats = useAppSelector(chatSelectors.selectAll);
  const { syncContacts, sendInvite } = useIdentity();
  const [matched, setMatched] = useState<ContactMatch[]>([]);
  const [notOnNimbusX, setNotOnNimbusX] = useState<ProcessedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    startSync();
  }, []);

  const startSync = async () => {
    setSyncing(true);
    try {
      const result = await syncContacts();
      setMatched(result.matched);
      setNotOnNimbusX(result.notOnNimbusX);
    } catch (err) {
      console.error('Contact sync failed:', err);
      Alert.alert('Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const startChat = async (contact: ContactMatch) => {
    if (!currentUser) return;
    try {
      const existingChat = chats.find(c =>
        c.type === 'one-to-one' &&
        c.members?.includes(currentUser.uid) &&
        c.members?.includes(contact.uid)
      );
      if (existingChat) {
        (navigation as any).navigate('Chat', { chatId: existingChat.id });
        return;
      }
      const chatId = await firestoreService.createChat({
        type: 'one-to-one',
        members: [currentUser.uid, contact.uid],
        unreadCount: { [currentUser.uid]: 0, [contact.uid]: 0 },
        typing: { [currentUser.uid]: false, [contact.uid]: false },
      });
      (navigation as any).navigate('Chat', { chatId });
    } catch (error) {
      Alert.alert('Error', 'Could not start chat.');
    }
  };

  const handleInvite = (contact: ProcessedContact) => {
    if (contact.e164) {
      sendInvite(contact.e164);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
          <Text style={styles.loadingText}>Finding your contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon name="people-outline" size={24} color={colors.primaryAccent} />
        <Text style={styles.headerTitle}>Contact Sync</Text>
      </View>

      {syncing ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primaryAccent} />
          <Text style={styles.loadingText}>Syncing...</Text>
        </View>
      ) : null}

      {(() => {
        const listData: any[] = [
          { kind: 'header', title: `ON NIMBUSX — ${matched.length}` },
          ...matched.map(m => ({ kind: 'matched', contact: m })),
          { kind: 'header', title: `INVITE — ${notOnNimbusX.length}` },
          ...notOnNimbusX.map(n => ({ kind: 'notOnNimbusX', contact: n })),
        ];
        return (
      <FlatList
        data={listData}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            const count = item.title.startsWith('ON') ? matched.length : notOnNimbusX.length;
            if (count === 0) return null;
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          if (item.kind === 'matched') {
            const c = item.contact as ContactMatch;
            return (
              <TouchableOpacity style={styles.contactRow} onPress={() => startChat(c)} activeOpacity={0.7}>
                <Avatar uri={c.avatarUrl} name={c.displayName} size={45} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{c.displayName}</Text>
                  {c.username ? <Text style={styles.contactDetail}>@{c.username}</Text> : null}
                </View>
                <Icon name="chatbubble-outline" size={20} color={colors.primaryAccent} />
              </TouchableOpacity>
            );
          }
          if (item.kind === 'notOnNimbusX') {
            const c = item.contact as ProcessedContact;
            return (
              <View style={styles.contactRow}>
                <View style={styles.avatarCircle}>
                  <Icon name="person-outline" size={22} color={colors.textSecondary} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{c.rawName}</Text>
                  <Text style={styles.contactDetail}>{c.e164}</Text>
                </View>
                <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(c)}>
                  <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={48} color={colors.divider} />
            <Text style={styles.emptyTitle}>No contacts found</Text>
            <Text style={styles.emptyText}>
              Grant contact permission to find friends on NimbusX.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={startSync}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        }
      />
      );
      })()}
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.m },
  loadingText: { fontSize: typography.fontSize.medium, color: colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s,
    padding: spacing.l, borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: typography.fontSize.large, fontWeight: '700', color: colors.textPrimary },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 0.8, paddingHorizontal: spacing.l, paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.l,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  avatarCircle: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: colors.secondaryBackground,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.divider,
  },
  contactInfo: { flex: 1, marginLeft: spacing.m },
  contactName: { fontSize: typography.fontSize.regular, fontWeight: '600', color: colors.textPrimary },
  contactDetail: { fontSize: typography.fontSize.small, color: colors.textSecondary, marginTop: 2 },
  inviteButton: {
    backgroundColor: 'rgba(6,182,212,0.12)', paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
  },
  inviteText: { color: colors.primaryAccent, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', padding: spacing.xxl * 2, gap: spacing.m },
  emptyTitle: { fontSize: typography.fontSize.medium, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: typography.fontSize.small, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    backgroundColor: colors.primaryAccent, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s, borderRadius: 8,
  },
  retryText: { color: colors.white, fontWeight: '600' },
}));

export default ContactSyncScreen;
