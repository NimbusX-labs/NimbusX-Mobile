import React from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ visible, imageUri, onClose }) => {
  const colors = useThemeColors();
  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={30} color={colors.white} />
        </TouchableOpacity>

        {/* Fullscreen Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}));

export default ImagePreviewModal;
