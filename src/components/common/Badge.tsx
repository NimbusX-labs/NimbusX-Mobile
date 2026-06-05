import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface BadgeProps {
  count: number;
  size?: number;
}

const Badge: React.FC<BadgeProps> = ({ count, size = 20 }) => {
  const colors = useThemeColors();
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.container, { minWidth: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.6 }]}>{displayCount}</Text>
    </View>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
  },
}));

export default React.memo(Badge);
