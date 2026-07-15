import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';

type Status = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: Status;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const colors = useThemeColors();

  const TICK_COLOR: Record<Status, string> = {
    pending:   'rgba(255,255,255,0.35)',
    sent:      'rgba(255,255,255,0.5)',
    delivered: 'rgba(255,255,255,0.5)',
    read:      colors.primaryAccent,   // soft cyan
    failed:    colors.error,
  };
  if (status === 'pending') {
    return (
      <View style={styles.wrapper}>
        <Icon name="time-outline" size={13} color={TICK_COLOR.pending} />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.wrapper}>
        <Icon name="alert-circle" size={13} color={TICK_COLOR.failed} />
      </View>
    );
  }

  if (status === 'sent') {
    return (
      <View style={styles.wrapper}>
        <Icon name="checkmark" size={14} color={TICK_COLOR.sent} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Icon name="checkmark-done" size={14} color={TICK_COLOR[status]} />
    </View>
  );
};

const styles = createThemedStyles((_colors) => ({
  wrapper: {
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default React.memo(MessageStatus);
