import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { StackNavigationProp } from '@react-navigation/stack';

type HomeScreenProps = {
  navigation: StackNavigationProp<any>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  type FeatureCardProps = {
    title: string;
    icon: any;
    screen: string;
  };

  const FeatureCard = ({ title, icon, screen }: FeatureCardProps) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate(screen)}
    >
      <Ionicons name={icon} size={40} color="#4630EB" />
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Attendify</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#4630EB" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Your Office Attendance Solution</Text>

      <View style={styles.cardsContainer}>
        <FeatureCard 
          title="Attendance" 
          icon="camera" 
          screen="Attendance" 
        />
        <FeatureCard 
          title="Notifications" 
          icon="notifications" 
          screen="Notifications" 
        />
        <FeatureCard 
          title="Profile" 
          icon="person" 
          screen="Profile" 
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Today's Status</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Check your attendance status and history</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => navigation.navigate('Attendance')}
          >
            <Text style={styles.infoButtonText}>Go to Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  infoButton: {
    backgroundColor: '#4630EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;