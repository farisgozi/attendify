import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { StyleSheet, View, Alert, Image, TouchableOpacity, Text, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

interface Props {
  size: number
  url: string | null
  onUpload: (filePath: string) => void
  userId: string
}

export default function Upload({ url, size = 150, onUpload, userId }: Props) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarSize = { height: size, width: size }

  useEffect(() => {
    console.log('Upload component mounted')
    console.log('Initial URL:', url)
    console.log('User ID:', userId)
  }, [])

  useEffect(() => {
    if (url) {
      console.log('URL changed:', url)
      downloadImage(url)
    }
  }, [url])

  async function downloadImage(path: string) {
    try {
      console.log('Downloading image from path:', path)
      
      // Check if it's already a full URL
      if (path.startsWith('http')) {
        console.log('Path is already a full URL')
        setAvatarUrl(path)
        return
      }
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .download(path)

      if (error) {
        console.error('Error downloading image:', error)
        throw error
      }

      console.log('Image downloaded successfully')
      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = () => {
        const dataUrl = fr.result as string
        console.log('Image converted to data URL')
        setAvatarUrl(dataUrl)
      }
    } catch (error) {
      console.error('Error in downloadImage:', error)
    }
  }

  async function uploadAvatar() {
    try {
      console.log('Starting avatar upload process')
      setUploading(true)
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('Permission status:', status)
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload an avatar.'
        )
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      console.log('Image picker result:', result.canceled)
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker')
        return
      }

      // Process selected image
      const image = result.assets[0]
      console.log('Selected image URI:', image.uri)
      
      // Convert image to array buffer
      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer())
      console.log('Image converted to array buffer, size:', arraybuffer.byteLength)
      
      // Generate file path
      const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const filePath = `${userId}-${Date.now()}.${fileExt}`
      console.log('Generated file path:', filePath)

      // Upload to Supabase
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arraybuffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful, data:', data)
      
      // Update avatar URL and call onUpload
      await downloadImage(filePath)
      onUpload(filePath)
      
      Alert.alert('Success', 'Avatar uploaded successfully!')
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            accessibilityLabel="Avatar"
            style={[avatarSize, styles.avatar, styles.image]}
            onLoad={() => console.log('Image loaded successfully')}
            onError={(e) => console.error('Image load error:', e.nativeEvent)}
          />
        ) : (
          <View style={[avatarSize, styles.avatar, styles.noImage]} />
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={uploadAvatar} 
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    borderRadius: 100,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  image: {
    objectFit: 'cover',
  },
  noImage: {
    backgroundColor: '#e1e1e1',
    borderWidth: 1,
    borderColor: '#c8c8c8',
  },
  button: {
    backgroundColor: '#4630EB',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
})