import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Attendance from '../components/Attendance';
import { supabase } from '../utils/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

const AttendanceScreen = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Not authenticated. Please log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Attendance session={session} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AttendanceScreen;