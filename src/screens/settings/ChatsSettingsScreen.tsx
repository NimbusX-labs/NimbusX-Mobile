import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setTheme,
  setWallpaper,
  toggleEnterIsSend,
  toggleMediaVisibility,
  setBackupState,
  ThemeMode,
} from '@store/slices/settingsSlice';
import { clearAllMessages } from '@store/slices/messageSlice';
import { clearAllChats } from '@store/slices/chatSlice';
import { firestoreService } from '@services/supabase/database';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const SettingItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={22} color={colors.textSecondary} style={styles.itemIcon} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {!rightElement && onPress && <Icon name="chevron-forward" size={16} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
};

const ChatsSettingsScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { theme, wallpaper, enterIsSend, mediaVisibility, lastBackupTime, isBackingUp } = useAppSelector(
    (state) => state.settings
  );
  const chatIds = useAppSelector((state) => state.chats.ids);

  // Modal States
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [wallpaperModalVisible, setWallpaperModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Backup Progress States
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupPhase, setBackupPhase] = useState('');
  const [backupSimActive, setBackupSimActive] = useState(false);

  // Theme list helper
  const themesList: { key: ThemeMode; label: string; desc: string }[] = [
    { key: 'dark', label: 'Midnight Dark', desc: 'Premium deep blue-black layout (Default)' },
    { key: 'teal', label: 'Deep Ocean Teal', desc: 'Sleek aquatic teal accents' },
    { key: 'emerald', label: 'Emerald Shadow', desc: 'Elegant matrix emerald glow' },
    { key: 'light', label: 'Light Slate', desc: 'Clean, high-contrast light theme' },
    { key: 'system', label: 'System Default', desc: 'Matches device layout setting' },
  ];

  const wallpapersList = [
    { key: 'default', label: 'Default Navy', value: null, desc: 'Original chat background layout' },
    { key: 'navy', label: 'Midnight Navy', value: '#060B13', desc: 'Premium dark blue-black hue' },
    { key: 'teal', label: 'Ocean Teal Abyss', value: '#031317', desc: 'Deep aquatic dark teal backdrop' },
    { key: 'emerald', label: 'Emerald Forest', value: '#02140F', desc: 'Sleek obsidian green tone' },
    { key: 'slate', label: 'Slate Obsidian', value: '#0D111A', desc: 'Slate-tinted dark navy workspace' },
    { key: 'charcoal', label: 'Pure Charcoal', value: '#101010', desc: 'Elegant deep grey-black shadow' },
    { key: 'burgundy', label: 'Burgundy Shadow', value: '#1F0711', desc: 'Dark burgundy wine overlay' },
  ];

  const handleSelectTheme = (mode: ThemeMode) => {
    dispatch(setTheme(mode));
    setThemeModalVisible(false);
    Alert.alert('Theme Changed', `NimbusX Theme set to ${mode.toUpperCase()} mode.`);
  };

  const handleSelectWallpaper = (value: string | null) => {
    dispatch(setWallpaper(value));
    setWallpaperModalVisible(false);
    Alert.alert('Wallpaper Changed', 'Your chat background wallpaper has been successfully updated.');
  };

  // Simulate Backup Process
  const triggerBackup = () => {
    if (backupSimActive) return;
    setBackupSimActive(true);
    dispatch(setBackupState({ backingUp: true, lastBackupTime: lastBackupTime }));
    setBackupProgress(0);

    const phases = [
      'Scanning chat logs and databases...',
      'Compressing messages history...',
      'Uploading media files to secure vault...',
      'Encrypting vault keys (AES-256)...',
      'Finalizing backup verification...',
    ];

    let progress = 0;
    let phaseIdx = 0;
    setBackupPhase(phases[0]);

    const interval = setInterval(() => {
      progress += 5;
      setBackupProgress(progress);

      if (progress === 20) {
        phaseIdx = 1;
        setBackupPhase(phases[1]);
      } else if (progress === 45) {
        phaseIdx = 2;
        setBackupPhase(phases[2]);
      } else if (progress === 70) {
        phaseIdx = 3;
        setBackupPhase(phases[3]);
      } else if (progress === 90) {
        phaseIdx = 4;
        setBackupPhase(phases[4]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setBackupSimActive(false);
        const now = Date.now();
        dispatch(setBackupState({ backingUp: false, lastBackupTime: now }));
        Alert.alert('Backup Complete', 'All chat data has been safely encrypted and synchronized.');
      }
    }, 150);
  };

  // History action operations
  const handleClearHistory = () => {
    Alert.alert(
      'Clear All Chats',
      'This will erase all messages from your device chat list. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (chatIds && chatIds.length > 0) {
                await Promise.all(chatIds.map(id => firestoreService.clearMessages(String(id))));
              }
              dispatch(clearAllMessages());
              Alert.alert('Cleared Successfully', 'All message records were cleared from this device.');
            } catch (error) {
              console.error('Failed to clear messages history:', error);
              Alert.alert('Error', 'Failed to clear message history. Please check your connection.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHistory = () => {
    Alert.alert(
      'Delete All Conversations',
      'This will permanently delete all chat groups and direct threads. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (chatIds && chatIds.length > 0) {
                await Promise.all(chatIds.map(id => firestoreService.deleteChat(String(id))));
              }
              dispatch(clearAllMessages());
              dispatch(clearAllChats());
              Alert.alert('Deleted Successfully', 'All conversations have been deleted.');
            } catch (error) {
              console.error('Failed to delete conversations:', error);
              Alert.alert('Error', 'Failed to delete conversations. Please check your connection.');
            }
          },
        },
      ]
    );
  };

  const formattedLastBackup = lastBackupTime
    ? new Date(lastBackupTime).toLocaleString()
    : 'Never backed up';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.section}>
          <SettingItem
            icon="moon-outline"
            title="Theme"
            subtitle={themesList.find((t) => t.key === theme)?.label || 'Midnight Dark'}
            onPress={() => setThemeModalVisible(true)}
          />
          <SettingItem
            icon="image-outline"
            title="Wallpaper"
            subtitle={wallpapersList.find((w) => w.value === wallpaper)?.label || 'Default Navy'}
            onPress={() => setWallpaperModalVisible(true)}
          />
        </View>

        <Text style={styles.sectionTitle}>Chat settings</Text>
        <View style={styles.section}>
          <SettingItem
            icon="return-down-forward-outline"
            title="Enter is send"
            subtitle="Enter key will send your message"
            rightElement={
              <Switch
                value={enterIsSend}
                onValueChange={() => {
                  dispatch(toggleEnterIsSend());
                }}
                thumbColor={colors.white}
                trackColor={{ true: colors.primaryAccent, false: colors.divider }}
              />
            }
          />
          <SettingItem
            icon="eye-outline"
            title="Media visibility"
            subtitle="Show newly downloaded media in your device's gallery"
            rightElement={
              <Switch
                value={mediaVisibility}
                onValueChange={() => {
                  dispatch(toggleMediaVisibility());
                }}
                thumbColor={colors.white}
                trackColor={{ true: colors.primaryAccent, false: colors.divider }}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Maintenance & Backup</Text>
        <View style={styles.section}>
          <SettingItem
            icon="server-outline"
            title="Chat backup"
            subtitle={`Last Backup: ${formattedLastBackup}`}
            onPress={() => setBackupModalVisible(true)}
          />
          <SettingItem
            icon="time-outline"
            title="Chat history"
            subtitle="Clear messages or wipe logs"
            onPress={() => setHistoryModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* 1. Theme Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {themesList.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.themeOptionRow, theme === t.key && styles.themeOptionRowActive]}
                onPress={() => handleSelectTheme(t.key)}
                activeOpacity={0.8}
              >
                <View style={styles.themeOptionLeft}>
                  <View style={[styles.radioCircle, theme === t.key && styles.radioCircleActive]}>
                    {theme === t.key && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ marginLeft: spacing.m }}>
                    <Text style={styles.themeOptionLabel}>{t.label}</Text>
                    <Text style={styles.themeOptionDesc}>{t.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 2. Backup Manager Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={backupModalVisible}
        onRequestClose={() => setBackupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat Backup Vault</Text>
              <TouchableOpacity
                onPress={() => setBackupModalVisible(false)}
                style={styles.closeButton}
                disabled={backupSimActive}
              >
                <Icon name="close" size={24} color={backupSimActive ? colors.textTertiary : colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.backupContainer}>
              <Icon name="cloud-upload" size={64} color={colors.primaryAccent} style={styles.cloudIcon} />
              <Text style={styles.backupInfoText}>
                Your database is backed up securely in Supabase storage buckets. Encrypted copies are preserved
                using AES-256 standard cryptographic protocols.
              </Text>

              <View style={styles.metaBox}>
                <Text style={styles.metaRow}>
                  Last Backup:{' '}
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{formattedLastBackup}</Text>
                </Text>
                <Text style={styles.metaRow}>
                  Status:{' '}
                  <Text style={{ fontWeight: '700', color: colors.success }}>Encrypted & Synchronized</Text>
                </Text>
              </View>

              {backupSimActive ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginBottom: spacing.s }} />
                  <Text style={styles.phaseText}>{backupPhase}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${backupProgress}%` }]} />
                  </View>
                  <Text style={styles.progressPercent}>{backupProgress}%</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={triggerBackup}>
                  <Text style={styles.primaryButtonText}>Back Up Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Chat History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat Maintenance</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.historyContainer}>
              <TouchableOpacity style={styles.historyBtn} onPress={handleClearHistory}>
                <Icon name="trash-outline" size={22} color={colors.error} />
                <View style={styles.historyBtnContent}>
                  <Text style={[styles.historyBtnTitle, { color: colors.error }]}>Clear All Messages</Text>
                  <Text style={styles.historyBtnDesc}>Delete all messages in threads. Retains empty threads in list.</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.historyBtn} onPress={handleDeleteHistory}>
                <Icon name="trash" size={22} color={colors.error} />
                <View style={styles.historyBtnContent}>
                  <Text style={[styles.historyBtnTitle, { color: colors.error }]}>Delete All Conversations</Text>
                  <Text style={styles.historyBtnDesc}>Wipe all conversations and messages entirely from device.</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Wallpaper Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={wallpaperModalVisible}
        onRequestClose={() => setWallpaperModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Chat Wallpaper</Text>
              <TouchableOpacity onPress={() => setWallpaperModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {wallpapersList.map((w) => (
              <TouchableOpacity
                key={w.key}
                style={[styles.themeOptionRow, wallpaper === w.value && styles.themeOptionRowActive]}
                onPress={() => handleSelectWallpaper(w.value)}
                activeOpacity={0.8}
              >
                <View style={styles.themeOptionLeft}>
                  <View style={[styles.radioCircle, wallpaper === w.value && styles.radioCircleActive]}>
                    {wallpaper === w.value && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ marginLeft: spacing.m }}>
                    <Text style={styles.themeOptionLabel}>{w.label}</Text>
                    <Text style={styles.themeOptionDesc}>{w.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  sectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginLeft: spacing.xl + 22 + spacing.m, // Align with text
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  itemIcon: {
    width: 24,
    textAlign: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.l,
  },
  itemTitle: {
    fontSize: typography.fontSize.large,
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
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
  themeOptionRow: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  themeOptionRowActive: {
    backgroundColor: colors.secondaryBackground,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primaryAccent,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryAccent,
  },
  themeOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  themeOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backupContainer: {
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  cloudIcon: {
    marginBottom: spacing.l,
  },
  backupInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  metaBox: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.l,
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.s,
  },
  metaRow: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.s,
  },
  phaseText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.s,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryAccent,
  },
  progressPercent: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  historyContainer: {
    paddingVertical: spacing.s,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.s,
    gap: spacing.m,
  },
  historyBtnContent: {
    flex: 1,
  },
  historyBtnTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyBtnDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.divider,
  },
}));

export default ChatsSettingsScreen;
