// import React, { useState, useEffect } from 'react';
// import { ScrollView, Alert, RefreshControl } from 'react-native';
// import { Box } from '@/components/ui/box';
// import { Text } from '@/components/ui/text';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { VStack } from '@/components/ui/vstack';
// import { Button, ButtonText } from '@/components/ui/button';
// import { Icon } from '@/components/ui/icon';
// import { User, UserCircle } from 'lucide-react-native';
// import { Avatar, AvatarImage, AvatarFallbackText } from '@/components/ui/avatar';
// import { Input, InputIcon, InputField } from '@/components/ui/input';
// import { Camera } from 'lucide-react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '@/lib/supabase';
// import { useNavigation } from '@react-navigation/native';
// import { ArrowLeft } from 'lucide-react-native';
// import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
// import { useRefresh } from '@/hooks/useRefresh';
// import { Alert as GluestackAlert, AlertText as GluestackAlertText, AlertIcon } from "@/components/ui/alert";
// import { AlertCircleIcon, CheckCircleIcon } from "@/components/ui/icon";

// interface Profile {
//   username: string;
//   full_name: string;
//   avatar_url: string;
// }

// const ProfileScreen = () => {
//   const navigation = useNavigation();
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [profile, setProfile] = useState<Profile>({
//     username: '',
//     full_name: '',
//     avatar_url: '',
//   });
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

//   const { refreshing, onRefresh } = useRefresh(async () => {
//     await getProfile();
//   });

//   const getProfile = async () => {
//     try {
//       setLoading(true)
//       const { data: { user } } = await supabase.auth.getUser();
//       if (user) {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('username, full_name, avatar_url')
//           .eq('id', user.id)
//           .single();

//         if (error) throw error;
//         if (data) setProfile(data);
//       }
//     } catch (error) {
//       Alert.alert(
//         'Error',
//         'Gagal mengambil data profil'
//       );
//     } finally {
//       setLoading(false)
//     }
//   };

//   const updateProfile = async () => {
//     try {
//       setLoading(true);
//       const { data: { user } } = await supabase.auth.getUser();

//       if (user) {
//         const { error } = await supabase
//           .from('profiles')
//           .upsert({
//             id: user.id,
//             username: profile.username,
//             full_name: profile.full_name,
//             avatar_url: profile.avatar_url,
//             updated_at: new Date(),
//           });

//         if (error) throw error;
//         Alert.alert(
//           'Success',
//           'Profil berhasil diperbarui'
//         );
//       }
//     } catch (error) {
//       Alert.alert(
//         'Error',
//         'Gagal memperbarui profil'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const pickImage = async () => {
//     try {
//       setUploading(true);
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (status !== 'granted') {
//         Alert.alert(
//           'Error',
//           'Maaf, kami membutuhkan izin untuk mengakses galeri foto'
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 1,
//       });

//       if (!result.canceled && result.assets[0]) {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (user) {
//           const image = result.assets[0];
//           const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
          
//           const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
//           const filePath = `${user.id}-${Date.now()}.${fileExt}`;

//           const { data, error: uploadError } = await supabase.storage
//             .from('avatars')
//             .upload(filePath, arraybuffer, {
//               contentType: `image/${fileExt}`,
//               upsert: true
//             });

//           if (uploadError) throw uploadError;

//           setProfile({ ...profile, avatar_url: filePath });
//         }
//       }
//     } catch (error) {
//       Alert.alert(
//         'Error',
//         'Gagal mengupload gambar'
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   const downloadImage = async (path: string) => {
//     try {
//     setLoading(true)
//       const { data, error } = await supabase.storage
//         .from('avatars')
//         .download(path);

//       if (error) throw error;

//       const fr = new FileReader();
//       fr.readAsDataURL(data);
//       fr.onload = () => {
//         setAvatarUrl(fr.result as string);
//       }
//     } catch (error) {
//       console.error('Error downloading image:', error);
//     } finally {
//         setLoading(false)
//     }
//   };

//   useEffect(() => {
//     getProfile();
//   }, []);

//   useEffect(() => {
//     if (profile.avatar_url) {
//       downloadImage(profile.avatar_url);
//     }
//   }, [profile.avatar_url]);

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
//       <Box className="flex-1">
//         <Box className="p-5 bg-background-50 border-b border-outline-200">
//           <Box className="flex-row items-center gap-2">
//             <Button
//               variant="link"
//               onPress={() => navigation.goBack()}
//               className="mr-2"
//             >
//               <Icon as={ArrowLeft} size="md" color="#6B7280" />
//             </Button>
//             <Text 
//               size="2xl"
//               className="font-bold text-typography-900"
//             >
//               Profil Akun
//             </Text>
//           </Box>
//         </Box>
        
//         <ScrollView
//           refreshControl={
//             <RefreshControl 
//               refreshing={refreshing} 
//               onRefresh={onRefresh}
//             />
//           }
//         >
//           <VStack space="md" className="p-5">
//             {loading || uploading ? (
//               <VStack space="md">
//                 <Box className="items-center">
//                   <Skeleton
//                     variant="circular"
//                     className="w-32 h-32"
//                   />
//                 </Box>

//                 <Box>
//                   <SkeletonText className="h-5 w-20 mb-1" />
//                   <Skeleton className="h-12 rounded-md" />
//                 </Box>

//                 <Box>
//                   <SkeletonText className="h-5 w-24 mb-1" />
//                   <Skeleton className="h-12 rounded-md" />
//                 </Box>

//                 <Skeleton className="h-12 rounded-md mt-2" />
//               </VStack>
//             ) : (
//               <>
//                 <Box className="items-center">
//                   <Box className="relative">
//                     <Avatar size="2xl" className="border-2">
//                       {avatarUrl ? (
//                         <AvatarImage 
//                           source={{ uri: avatarUrl }}
//                           alt="Profile"
//                         />
//                       ) : (
//                         <AvatarFallbackText>{profile.full_name}</AvatarFallbackText>
//                       )}
//                     </Avatar>
//                     <Button
//                       variant="solid"
//                       size="sm"
//                       className="absolute bottom-0 right-0"
//                       onPress={pickImage}
//                       isDisabled={uploading}
//                     >
//                       <Icon as={Camera} size="sm" color="white" />
//                     </Button>
//                   </Box>
//                 </Box>

//                 <Box>
//                   <Text className="mb-1 text-typography-900">Username</Text>
//                   <Input className="flex-row px-3">
//                     <InputIcon as={User} size="sm" color="#6B7280"/>
//                     <InputField
//                       placeholder="Username"
//                       value={profile.username}
//                       onChangeText={(text) => setProfile({ ...profile, username: text })}
//                     />
//                   </Input>
//                 </Box>

//                 <Box>
//                   <Text className="mb-1 text-typography-900">Nama Lengkap</Text>
//                   <Input className="flex-row px-3">
//                     <InputIcon as={UserCircle} size="sm" color="#6B7280" />
//                     <InputField
//                       placeholder="Nama Lengkap"
//                       value={profile.full_name}
//                       onChangeText={(text) => setProfile({ ...profile, full_name: text })}
//                     />
//                   </Input>
//                 </Box>

//                 <Button
//                   variant="solid"
//                   action="primary"
//                   onPress={updateProfile}
//                   isDisabled={loading}
//                 >
//                   <ButtonText>
//                     {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
//                   </ButtonText>
//                 </Button>
//               </>
//             )}
//           </VStack>
//         </ScrollView>
//       </Box>
//     </SafeAreaView>
//   );
// };

// export default ProfileScreen; 