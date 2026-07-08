import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo: Expo;

  constructor() {
    // Initialize the official Expo SDK client
    this.expo = new Expo();
  }

  /**
   * Sends a standard push notification to a specific user's device token
   * @param targetPushToken The ExponentPushToken string from the database
   * @param title The headline of the notification banner
   * @param body The main message content
   * @param data Optional custom JSON metadata (e.g., orderId, route paths)
   */
  async sendNotification(
    targetPushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // 1. Validate that the token is a legitimate Expo push token
    if (!Expo.isExpoPushToken(targetPushToken)) {
      console.error(`[Notifications] Provided token ${targetPushToken} is not a valid Expo push token`);
      return;
    }

    // 2. Construct the single message object
    const messages = [
      {
        to: targetPushToken,
        sound: 'default' as const,
        title,
        body,
        data,
        priority: 'high' as const,
      },
    ];

    try {
      // 3. Dispatch the message through Expo's API gateway chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        console.log('[Notifications] Ticket Receipt:', ticketChunk);
        
        // Note: In a larger production app, you would inspect ticketChunk 
        // to see if the token was uninstalled/invalidated by Apple/Google 
        // and delete it from your DB if needed.
      }
    } catch (error) {
      console.error('[Notifications] Failed to dispatch push alert:', error);
      throw new InternalServerErrorException('Failed to process outgoing push notification');
    }
  }
}