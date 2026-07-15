import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Icon name={icon} size={80} color={colors.divider} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.primaryBackground,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
    marginTop: spacing.m,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    marginTop: spacing.s,
    textAlign: 'center',
  },
}));

export default React.memo(EmptyState);
