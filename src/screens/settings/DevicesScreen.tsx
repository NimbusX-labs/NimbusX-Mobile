import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  terminateSession,
  terminateAllOtherSessions,
  linkDevice,
} from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const { width, height } = Dimensions.get('window');

const DevicesScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const sessions = useAppSelector((state) => state.settings.sessions);
  const user = useAppSelector((state) => state.auth.user);

  // QR Link State
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkingProgress, setLinkingProgress] = useState(0);
  const [linkingActive, setLinkingActive] = useState(false);

  const handleTerminate = (id: string, device: string) => {
    Alert.alert(
      'End Session',
      `Terminate the session on "${device}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            dispatch(terminateSession(id));
            Alert.alert('Session Terminated', `The session on "${device}" was logged out successfully.`);
          },
        },
      ]
    );
  };

  const handleTerminateAll = () => {
    Alert.alert(
      'Terminate All Sessions',
      'This will sign you out from all other devices. Your current session will remain active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate All',
          style: 'destructive',
          onPress: () => {
            dispatch(terminateAllOtherSessions());
            Alert.alert('All Other Sessions Terminated', 'You are now only logged in on this active device.');
          },
        },
      ]
    );
  };

  // Simulate scanning QR code to link device
  const handleLinkDevice = () => {
    if (linkingActive) return;
    setLinkingActive(true);
    setLinkingProgress(0);

    const interval = setInterval(() => {
      setLinkingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLinkingActive(false);
          setLinkModalVisible(false);

          // Add simulated device
          const deviceNames = ['MacBook Pro — Safari', 'iPad Air — NimbusApp', 'Linux PC — Firefox'];
          const chosenDevice = deviceNames[Math.floor(Math.random() * deviceNames.length)];
          const newSessionId = Math.random().toString(36).substring(7);

          dispatch(
            linkDevice({
              id: newSessionId,
              device: chosenDevice,
              deviceIcon: chosenDevice.includes('Mac') || chosenDevice.includes('PC') ? 'laptop-outline' : 'tablet-portrait-outline',
              location: 'Mumbai, India',
              ip: '103.44.xx.xx',
              lastActive: 'Active now',
              isCurrent: false,
            })
          );

          Alert.alert('Device Linked Successfully', `NimbusX logged into "${chosenDevice}" successfully!`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Icon name="shield-checkmark-outline" size={20} color={colors.primaryAccent} />
          <Text style={styles.headerText}>
            These are all devices currently logged into your account{user?.email ? ` (${user.email})` : ''}.
            Terminate any session you don't recognise.
          </Text>
        </View>

        {/* Action Link Device */}
        <TouchableOpacity
          style={styles.linkDeviceButton}
          onPress={() => {
            setLinkModalVisible(true);
            setLinkingProgress(0);
            setLinkingActive(false);
          }}
          activeOpacity={0.8}
        >
          <Icon name="qr-code-outline" size={20} color={colors.white} />
          <Text style={styles.linkDeviceText}>Link a New Device</Text>
        </TouchableOpacity>

        {/* Current Device */}
        <Text style={styles.sectionLabel}>THIS DEVICE</Text>
        {currentSession && (
          <View style={styles.sessionCard}>
            <View style={styles.sessionIconBox}>
              <Icon name={currentSession.deviceIcon} size={22} color={colors.primaryAccent} />
            </View>
            <View style={styles.sessionInfo}>
              <View style={styles.sessionTitleRow}>
                <Text style={styles.sessionDevice}>{currentSession.device}</Text>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.sessionMeta}>{currentSession.lastActive}</Text>
            </View>
          </View>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>OTHER SESSIONS</Text>
            {otherSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionIconBox}>
                  <Icon name={session.deviceIcon} size={22} color={colors.textSecondary} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDevice}>{session.device}</Text>
                  <Text style={styles.sessionMeta}>
                    {session.location} · {session.ip}
                  </Text>
                  <Text style={styles.sessionTime}>{session.lastActive}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleTerminate(session.id, session.device)}
                  style={styles.terminateButton}
                  activeOpacity={0.7}
                >
                  <Icon name="close-circle-outline" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Terminate All Button */}
            <TouchableOpacity
              style={styles.terminateAllButton}
              onPress={handleTerminateAll}
              activeOpacity={0.8}
            >
              <Icon name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.terminateAllText}>Terminate All Other Sessions</Text>
            </TouchableOpacity>
          </>
        )}

        {otherSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="checkmark-circle" size={40} color={colors.success} />
            <Text style={styles.emptyStateText}>
              No other active sessions. Your account is only logged in on this device.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* QR scanner / device linking simulated Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={linkModalVisible}
        onRequestClose={() => setLinkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan QR Code</Text>
              <TouchableOpacity
                onPress={() => setLinkModalVisible(false)}
                style={styles.closeButton}
                disabled={linkingActive}
              >
                <Icon name="close" size={24} color={linkingActive ? colors.textTertiary : colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerWrapper}>
              <Text style={styles.scannerInstructions}>
                Open <Text style={{ fontWeight: '700', color: colors.primaryAccent }}>nimbusx.io/web</Text> on
                your computer. Scan the QR code presented on your screen.
              </Text>

              {/* Simulated Camera Scanner View */}
              <View style={styles.cameraBox}>
                <View style={styles.scannerTarget}>
                  {linkingActive && (
                    <ActivityIndicator size="large" color={colors.primaryAccent} style={styles.spinner} />
                  )}
                  {/* Glowing Laser Scan effect */}
                  <View style={styles.scannerLaser} />
                </View>
                <Icon name="camera-outline" size={48} color="rgba(255,255,255,0.15)" style={styles.camIcon} />
              </View>

              {linkingActive ? (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Syncing encrypted chats ({linkingProgress}%)...</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${linkingProgress}%` }]} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleLinkDevice}>
                  <Icon name="scan" size={18} color={colors.white} />
                  <Text style={styles.primaryButtonText}>Simulate QR Scan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    padding: spacing.l,
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.s,
  },
  linkDeviceButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  linkDeviceText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.s,
  },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  sessionInfo: { flex: 1 },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  sessionDevice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.s,
  },
  currentBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 6,
    paddingHorizontal: spacing.s,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  terminateButton: {
    padding: spacing.s,
    marginLeft: spacing.s,
  },
  terminateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingVertical: spacing.m,
    marginTop: spacing.m,
    gap: spacing.s,
  },
  terminateAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.s,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.m,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  scannerWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  scannerInstructions: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cameraBox: {
    width: 220,
    height: 220,
    borderRadius: 24,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  camIcon: {
    zIndex: 1,
  },
  scannerTarget: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '15%',
    borderWidth: 2,
    borderColor: colors.primaryAccent,
    borderRadius: 16,
    borderStyle: 'dashed',
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    zIndex: 3,
  },
  scannerLaser: {
    position: 'absolute',
    top: '20%',
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: colors.primaryAccent,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  progressRow: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.s,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryAccent,
  },
}));

export default DevicesScreen;
