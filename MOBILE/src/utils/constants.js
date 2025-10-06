import { Platform } from 'react-native';

// Get your computer's IP address:
// Windows: Run 'ipconfig' in cmd, look for IPv4 Address
// Mac: Run 'ifconfig' in terminal, look for inet
// Linux: Run 'hostname -I'

const YOUR_COMPUTER_IP = '192.168.242.41'; // REPLACE WITH YOUR IP

export const API_CONFIG = {
  BASE_URL: Platform.select({
    android: `http://${YOUR_COMPUTER_IP}:5000/api`, // For physical device
    ios: 'http://localhost:5000/api',
  }),
  TIMEOUT: 15000,
};

export const COLORS = {
  background: '#000000',
  card: '#1a1a1a',
  border: '#333333',
  primary: '#2563eb',
  secondary: '#3b82f6',
  success: '#22c55e',
  danger: '#dc2626',
  warning: '#f59e0b',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
};

export const DEFAULT_BLOCKED_APPS = [
  { packageName: 'com.instagram.android', name: 'Instagram' },
  { packageName: 'com.google.android.youtube', name: 'YouTube' },
  { packageName: 'com.twitter.android', name: 'Twitter' },
  { packageName: 'com.facebook.katana', name: 'Facebook' },
  { packageName: 'com.snapchat.android', name: 'Snapchat' },
];
