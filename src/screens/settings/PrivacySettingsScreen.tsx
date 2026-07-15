import React, { useState } from 'react';
import {
  View,
  Text,

  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  toggleReadReceipts,
  toggleLastSeen,
  toggleOnlineStatus,
  setProfilePhotoVisibility,
  setLastSeenVisibility,
  blockUser,
  unblockUser,
  Visibility,
} from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import Avatar from '@components/common/Avatar';

const { height } = Dimensions.get('window');

const VisibilityPicker = ({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) => {
  const options: Visibility[] = ['Everyone', 'Contacts', 'Nobody'];
  return (
    <View style={styles.pickerRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.pickerChip, value === opt && styles.pickerChipActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pickerChipText, value === opt && styles.pickerChipTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SwitchRow = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
}) => {
  const colors = useThemeColors();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchRowLeft}>
        <Icon name={icon} size={20} color={colors.textSecondary} style={styles.rowIcon} />
        <View style={styles.flex1}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={colors.white}
        trackColor={{ true: colors.primaryAccent, false: colors.divider }}
      />
    </View>
  );
};

const PrivacySettingsScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const {
    readReceipts,
    lastSeen,
    onlineStatus,
    profilePhotoVisibility,
    lastSeenVisibility,
    blockedUsers,
  } = useAppSelector(state => state.settings);

  const [modalVisible, setModalVisible] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockEmail, setNewBlockEmail] = useState('');

  const handleBlockUser = () => {
    if (!newBlockName.trim() || !newBlockEmail.trim()) return;
    const uid = Math.random().toString(36).substring(7);
    dispatch(
      blockUser({
        uid,
        displayName: newBlockName.trim(),
        email: newBlockEmail.trim().toLowerCase(),
        avatarUrl: '',
      })
    );
    setNewBlockName('');
    setNewBlockEmail('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section: Messages */}
        <Text style={styles.sectionLabel}>MESSAGES</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="checkmark-done-outline"
            title="Read Receipts"
            subtitle="Show blue ticks when your messages are read"
            value={readReceipts}
            onToggle={() => dispatch(toggleReadReceipts())}
          />
        </View>

        {/* Section: Profile */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="time-outline"
            title="Last Seen"
            subtitle="Share when you were last active"
            value={lastSeen}
            onToggle={() => dispatch(toggleLastSeen())}
          />
          <View style={styles.cardDivider} />
          <SwitchRow
            icon="radio-button-on-outline"
            title="Online Status"
            subtitle="Show when you are currently active"
            value={onlineStatus}
            onToggle={() => dispatch(toggleOnlineStatus())}
          />
        </View>

        {/* Section: Profile Photo Visibility */}
        <Text style={styles.sectionLabel}>PROFILE PHOTO</Text>
        <View style={styles.card}>
          <View style={styles.visibilityBlock}>
            <View style={styles.visibilityHeader}>
              <Icon name="image-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.visibilityTitle}>Who can see my photo?</Text>
            </View>
            <VisibilityPicker
              value={profilePhotoVisibility}
              onChange={v => dispatch(setProfilePhotoVisibility(v))}
            />
          </View>
        </View>

        {/* Section: Last Seen Visibility */}
        <Text style={styles.sectionLabel}>LAST SEEN VISIBILITY</Text>
        <View style={styles.card}>
          <View style={styles.visibilityBlock}>
            <View style={styles.visibilityHeader}>
              <Icon name="eye-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.visibilityTitle}>Who can see my last seen?</Text>
            </View>
            <VisibilityPicker
              value={lastSeenVisibility}
              onChange={v => dispatch(setLastSeenVisibility(v))}
            />
          </View>
        </View>

        {/* Section: Blocked Users */}
        <Text style={styles.sectionLabel}>CONTACTS</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.blockedRow}
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="ban-outline" size={20} color={colors.error} style={styles.rowIcon} />
            <View style={styles.flex1}>
              <Text style={[styles.rowTitle, { color: colors.error }]}>Blocked Users</Text>
              <Text style={styles.rowSubtitle}>
                {blockedUsers.length} {blockedUsers.length === 1 ? 'contact' : 'contacts'} blocked
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Privacy settings only apply to your NimbusX account. They do not affect your device system settings.
        </Text>
      </ScrollView>

      {/* Blocked Users Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Blocked Contacts</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Add Form */}
            <View style={styles.blockForm}>
              <Text style={styles.formTitle}>Block New Contact</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                placeholderTextColor={colors.textTertiary}
                value={newBlockName}
                onChangeText={setNewBlockName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Email Address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newBlockEmail}
                onChangeText={setNewBlockEmail}
              />
              <TouchableOpacity
                style={styles.blockButton}
                onPress={handleBlockUser}
                activeOpacity={0.8}
              >
                <Icon name="ban" size={16} color={colors.white} />
                <Text style={styles.blockButtonText}>Block User</Text>
              </TouchableOpacity>
            </View>

            {/* Blocked list */}
            <Text style={styles.listTitle}>Currently Blocked</Text>
            {blockedUsers.length === 0 ? (
              <View style={styles.emptyList}>
                <Icon name="shield-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyListText}>No blocked contacts. Your workspace is clear!</Text>
              </View>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={item => item.uid}
                style={styles.flatList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.blockedUserRow}>
                    <Avatar uri={item.avatarUrl} name={item.displayName} size={38} />
                    <View style={styles.blockedUserInfo}>
                      <Text style={styles.blockedName}>{item.displayName}</Text>
                      <Text style={styles.blockedEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => dispatch(unblockUser(item.uid))}
                      style={styles.unblockButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.s,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 52,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.m,
  },
  rowIcon: { marginRight: spacing.m, width: 24, textAlign: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  visibilityBlock: { padding: spacing.l },
  visibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  visibilityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: spacing.m,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  pickerChip: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  pickerChipActive: {
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderColor: colors.primaryAccent,
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pickerChipTextActive: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.m,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.primaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl * 2 : spacing.xl,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  blockForm: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 0.5,
    borderColor: colors.divider,
    marginBottom: spacing.l,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  modalInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.s,
  },
  blockButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: spacing.s,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xs,
  },
  blockButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  flatList: {
    maxHeight: 250,
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: spacing.m,
  },
  blockedName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  blockedEmail: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  unblockButton: {
    backgroundColor: 'rgba(6,182,212,0.12)',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
  },
  unblockText: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.s,
  },
  emptyListText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.s,
  },
}));

export default PrivacySettingsScreen;
