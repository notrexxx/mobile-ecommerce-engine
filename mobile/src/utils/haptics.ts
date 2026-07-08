import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerHaptic = {
  // Light tick - for tabs, small buttons, quantity adjustments
  light: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // Medium bump - for standard saves, adding to cart, standard navigation
  medium: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  
  // Heavy thud - for destructive actions (deleting), major state changes
  heavy: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  
  // Success sequence - for successful checkouts, saving products
  success: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  
  // Warning/Error sequence - for failed logins, out of stock alerts
  error: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};