import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Platform } from 'react-native';
import { registerForPushNotificationsAsync, savePushToken } from './utils/pushNotifications';
import Auth from './components/Auth';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';
import { sendNotification } from './utils/sendNotification';
import * as Notifications from 'expo-notifications';
import './utils/notificationConfig';

export default function App() {

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification:', notification);
    });

    // Listen for notification responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const sendTestNotification = async () => {
    try {
      if (session?.user) {
        await sendNotification(
          session.user.id,
          'Test Notification',
          'This is a test notification!'
        );
        console.log('Test notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Setup push notifications
    const setupPushNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushToken(token);
      }
    };

    setupPushNotifications();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>
            Welcome, {session.user.email}!
          </Text>
          <Text style={styles.text}>
            You are logged in successfully.
          </Text>
          <Button 
            title="Send Test Notification"
            onPress={sendTestNotification}
          />
        </View>
      ) : (
        <Auth />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  }
});