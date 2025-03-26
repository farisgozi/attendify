import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../utils/supabase';
import ImageWithFallback from './ImageWithFallback';

interface ProfileImageProps {
  userId: string;
  avatarPath: string | null;
  size?: number;
  onPress?: () => void;
  showPlaceholder?: boolean;
  placeholderText?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  userId,
  avatarPath,
  size = 150,
  onPress,
  showPlaceholder = true,
  placeholderText,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a signed URL for the avatar
  useEffect(() => {
    if (avatarPath) {
      generateSignedUrl(avatarPath);
    } else {
      setSignedUrl(null);
    }
  }, [avatarPath]);

  // Refresh the signed URL every 50 minutes to ensure it doesn't expire
  useEffect(() => {
    if (!avatarPath) return;
    
    const refreshInterval = setInterval(() => {
      console.log('Refreshing profile image signed URL...');
      generateSignedUrl(avatarPath);
    }, 50 * 60 * 1000); // 50 minutes
    
    return () => clearInterval(refreshInterval);
  }, [avatarPath]);

  const generateSignedUrl = async (path: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If it's already a full URL, just use it
      if (path.startsWith('http')) {
        setSignedUrl(path);
        return;
      }
      
      // Get a signed URL that will work for 1 hour
      const { data, error: signError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);
        
      if (data && !signError) {
        setSignedUrl(data.signedUrl);
        console.log('Generated signed profile image URL:', data.signedUrl);
      } else {
        console.error('Error creating signed URL:', signError);
        setError('Failed to load profile image');
      }
    } catch (err) {
      console.error('Error generating signed URL:', err);
      setError('Failed to load profile image');
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder component when no image is available
  const renderPlaceholder = () => {
    if (!showPlaceholder) return null;
    
    // If there's a custom placeholder text, use the first letter as avatar
    const letter = placeholderText ? 
      placeholderText.charAt(0).toUpperCase() : 
      userId ? userId.charAt(0).toUpperCase() : '?';
    
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.placeholderText}>{letter}</Text>
      </View>
    );
  };

  // Loading component
  const renderLoading = () => (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <ActivityIndicator size="small" color="#4630EB" />
    </View>
  );

  // Error component with retry button
  const renderError = () => (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => avatarPath && generateSignedUrl(avatarPath)}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Wrap the component with TouchableOpacity if onPress is provided
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={onPress}
      disabled={isLoading || !!error}
    >
      {isLoading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : signedUrl ? (
        <ImageWithFallback
          source={{ uri: signedUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          fallbackSource={require('../assets/default-avatar.png')}
          retryable={true}
          maxRetries={3}
          retryDelay={2000}
          onLoadError={() => setError('Failed to load profile image')}
        />
      ) : (
        renderPlaceholder()
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    borderWidth: 1,
    borderColor: '#c8c8c8',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#4630EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
});

export default ProfileImage;