import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function registerForPushNotificationsAsync() {
  try {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push notification permissions');
      }
      
      // Add projectId from your app.json
      const response = await Notifications.getExpoPushTokenAsync({
        projectId: '37da8dc6-3e44-47f6-8688-740cc700a2f2'
      });
      token = response.data;
      console.log('Push token obtained:', token);
    } else {
      throw new Error('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function savePushToken(token: string) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User error:', userError);
      throw userError;
    }
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert({ 
        user_id: user.id,
        token: token,
        created_at: new Date().toISOString()
      }, 
      { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Push token saved successfully for user:', user.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error saving push token:', errorMessage);
    throw error;
  }
}