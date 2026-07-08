import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // 1. You cannot get push tokens on an emulator, it must be a physical device
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  // 2. Check current permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 3. Ask for permission if they haven't granted it yet
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 4. If they say no, silently fail (don't harass the user)
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  // 5. Get the unique Expo Push Token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
    if (!projectId) {
      console.warn('Project ID not found. Token generation might fail in production.');
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    
  } catch (error) {
    console.error('Error fetching push token:', error);
  }

  // 6. Android requires custom channels for notification routing
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}