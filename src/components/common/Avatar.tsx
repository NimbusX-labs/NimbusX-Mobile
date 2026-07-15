import React from 'react';
import { View, Image, Text } from 'react-native';
import { useThemeColors, createThemedStyles } from '@theme/colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  uri, 
  name = '?', 
  size = 50, 
  isOnline = false,
  showStatus = false 
}) => {
  const colors = useThemeColors();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
      {showStatus && (
        <View 
          style={[
            styles.status, 
            { 
              backgroundColor: isOnline ? colors.online : colors.offline,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              bottom: size * 0.05,
              right: size * 0.05,
            }
          ]} 
        />
      )}
    </View>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  initials: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  status: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primaryBackground,
  },
}));

export default React.memo(Avatar);
