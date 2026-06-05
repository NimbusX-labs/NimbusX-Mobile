import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1 
    ? `${typingUsers[0]} is typing...`
    : `${typingUsers.length} people are typing...`;

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
}));

export default TypingIndicator;
