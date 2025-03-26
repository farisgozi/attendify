import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';
import AppNavigator from './navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { LogBox } from 'react-native';

// Ignore specific warnings that might be related to gesture handler
LogBox.ignoreLogs([
  'TurboModuleRegistry.getEnforcing(...): \'RNGestureHandlerModule\' could not be found',
  'ViewPropTypes will be removed from React Native',
]);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Register for push notifications
    registerForPushNotificationsAsync();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token obtained:', token);
      
      // Save the token to the user's profile if they're logged in
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: session.user.id,
            push_token: token.data,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully for user:', session.user.id);
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  if (loading) {
    // You could add a loading screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator session={session} />
    </SafeAreaProvider>
  );
}