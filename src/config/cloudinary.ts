import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator loopback to localhost
// For a real device, replace this with your computer's local IP (e.g. 192.168.1.x)
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const PORT = 3001;

export const CLOUDINARY_CONFIG = {
  BACKEND_URL: `http://${DEV_HOST}:${PORT}/api`,
};
