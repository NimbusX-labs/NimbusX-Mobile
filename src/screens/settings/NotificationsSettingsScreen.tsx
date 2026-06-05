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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  toggleConversationTones,
  setMessageTone,
  setMessageVibrate,
  setMessageLight,
  toggleMessageHighPriority,
  setGroupTone,
  setGroupVibrate,
  setGroupLight,
  toggleGroupHighPriority,
  setCallRingtone,
  setCallVibrate,
} from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const SettingItem = ({
  title,
  subtitle,
  onPress,
  rightElement,
}: {
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
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {!rightElement && onPress && <Icon name="chevron-forward" size={16} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
};

const NotificationsSettingsScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // Selector Option States
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [activeConfigType, setActiveConfigType] = useState<
    | 'msgTone'
    | 'msgVib'
    | 'msgLight'
    | 'grpTone'
    | 'grpVib'
    | 'grpLight'
    | 'callRing'
    | 'callVib'
    | null
  >(null);

  // Options configuration lists
  const optionsMap = {
    tones: ['Default (ringtone)', 'Chime', 'Aurora', 'Synthwave Glow', 'None'],
    vibrates: ['Default', 'Off', 'Short', 'Long'],
    lights: ['White', 'Cyan', 'Emerald', 'None'],
  };

  const getModalConfig = () => {
    switch (activeConfigType) {
      case 'msgTone':
        return {
          title: 'Message Notification Tone',
          currentValue: settings.messageTone,
          options: optionsMap.tones,
          onSelect: (val: string) => dispatch(setMessageTone(val)),
        };
      case 'msgVib':
        return {
          title: 'Message Vibration Type',
          currentValue: settings.messageVibrate,
          options: optionsMap.vibrates,
          onSelect: (val: string) => dispatch(setMessageVibrate(val)),
        };
      case 'msgLight':
        return {
          title: 'Message Alert Light',
          currentValue: settings.messageLight,
          options: optionsMap.lights,
          onSelect: (val: string) => dispatch(setMessageLight(val)),
        };
      case 'grpTone':
        return {
          title: 'Group Notification Tone',
          currentValue: settings.groupTone,
          options: optionsMap.tones,
          onSelect: (val: string) => dispatch(setGroupTone(val)),
        };
      case 'grpVib':
        return {
          title: 'Group Vibration Type',
          currentValue: settings.groupVibrate,
          options: optionsMap.vibrates,
          onSelect: (val: string) => dispatch(setGroupVibrate(val)),
        };
      case 'grpLight':
        return {
          title: 'Group Alert Light',
          currentValue: settings.groupLight,
          options: optionsMap.lights,
          onSelect: (val: string) => dispatch(setGroupLight(val)),
        };
      case 'callRing':
        return {
          title: 'Call Ringtone',
          currentValue: settings.callRingtone,
          options: optionsMap.tones,
          onSelect: (val: string) => dispatch(setCallRingtone(val)),
        };
      case 'callVib':
        return {
          title: 'Call Vibration Type',
          currentValue: settings.callVibrate,
          options: optionsMap.vibrates,
          onSelect: (val: string) => dispatch(setCallVibrate(val)),
        };
      default:
        return null;
    }
  };

  const config = getModalConfig();

  const handleOpenConfig = (
    type: 'msgTone' | 'msgVib' | 'msgLight' | 'grpTone' | 'grpVib' | 'grpLight' | 'callRing' | 'callVib'
  ) => {
    setActiveConfigType(type);
    setOptionModalVisible(true);
  };

  const handleSelectOption = (val: string) => {
    if (config) {
      config.onSelect(val);
      setOptionModalVisible(false);
      Alert.alert('Settings Updated', `${config.title} set to ${val}.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderTopWidth: 0, marginTop: 0 }]}>
          <SettingItem
            title="Conversation tones"
            subtitle="Play sounds for incoming and outgoing messages."
            rightElement={
              <Switch
                value={settings.conversationTones}
                onValueChange={() => {
                  dispatch(toggleConversationTones());
                }}
                thumbColor={colors.white}
                trackColor={{ true: colors.primaryAccent, false: colors.divider }}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Messages</Text>
        <View style={styles.section}>
          <SettingItem
            title="Notification tone"
            subtitle={settings.messageTone}
            onPress={() => handleOpenConfig('msgTone')}
          />
          <SettingItem
            title="Vibrate"
            subtitle={settings.messageVibrate}
            onPress={() => handleOpenConfig('msgVib')}
          />
          <SettingItem
            title="Light"
            subtitle={settings.messageLight}
            onPress={() => handleOpenConfig('msgLight')}
          />
          <SettingItem
            title="Use high priority notifications"
            subtitle="Show previews of notifications at the top of the screen"
            rightElement={
              <Switch
                value={settings.messageHighPriority}
                onValueChange={() => {
                  dispatch(toggleMessageHighPriority());
                }}
                thumbColor={colors.white}
                trackColor={{ true: colors.primaryAccent, false: colors.divider }}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Groups</Text>
        <View style={styles.section}>
          <SettingItem
            title="Notification tone"
            subtitle={settings.groupTone}
            onPress={() => handleOpenConfig('grpTone')}
          />
          <SettingItem
            title="Vibrate"
            subtitle={settings.groupVibrate}
            onPress={() => handleOpenConfig('grpVib')}
          />
          <SettingItem
            title="Light"
            subtitle={settings.groupLight}
            onPress={() => handleOpenConfig('grpLight')}
          />
          <SettingItem
            title="Use high priority notifications"
            subtitle="Show previews of notifications at the top of the screen"
            rightElement={
              <Switch
                value={settings.groupHighPriority}
                onValueChange={() => {
                  dispatch(toggleGroupHighPriority());
                }}
                thumbColor={colors.white}
                trackColor={{ true: colors.primaryAccent, false: colors.divider }}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Calls</Text>
        <View style={styles.section}>
          <SettingItem
            title="Ringtone"
            subtitle={settings.callRingtone}
            onPress={() => handleOpenConfig('callRing')}
          />
          <SettingItem
            title="Vibrate"
            subtitle={settings.callVibrate}
            onPress={() => handleOpenConfig('callVib')}
          />
        </View>
      </ScrollView>

      {/* Option Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={optionModalVisible}
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{config?.title || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setOptionModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {config?.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionRow,
                  config.currentValue === opt && styles.optionRowActive,
                ]}
                onPress={() => handleSelectOption(opt)}
                activeOpacity={0.8}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.radioCircle,
                      config.currentValue === opt && styles.radioCircleActive,
                    ]}
                  >
                    {config.currentValue === opt && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionLabel}>{opt}</Text>
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
    marginLeft: spacing.xl,
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
    paddingLeft: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  itemContent: {
    flex: 1,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionRow: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  optionRowActive: {
    backgroundColor: colors.secondaryBackground,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
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
  optionLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
}));

export default NotificationsSettingsScreen;
