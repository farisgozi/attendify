import React, { useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfileImage } from '../../utils/profileStorage';
import ProfileImage from '../ProfileImage';

interface EnhancedUploadProps {
  size?: number;
  avatarPath: string | null;
  onUpload: (filePath: string) => void;
  userId: string;
  username?: string;
}

const EnhancedUpload: React.FC<EnhancedUploadProps> = ({
  avatarPath,
  size = 150,
  onUpload,
  userId,
  username,
}) => {
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    try {
      setUploading(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload an avatar.'
        );
        return;
      }

      // Launch image picker with improved options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false, // Don't need EXIF data for profile pictures
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      // Process selected image
      const image = result.assets[0];
      
      // Convert to base64 for upload
      const base64 = await fetch(image.uri)
        .then(response => response.blob())
        .then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert image to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      // Upload image using our enhanced utility
      const filePath = await uploadProfileImage(
        base64,
        userId
      );

      // Call the onUpload callback with the new file path
      onUpload(filePath);
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Upload Failed', 
        error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={pickAndUploadImage}
        disabled={uploading}
        style={styles.imageContainer}
      >
        <ProfileImage
          userId={userId}
          avatarPath={avatarPath}
          size={size}
          placeholderText={username}
        />
        
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>Edit</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={pickAndUploadImage}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Change Profile Picture'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4630EB',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4630EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EnhancedUpload;