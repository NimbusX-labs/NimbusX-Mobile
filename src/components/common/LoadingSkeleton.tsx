import React, { useEffect } from 'react';
import { Animated, DimensionValue } from 'react-native';
import { createThemedStyles } from '@theme/colors';

interface LoadingSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {

  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { width, height, borderRadius, opacity },
        style
      ]} 
    />
  );
};

const styles = createThemedStyles((colors) => ({
  skeleton: {
    backgroundColor: colors.cardBackground,
  },
}));

export default LoadingSkeleton;
