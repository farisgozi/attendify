import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

/**
 * Upload foto ke Supabase Storage
 * @param base64Image - Gambar dalam format base64
 * @param userId - ID user
 * @param type - Tipe foto (check_in atau check_out)
 * @returns URL foto yang diupload
 */

export const uploadAttendancePhoto = async (
  base64Image: string,
  userId: string,
  type: 'check_in' | 'check_out'
): Promise<string> => {
  try {
    // Check if user is authenticated using getSession
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('User is not authenticated');
    }

    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const timestamp = new Date().getTime();
    const fileName = `${userId}_${type}_${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('attendance')
      .upload(filePath, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Detailed upload error:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Get a signed URL that will work for 1 hour instead of a public URL
    // This helps ensure the URL will work properly in the app
    const { data: urlData, error: urlError } = await supabase.storage
      .from('attendance')
      .createSignedUrl(filePath, 3600);
      
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      throw urlError;
    }

    return urlData.signedUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

/**
 * Hapus foto dari Supabase Storage
 * @param photoUrl - URL foto yang akan dihapus
 */
export const deleteAttendancePhoto = async (photoUrl: string): Promise<void> => {
  try {
    // Check if user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('User is not authenticated');
    }
    
    // Ekstrak path dari URL
    const urlParts = photoUrl.split('attendance/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];

    // Hapus file dari storage
    const { error } = await supabase.storage
      .from('attendance')
      .remove([filePath]);

    if (error) {
      console.error('Detailed delete error:', JSON.stringify(error, null, 2));
      throw error;
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};