import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { User } from '@supabase/supabase-js';

interface Profile {
  avatar_url: string | null;
  full_name: string;
  job_title: string;
  department: string;
}

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    avatar_url: null,
    full_name: '',
    job_title: '',
    department: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (profile.avatar_url) {
      downloadImage(profile.avatar_url);
    }
  }, [profile.avatar_url]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData && userData.user) {
        setUser(userData.user);
        
        // Fetch profile data if you have a profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setProfile(data as Profile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const pickImage = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload an avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData && userData.user) {
          // Get the image from the result
          const image = result.assets[0];
          
          // Convert image to array buffer for upload
          const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
          
          // Generate file path with user ID and timestamp
          const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
          const filePath = `${userData.user.id}-${Date.now()}.${fileExt}`;
          
          // Upload to Supabase storage
          const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arraybuffer, {
              contentType: `image/${fileExt}`,
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }
          
          console.log('Upload successful, file path:', filePath);
          
          // Update profile with new avatar URL
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: userData.user.id,
              avatar_url: filePath,
              updated_at: new Date(),
            });
            
          if (updateError) {
            console.error('Profile update error:', updateError);
            throw updateError;
          }
          
          // Update local state and download the image
          setProfile({ ...profile, avatar_url: filePath });
          await downloadImage(filePath);
          
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadImage = async (path: string) => {
    try {
      // Check if it's already a full URL
      if (path.startsWith('http')) {
        setProfile({ ...profile, avatar_url: path });
        return;
      }
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .download(path);

      if (error) {
        console.error('Error downloading image:', error);
        throw error;
      }

      // Convert to data URL for display
      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        const dataUrl = fr.result as string;
        setProfile({ ...profile, avatar_url: dataUrl });
      };
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.editIconContainer}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>{profile.full_name || 'Update your name'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="briefcase-outline" size={24} color="#4630EB" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Job Title</Text>
            <Text style={styles.infoValue}>{profile.job_title || 'Not set'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={24} color="#4630EB" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{profile.department || 'Not set'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4630EB',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4630EB',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;