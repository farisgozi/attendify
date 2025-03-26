import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

/**
 * Upload profile image to Supabase Storage
 * @param base64Image - Image in base64 format
 * @param userId - User ID
 * @returns Path of the uploaded image
 */
export const uploadProfileImage = async (
  base64Image: string,
  userId: string
): Promise<string> => {
  try {
    // Check if user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('User is not authenticated');
    }

    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const timestamp = new Date().getTime();
    const fileName = `${userId}-${timestamp}.jpg`;

    // Upload image to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Detailed upload error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return fileName;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a profile image
 * @param path - Path of the image in storage
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Signed URL of the image
 */
export const getProfileImageUrl = async (
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    // If it's already a full URL, just return it
    if (path.startsWith('http')) {
      return path;
    }

    // Get a signed URL
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting profile image URL:', error);
    throw error;
  }
};

/**
 * Delete a profile image from storage
 * @param path - Path of the image to delete
 */
export const deleteProfileImage = async (path: string): Promise<void> => {
  try {
    // Check if user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('User is not authenticated');
    }

    // If it's a full URL, extract just the path
    let filePath = path;
    if (path.includes('avatars/')) {
      const pathParts = path.split('avatars/');
      if (pathParts.length > 1) {
        filePath = pathParts[1];
      }
    }

    // Delete the file
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
};