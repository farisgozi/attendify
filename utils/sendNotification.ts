import { supabase } from './supabase';

export async function sendNotification(userId: string, title: string, body: string) {
  try {
    // Get user's push token
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .single();

    if (tokenError) {
      console.error('Error fetching token:', tokenError);
      throw tokenError;
    }

    if (!tokenData?.token) {
      throw new Error('No push token found for user');
    }

    // Send to Expo's push notification service
    const message = {
      to: tokenData.token,
      sound: 'default',
      title: title,
      body: body,
      priority: 'high',
      channelId: 'default',
      data: { 
        userId: userId,
        timestamp: new Date().toISOString()
      },
      android: {
        sound: 'default',
        priority: 'high',
        sticky: false,
        channelId: 'default',
      },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer D0VMnBoeVFUsXKFvbHdAuP5GANhEb0CfVQe5a-Zm'  // Added 'Bearer' prefix
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.message || 'Failed to send notification');
    }

    console.log('Notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Utility function to send to multiple users
export async function sendNotificationToMany(userIds: string[], title: string, body: string) {
  try {
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (error) throw error;
    if (!tokens?.length) throw new Error('No tokens found');

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { 
        userIds: userIds,
        timestamp: new Date().toISOString()
      },
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.message || 'Failed to send notifications');
    }

    return result;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}