import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';

type Status = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: Status;
}

// Colors for each state
const TICK_COLOR: Record<Status, string> = {
  pending:   'rgba(255,255,255,0.5)',
  sent:      'rgba(255,255,255,0.75)',
  delivered: 'rgba(255,255,255,0.75)',
  read:      '#53BDEB',   // WhatsApp-style blue
  failed:    colors.error,
};

/**
 * DoubleTick – renders two overlapping checkmark icons exactly like WhatsApp.
 * The second tick is shifted left so they sit on top of each other.
 */
const DoubleTick: React.FC<{ color: string; animated?: boolean }> = ({ color, animated }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const prevColorRef = useRef(color);

  useEffect(() => {
    if (animated && prevColorRef.current !== color) {
      colorAnim.setValue(0);
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      prevColorRef.current = color;
    }
  }, [color, animated, colorAnim]);

  return (
    <View style={styles.doubleTick}>
      {/* First (back) tick */}
      <Icon name="checkmark" size={13} color={color} />
      {/* Second (front) tick – overlaps the first */}
      <View style={styles.secondTick}>
        <Icon name="checkmark" size={13} color={color} />
      </View>
    </View>
  );
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

  // ── Delivered / Read – double ticks ───────────────────────────────────
  const tickColor = TICK_COLOR[status]; // grey for delivered, blue for read
  return (
    <View style={styles.wrapper}>
      <DoubleTick color={tickColor} animated={status === 'read'} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginLeft: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleTick: {
    flexDirection: 'row',
    alignItems: 'center',
    // Total width is narrower than two side-by-side icons
    width: 18,
  },
  secondTick: {
    marginLeft: -7,  // Overlap — same visual as WhatsApp
  },
});

export default React.memo(MessageStatus);
