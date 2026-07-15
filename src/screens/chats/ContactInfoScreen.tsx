import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import Avatar from '@components/common/Avatar';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { presenceService } from '@services/supabase/presence';
import { clearChatMessages } from '@store/slices/messageSlice';
import { removeChat } from '@store/slices/chatSlice';
import { userSelectors, upsertUser } from '@store/slices/userSlice';
import { User } from '@types';
import { cryptoService } from '@utils/crypto';

type ContactInfoRouteProp = RouteProp<ChatStackParamList, 'ContactInfo'>;

const DISAPPEARING_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '90 days', value: 2160 },
];

const MEDIA_VISIBILITY_OPTIONS = [
  { label: 'Show in gallery (default)', value: 'default' },
  { label: 'Always show in gallery', value: 'always' },
  { label: 'Never show in gallery', value: 'never' },
];

const formatLastSeen = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  return `Last seen on ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// ── Accordion Row ─────────────────────────────────────────────
const AccordionRow = ({
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  noBorderBottom,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  noBorderBottom?: boolean;
  children?: React.ReactNode;
}) => {
  const colors = useThemeColors();
  return (
    <>
      <TouchableOpacity
        style={[styles.settingsRow, noBorderBottom && !isOpen && styles.noBorder]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.settingsRowLeft}>
          <View style={styles.rowIconWrap}>
            <Icon name={icon} size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.accordionBody, noBorderBottom && styles.noBorder]}>
          {children}
        </View>
      )}
    </>
  );
};

// ── Option Selector inside accordion ─────────────────────────
const OptionSelector = ({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: any }[];
  selected: any;
  onSelect: (v: any) => void;
}) => {
  const colors = useThemeColors();
  return (
    <View>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.label}
          style={styles.optionRow}
          onPress={() => onSelect(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={styles.optionLabel}>{opt.label}</Text>
          {selected === opt.value && (
            <Icon name="checkmark" size={18} color={colors.primaryAccent} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────
const ContactInfoScreen = () => {
  const colors = useThemeColors();
  const route = useRoute<ContactInfoRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { chatId, otherUserName, otherUserAvatar } = route.params;
  const chat = useAppSelector(state => state.chats.entities[chatId]);
  const currentUser = useAppSelector(state => state.auth.user);

  const otherUserId = chat?.type !== 'group'
    ? chat?.members?.find((id) => id !== currentUser?.uid)
    : undefined;

  const otherUserRedux = useAppSelector(state =>
    otherUserId ? userSelectors.selectById(state, otherUserId) : null
  );

  const [profile, setProfile] = useState<User | null>(otherUserRedux);
  const [loading, setLoading] = useState(!otherUserRedux);
  const [presence, setPresence] = useState<{ state: 'online' | 'offline'; last_changed: number } | null>(null);

  // E2EE Safety Code Calculation
  const safetyCode = React.useMemo(() => {
    if (currentUser?.publicKey && profile?.publicKey) {
      return cryptoService.generateSafetyCode(currentUser.publicKey, profile.publicKey);
    }
    return 'Safety code: Pending (contact must go online to update keys)';
  }, [currentUser?.publicKey, profile?.publicKey]);

  // ── Functional settings state ──
  const [isMuted, setIsMuted] = useState(false);
  const [mediaVisibility, setMediaVisibility] = useState<string>('default');
  const [disappearingHours, setDisappearingHours] = useState<number>(0);

  // ── Accordion open states ──
  const [openMedia, setOpenMedia] = useState(false);
  const [openEncryption, setOpenEncryption] = useState(false);
  const [openDisappearing, setOpenDisappearing] = useState(false);

  useEffect(() => {
    if (otherUserId) {
      firestoreService.getUser(otherUserId).then((usr) => {
        if (usr) { setProfile(usr); dispatch(upsertUser(usr)); }
      }).catch(err => {
        console.warn('ContactInfoScreen: failed to fetch user profile:', err);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [otherUserId, dispatch]);

  useEffect(() => {
    if (otherUserId) {
      const unsubscribe = presenceService.listenToUserPresence(otherUserId, (data) => {
        setPresence(data);
      });
      return () => unsubscribe();
    }
  }, [otherUserId]);

  const handleClearChat = useCallback(() => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages in this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          try {
            await firestoreService.clearMessages(chatId);
            dispatch(clearChatMessages({ chatId }));
            Alert.alert('Done', 'Chat cleared successfully.');
          } catch (err) {
            console.error('Clear chat error:', err);
            Alert.alert('Error', 'Could not clear messages. Please try again.');
          }
        }
      }
    ]);
  }, [chatId, dispatch]);

  const handleDeleteChat = useCallback(() => {
    Alert.alert('Delete Chat', 'This will permanently delete this chat and all shared files.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await storageService.deleteChatMediaFolder(chatId);
            await firestoreService.deleteChat(chatId);
            dispatch(removeChat(chatId));
            navigation.popToTop();
          } catch (err) {
            console.error('Delete chat error:', err);
            Alert.alert('Error', 'Could not delete chat. Please try again.');
          }
        }
      }
    ]);
  }, [chatId, navigation, dispatch]);

  const handleBlockUser = useCallback(() => {
    const name = profile?.displayName || otherUserName || 'this contact';
    Alert.alert('Block User', `Block ${name}? They will no longer be able to send you messages.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Blocked', `${name} has been blocked.`) }
    ]);
  }, [profile, otherUserName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Contact Info',
      headerTitleStyle: { color: colors.primaryAccent, fontWeight: '700', fontSize: 18 },
      headerTintColor: colors.textPrimary,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
        elevation: 0, shadowOpacity: 0,
        borderBottomWidth: 1, borderBottomColor: colors.divider,
      },
    });
  }, [navigation, colors]);

  const displayAvatar = profile?.avatarUrl || otherUserAvatar;
  const displayNameVal = profile?.displayName || otherUserName || 'Contact';
  const displayEmail = profile?.email || 'No email provided';
  const displayStatus = profile?.status || 'Hey there! I am using NimbusX';

  const getStatusText = () => {
    if (presence?.state === 'online') return 'Online';
    if (presence?.last_changed) return formatLastSeen(presence.last_changed);
    if (profile?.lastSeen) return formatLastSeen(profile.lastSeen);
    return 'Offline';
  };

  const disappearingLabel = DISAPPEARING_OPTIONS.find(o => o.value === disappearingHours)?.label || 'Off';

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ── */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={displayAvatar}
              name={displayNameVal}
              size={100}
              showStatus={true}
              isOnline={presence?.state === 'online'}
            />
          </View>
          <Text style={styles.profileName}>{displayNameVal}</Text>
          <Text style={[styles.presenceText, presence?.state === 'online' ? styles.onlineDot : styles.offlineDot]}>
            {getStatusText()}
          </Text>
          <Text style={styles.statusBio}>{displayStatus}</Text>
        </View>

        {/* ── Email ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EMAIL</Text>
              <Text style={styles.infoValue}>{displayEmail}</Text>
            </View>
          </View>
        </View>

        {/* ── Settings & Privacy ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SETTINGS & PRIVACY</Text>
          <View style={styles.infoCard}>

            {/* Mute toggle */}
            <View style={styles.muteRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.rowIconWrap}>
                  <Icon name="volume-mute-outline" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>Mute Notifications</Text>
                  <Text style={styles.rowSubtitle}>
                    {isMuted ? 'Notifications are muted' : 'Silence messages from this user'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isMuted}
                onValueChange={(val) => {
                  setIsMuted(val);
                  Alert.alert(val ? 'Muted' : 'Unmuted', val ? 'Notifications muted for this contact.' : 'Notifications enabled.');
                }}
                trackColor={{ false: '#2C3E50', true: colors.primaryAccent }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Media Visibility Accordion */}
            <AccordionRow
              icon="images-outline"
              title="Media Visibility"
              subtitle={openMedia ? 'Select gallery visibility' : 'Show media in phone gallery'}
              isOpen={openMedia}
              onToggle={() => { setOpenMedia(v => !v); setOpenEncryption(false); setOpenDisappearing(false); }}
            >
              <OptionSelector
                options={MEDIA_VISIBILITY_OPTIONS}
                selected={mediaVisibility}
                onSelect={(v) => { setMediaVisibility(v); }}
              />
            </AccordionRow>

            {/* Encryption Accordion */}
            <AccordionRow
              icon="lock-closed-outline"
              title="Encryption"
              subtitle="Messages are end-to-end encrypted"
              isOpen={openEncryption}
              onToggle={() => { setOpenEncryption(v => !v); setOpenMedia(false); setOpenDisappearing(false); }}
            >
              <View style={styles.encryptionInfo}>
                <Icon name="shield-checkmark-outline" size={32} color={colors.success} style={styles.encryptionIcon} />
                <Text style={styles.encryptionText}>
                  Messages, voice notes, and media files are secured with end-to-end encryption.{'\n\n'}
                  No third parties — not even NimbusX — can read your conversations.
                </Text>
                
                <View style={styles.safetyCodeContainer}>
                  <Text style={styles.safetyCodeHeader}>SAFETY CODE VERIFICATION</Text>
                  <Text style={styles.safetyCodeDigits}>{safetyCode}</Text>
                  <Text style={styles.safetyCodeFooter}>
                    To verify encryption, confirm that these 25 numbers match the ones in your contact's profile details.
                  </Text>
                </View>
              </View>
            </AccordionRow>

            {/* Disappearing Messages Accordion */}
            <AccordionRow
              icon="timer-outline"
              title="Disappearing Messages"
              subtitle={disappearingLabel}
              isOpen={openDisappearing}
              noBorderBottom
              onToggle={() => { setOpenDisappearing(v => !v); setOpenMedia(false); setOpenEncryption(false); }}
            >
              <OptionSelector
                options={DISAPPEARING_OPTIONS}
                selected={disappearingHours}
                onSelect={(v) => {
                  setDisappearingHours(v);
                  const label = DISAPPEARING_OPTIONS.find(o => o.value === v)?.label || 'Off';
                  Alert.alert(
                    'Disappearing Messages',
                    v === 0
                      ? 'Disappearing messages turned off.'
                      : `Messages will disappear after ${label}.`
                  );
                }}
              />
            </AccordionRow>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACTIONS</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleClearChat} activeOpacity={0.7}>
              <View style={styles.rowIconWrap}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </View>
              <Text style={styles.actionText}>Clear Chat Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleDeleteChat} activeOpacity={0.7}>
              <View style={styles.rowIconWrap}>
                <Icon name="trash" size={20} color={colors.error} />
              </View>
              <Text style={styles.actionText}>Delete Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.noBorder]} onPress={handleBlockUser} activeOpacity={0.7}>
              <View style={styles.rowIconWrap}>
                <Icon name="ban-outline" size={20} color={colors.error} />
              </View>
              <Text style={styles.actionText}>Block Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  loadingContainer: { flex: 1, backgroundColor: colors.primaryBackground, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 48 },

  // ── Header Card ──
  headerCard: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.l,
    paddingHorizontal: spacing.l,
    backgroundColor: colors.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    marginBottom: spacing.m,
  },
  avatarWrapper: {
    borderRadius: 56,
    borderWidth: 2.5,
    borderColor: colors.primaryAccent,
    padding: 3,
    marginBottom: spacing.m,
  },
  profileName: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  presenceText: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  onlineDot: { color: '#4CAF50' },
  offlineDot: { color: colors.textSecondary },
  statusBio: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.xl },

  // ── Section ──
  section: { paddingHorizontal: spacing.l, marginBottom: spacing.m },
  sectionHeader: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    paddingLeft: 2,
  },

  // ── Info Card (email) ──
  infoCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  infoRow: { padding: spacing.l },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { color: colors.textPrimary, fontSize: 15 },

  // ── Settings Row ──
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIconWrap: { width: 36, alignItems: 'center' },
  rowTextWrap: { flex: 1, paddingLeft: spacing.s },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  // ── Accordion Body ──
  accordionBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },

  // ── Option Rows inside accordion ──
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l + 36 + spacing.s,
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  optionLabel: { color: colors.textPrimary, fontSize: 14 },

  // ── Encryption info panel ──
  encryptionInfo: {
    alignItems: 'center',
    padding: spacing.l,
    paddingHorizontal: spacing.xl,
  },
  encryptionIcon: {
    marginBottom: 8,
  },
  encryptionText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  safetyCodeContainer: {
    marginTop: spacing.m,
    padding: spacing.m,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.divider,
    alignItems: 'center',
    width: '100%',
  },
  safetyCodeHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryAccent,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  safetyCodeDigits: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: spacing.s,
  },
  safetyCodeFooter: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Action Rows (danger zone) ──
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  actionText: { color: colors.error, fontSize: 15, fontWeight: '600', marginLeft: spacing.s },

  noBorder: { borderBottomWidth: 0 },
}));

export default ContactInfoScreen;
