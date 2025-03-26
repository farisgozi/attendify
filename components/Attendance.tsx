import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { uploadAttendancePhoto } from '../utils/storage';

type AttendanceProps = {
  session: Session;
};

const Attendance = ({ session }: AttendanceProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>('front');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      // Fetch today's attendance record
      fetchTodayAttendance();
    })();
  }, []);

    // Ripres Signed URL setiap 50 menit sekali,
    // Tujuan nye biar ape? biar keamanan terjaga bos
    // Setiap 50 menit URL Gambar bakal diperbarui dan gabisa diakses pake URL sebelumnya
  useEffect(() => {

    const refreshInterval = setInterval(() => {
      if (todayAttendance) {
        console.log('Refreshing signed URLs...');
        fetchTodayAttendance();
      }
    }, 50 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [todayAttendance]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attendance:', error);
      } else if (data) {
        // Get proper signed URLs for the images
        let updatedData = { ...data };
        
        if (data.check_in_photo) {
          try {
            // Extract the file path from the stored URL
            const fullPath = data.check_in_photo;
            // Get just the filename part after the bucket name
            const pathParts = fullPath.split('attendance/');
            if (pathParts.length > 1) {
              const filePath = pathParts[1];
              
              // Get a signed URL that will work for 1 hour
              const { data: signedData, error: signError } = await supabase.storage
                .from('attendance')
                .createSignedUrl(filePath, 3600);
                
              if (signedData && !signError) {
                updatedData.check_in_photo = signedData.signedUrl;
                console.log('Generated signed check-in URL:', signedData.signedUrl);
              } else {
                console.error('Error creating signed URL:', signError);
              }
            }
          } catch (err) {
            console.error('Error processing check-in photo URL:', err);
          }
        }
        
        if (data.check_out_photo) {
          try {
            // Extract the file path from the stored URL
            const fullPath = data.check_out_photo;
            // Get just the filename part after the bucket name
            const pathParts = fullPath.split('attendance/');
            if (pathParts.length > 1) {
              const filePath = pathParts[1];
              
              // Get a signed URL that will work for 1 hour
              const { data: signedData, error: signError } = await supabase.storage
                .from('attendance')
                .createSignedUrl(filePath, 3600);
                
              if (signedData && !signError) {
                updatedData.check_out_photo = signedData.signedUrl;
                console.log('Generated signed check-out URL:', signedData.signedUrl);
              } else {
                console.error('Error creating signed URL:', signError);
              }
            }
          } catch (err) {
            console.error('Error processing check-out photo URL:', err);
          }
        }
        
        setTodayAttendance(updatedData);
      }
    } catch (error) {
      console.error('Error in fetchTodayAttendance:', error);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsSubmitting(true);
        
        // Take picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        
        // Get location
        const location = await Location.getCurrentPositionAsync({});
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        };
        
        // Upload photo to storage
        const userId = session.user.id;
        const isCheckIn = !todayAttendance || !todayAttendance.check_in;
        const photoType = isCheckIn ? 'check_in' : 'check_out';
        
        const photoUrl = await uploadAttendancePhoto(
          photo.base64 || '',
          userId,
          photoType
        );
        
        // Update or create attendance record
        if (isCheckIn) {
          // Create new check-in record
          const { error } = await supabase.from('attendance').insert({
            user_id: userId,
            check_in: new Date().toISOString(),
            check_in_photo: photoUrl,
            check_in_location: locationData,
          });
          
          if (error) throw error;
          
          Alert.alert('Success', 'Check-in recorded successfully!');
        } else {
          // Update existing record with check-out
          const { error } = await supabase
            .from('attendance')
            .update({
              check_out: new Date().toISOString(),
              check_out_photo: photoUrl,
              check_out_location: locationData,
            })
            .eq('id', todayAttendance.id);
          
          if (error) throw error;
          
          Alert.alert('Success', 'Check-out recorded successfully!');
        }
        
        // Refresh attendance data
        fetchTodayAttendance();
        
        // Close camera
        setIsCameraOpen(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to record attendance. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const hasPermission = permission?.granted && locationPermission;

  if (permission === undefined) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }
  
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>No access to camera or location</Text>
        {!permission?.granted && (
          <TouchableOpacity style={styles.attendButton} onPress={requestPermission}>
            <Text style={styles.attendButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraOpen ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing={type}
            ref={cameraRef}
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setType(
                    type === 'back'
                      ? 'front'
                      : 'back'
                  );
                }}>
                <Text style={styles.flipText}>Flip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCameraOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.attendanceContainer}>
          <Text style={styles.title}>Attendance</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Today's Status</Text>
            
            {/* Remove the comment line that was here */}
            {todayAttendance ? (
              <View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Check In:</Text>
                  <Text style={styles.statusValue}>
                    {todayAttendance.check_in 
                      ? new Date(todayAttendance.check_in).toLocaleTimeString() 
                      : 'Not checked in'}
                  </Text>
                </View>
                
                {todayAttendance && todayAttendance.check_in_photo && (
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>Check-in Photo:</Text>
                    <Image 
                      source={{ 
                        uri: todayAttendance.check_in_photo,
                        cache: 'reload' // Force reload the image instead of using cache
                      }} 
                      style={styles.attendanceImage}
                      resizeMode="cover"
                      onLoadStart={() => console.log('Started loading check-in image')}
                      onLoad={() => console.log('Successfully loaded check-in image')}
                      onError={(error) => {
                        console.error('Error downloading image:', error.nativeEvent.error);
                        // You could implement a retry mechanism here if needed
                        // For now, we'll just log the detailed error
                      }}
                    />
                  </View>
                )}
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Check Out:</Text>
                  <Text style={styles.statusValue}>
                    {todayAttendance.check_out 
                      ? new Date(todayAttendance.check_out).toLocaleTimeString() 
                      : 'Not checked out'}
                  </Text>
                </View>
                
                {todayAttendance && todayAttendance.check_out_photo && (
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>Check-out Photo:</Text>
                    <Image 
                      source={{ 
                        uri: todayAttendance.check_out_photo,
                        cache: 'reload' // Force reload the image instead of using cache
                      }} 
                      style={styles.attendanceImage}
                      resizeMode="cover"
                      onLoadStart={() => console.log('Started loading check-out image')}
                      onLoad={() => console.log('Successfully loaded check-out image')}
                      onError={(error) => {
                        console.error('Error downloading image:', error.nativeEvent.error);
                        // You could implement a retry mechanism here if needed
                        // For now, we'll just log the detailed error
                      }}
                    />
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noRecordText}>No attendance record for today</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.attendButton}
            onPress={() => setIsCameraOpen(true)}
          >
            <Text style={styles.attendButtonText}>
              {!todayAttendance 
                ? 'Check In' 
                : !todayAttendance.check_out 
                  ? 'Check Out' 
                  : 'Attendance Complete'}
            </Text>
          </TouchableOpacity>
          
          {todayAttendance && todayAttendance.check_out && (
            <Text style={styles.completeText}>
              Your attendance for today is complete!
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  attendanceContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  noRecordText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  attendButton: {
    backgroundColor: '#4630EB',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  attendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  flipText: {
    fontSize: 14,
    color: 'white',
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 35,
    height: 70,
    width: 70,
  },
  captureButtonInner: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  cancelButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  cancelText: {
    fontSize: 14,
    color: 'white',
  },
  thumbnailImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  photoContainer: {
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  photoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    padding: 8,
    backgroundColor: '#f5f5f5',
    width: '100%',
    textAlign: 'center',
  },
  
  attendanceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
});

export default Attendance;
