import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';

interface MessageStatusProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  if (status === 'pending') {
    return <Icon name="time-outline" size={14} color={colors.textSecondary} />;
  }

  if (status === 'failed') {
    return <Icon name="alert-circle" size={14} color={colors.error} />;
  }

  const iconName = status === 'sent' ? 'checkmark' : 'checkmark-done';
  const iconColor = status === 'read' ? colors.primaryAccent : colors.textSecondary;

  return (
    <View style={styles.container}>
      <Icon name={iconName} size={14} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
});

export default React.memo(MessageStatus);
