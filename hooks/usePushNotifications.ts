import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, savePushToken } from '../utils/pushNotifications';

export function usePushNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function setupPushNotifications() {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(token);
          setPushToken(token);
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    }

    setupPushNotifications();
  }, []);

  return { pushToken };
}