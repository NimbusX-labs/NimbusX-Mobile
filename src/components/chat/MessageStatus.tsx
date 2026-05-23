import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';

type Status = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: Status;
}

// Colors for each state
const TICK_COLOR: Record<Status, string> = {
  pending:   'rgba(255,255,255,0.5)',
  sent:      'rgba(255,255,255,0.6)',
  delivered: 'rgba(255,255,255,0.6)',
  read:      '#53BDEB',   // WhatsApp-style blue
  failed:    colors.error,
};

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  // ── Pending ──────────────────────────────────────────────────────────
  if (status === 'pending') {
    return (
      <View style={styles.wrapper}>
        <Icon name="time-outline" size={13} color={TICK_COLOR.pending} />
      </View>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <View style={styles.wrapper}>
        <Icon name="alert-circle" size={14} color={TICK_COLOR.failed} />
      </View>
    );
  }

  // ── Sent – single tick ────────────────────────────────────────────────
  if (status === 'sent') {
    return (
      <View style={styles.wrapper}>
        <Icon name="checkmark" size={14} color={TICK_COLOR.sent} />
      </View>
    );
  }

  // ── Delivered / Read – double ticks using checkmark-done ──────────────
  return (
    <View style={styles.wrapper}>
      <Icon name="checkmark-done" size={15} color={TICK_COLOR[status]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginLeft: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(MessageStatus);
