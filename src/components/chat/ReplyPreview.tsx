import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface ReplyPreviewProps {
  name: string;
  text: string;
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ name, text, onCancel }) => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.bar} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.text} numberOfLines={2}>{text}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.close}>
        <Icon name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  bar: {
    width: 4,
    backgroundColor: colors.primaryAccent,
    borderRadius: 2,
  },
  textContainer: {
    marginLeft: spacing.m,
    flex: 1,
  },
  name: {
    color: colors.primaryAccent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  close: {
    padding: spacing.s,
  },
}));

export default React.memo(ReplyPreview);
