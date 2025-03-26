import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { sendNotification } from '../utils/sendNotification';

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData && userData.user) {
        // This is a placeholder - you would need to create a notifications table
        // and fetch actual notifications from Supabase
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setNotifications(data as Notification[]);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // For demo purposes, show some sample notifications
      setNotifications([
        { 
          id: 1, 
          title: 'Welcome to Attendify', 
          body: 'Thank you for using our attendance app!',
          created_at: new Date().toISOString(),
          read: false
        },
        { 
          id: 2, 
          title: 'Attendance Reminder', 
          body: 'Don\'t forget to check in today!',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData && userData.user) {
        await sendNotification(
          userData.user.id,
          'Test Notification',
          'This is a test notification from the notifications screen!'
        );
        console.log('Test notification sent successfully');
        
        // Add to local state for immediate feedback
        const newNotification: Notification = {
          id: Date.now(),
          title: 'Test Notification',
          body: 'This is a test notification from the notifications screen!',
          created_at: new Date().toISOString(),
          read: false
        };
        
        setNotifications([newNotification, ...notifications]);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={24} color="#4630EB" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={sendTestNotification} style={styles.testButton}>
          <Text style={styles.testButtonText}>Send Test</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchNotifications}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  testButton: {
    backgroundColor: '#4630EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4630EB',
  },
  readNotification: {
    opacity: 0.7,
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default NotificationsScreen;