import React, { useState } from 'react';
import {
  View,
  Text,

  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setRequestStatus } from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const includedData = [
  { icon: 'person-outline', label: 'Profile Information', desc: 'Display name, email, avatar URL' },
  { icon: 'chatbubble-outline', label: 'Message Metadata', desc: 'Chat IDs, timestamps (no content)' },
  { icon: 'people-outline', label: 'Group Memberships', desc: 'Groups you have joined or created' },
  { icon: 'server-outline', label: 'Storage Settings', desc: 'Cloud Sync or Local Only preference' },
  { icon: 'time-outline', label: 'Account Activity Log', desc: 'Sign-in dates and device types' },
];

const RequestInfoScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { reportStatus, requestDate, expiryDate } = useAppSelector((state) => state.settings);
  const user = useAppSelector((state) => state.auth.user);

  const [compilingProgress, setCompilingProgress] = useState(0);
  const [compilingActive, setCompilingActive] = useState(false);

  const handleRequest = () => {
    Alert.alert(
      'Request Account Report',
      'Under data rights (GDPR/CCPA), we will compile a full report of your account metadata. NimbusX will generate this zip archive in real-time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            const reqDate = new Date().toLocaleDateString();
            const expDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
            dispatch(
              setRequestStatus({
                status: 'pending',
                requestDate: reqDate,
                expiryDate: expDate,
              })
            );

            // Trigger real-time compilation simulation
            setCompilingActive(true);
            setCompilingProgress(0);

            let progress = 0;
            const interval = setInterval(() => {
              progress += 10;
              setCompilingProgress(progress);
              if (progress >= 100) {
                clearInterval(interval);
                setCompilingActive(false);
                dispatch(
                  setRequestStatus({
                    status: 'ready',
                    requestDate: reqDate,
                    expiryDate: expDate,
                  })
                );
                Alert.alert(
                  'Report Ready',
                  'Your account report is fully generated and ready for secure download!'
                );
              }
            }, 300);
          },
        },
      ]
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'Secure Download Initiated',
      'File: nimbusx-data-export.zip\nSize: 42.8 KB\n\nContains:\n- profile_records.json\n- linked_contacts.json\n- status_history.json\n- active_sessions.json',
      [
        {
          text: 'OK',
          onPress: () => {
            // Delete report request (reset to idle) after download or keep it ready
            dispatch(
              setRequestStatus({
                status: 'idle',
                requestDate: null,
                expiryDate: null,
              })
            );
            Alert.alert('Download Complete', 'Your secure archive has been saved to your downloads folder.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Icon name="document-text" size={32} color={colors.primaryAccent} />
          </View>
          <Text style={styles.heroTitle}>Account Data Report</Text>
          <Text style={styles.heroSubtitle}>
            Under your data rights, you can request a complete export of the information NimbusX holds about your account.
          </Text>
        </View>

        {/* What's Included */}
        <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
        <View style={styles.card}>
          {includedData.map((item, i) => (
            <View key={item.label}>
              <View style={styles.includeRow}>
                <View style={styles.includeIconBox}>
                  <Icon name={item.icon} size={18} color={colors.primaryAccent} />
                </View>
                <View style={styles.includeText}>
                  <Text style={styles.includeLabel}>{item.label}</Text>
                  <Text style={styles.includeDesc}>{item.desc}</Text>
                </View>
              </View>
              {i < includedData.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Not Included Note */}
        <View style={styles.notIncludedCard}>
          <Icon name="lock-closed-outline" size={18} color={colors.textTertiary} />
          <Text style={styles.notIncludedText}>
            Message content is{' '}
            <Text style={styles.boldTextPrimary}>not included</Text> in reports.
            NimbusX does not store readable message content on our servers.
          </Text>
        </View>

        {/* Status / Action */}
        <Text style={styles.sectionLabel}>REPORT STATUS</Text>

        {reportStatus === 'idle' && !compilingActive && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Icon name="radio-button-off-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.statusText}>No report requested yet</Text>
            </View>
            <Text style={styles.statusSubtext}>
              Once requested, your report will be generated and sent to{' '}
              <Text style={styles.emailHighlight}>{user?.email || 'your registered email'}</Text>.
            </Text>
          </View>
        )}

        {compilingActive && (
          <View style={[styles.statusCard, styles.statusCardPending]}>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.warning} />
              <Text style={[styles.statusText, { color: colors.warning }]}>Compiling Datastore...</Text>
            </View>
            <View style={styles.progressBox}>
              <Text style={styles.progressLabel}>Processing records: {compilingProgress}%</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${compilingProgress}%` }]} />
              </View>
            </View>
          </View>
        )}

        {reportStatus === 'pending' && !compilingActive && (
          <View style={[styles.statusCard, styles.statusCardPending]}>
            <View style={styles.statusRow}>
              <Icon name="time-outline" size={20} color={colors.warning} />
              <Text style={[styles.statusText, { color: colors.warning }]}>Report Generating</Text>
            </View>
            <Text style={styles.statusSubtext}>
              Requested on <Text style={styles.boldTextPrimary}>{requestDate}</Text>
              .{'\n'}We'll email it to <Text style={styles.emailHighlight}>{user?.email || 'your registered email'}</Text> when it's ready.
            </Text>
          </View>
        )}

        {reportStatus === 'ready' && (
          <View style={[styles.statusCard, styles.statusCardReady]}>
            <View style={styles.statusRow}>
              <Icon name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>Report Ready</Text>
            </View>
            <Text style={styles.statusSubtext}>
              Generated successfully on {requestDate}.{'\n'}
              Available for download until{' '}
              <Text style={styles.boldTextPrimary}>{expiryDate}</Text>.
            </Text>
          </View>
        )}

        {/* Action Button */}
        {reportStatus === 'ready' ? (
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} activeOpacity={0.8}>
            <Icon name="cloud-download-outline" size={18} color={colors.white} />
            <Text style={styles.requestButtonText}>Download Secure Archive</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.requestButton,
              (reportStatus === 'pending' || compilingActive) && styles.requestButtonDisabled,
            ]}
            onPress={handleRequest}
            disabled={reportStatus === 'pending' || compilingActive}
            activeOpacity={0.8}
          >
            <Icon
              name={reportStatus === 'pending' || compilingActive ? 'hourglass-outline' : 'cloud-download-outline'}
              size={18}
              color={reportStatus === 'pending' || compilingActive ? colors.textTertiary : colors.white}
            />
            <Text
              style={[
                styles.requestButtonText,
                (reportStatus === 'pending' || compilingActive) && { color: colors.textTertiary },
              ]}
            >
              {compilingActive
                ? 'Compiling...'
                : reportStatus === 'pending'
                ? 'Report Requested'
                : 'Request Account Report'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footerNote}>
          Reports are provided in compliance with GDPR/CCPA data protection regulations. Secure exports automatically expire after 30 days.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  boldTextPrimary: { fontWeight: '700', color: colors.textPrimary },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  heroCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
  },
  includeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  includeText: { flex: 1 },
  includeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  includeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: { height: 0.5, backgroundColor: colors.divider },
  notIncludedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.l,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  notIncludedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.s,
  },
  statusCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  statusCardPending: {
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.05)',
  },
  statusCardReady: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.s,
  },
  statusSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emailHighlight: {
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  progressBox: {
    marginTop: spacing.s,
    width: '100%',
    gap: spacing.xs,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.warning,
  },
  requestButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  requestButtonDisabled: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  requestButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: spacing.s,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
}));

export default RequestInfoScreen;
