import React, { createContext, useState, useEffect } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../Urls/DomainUrl';
import { isUnauthorized } from './EmployeeAutoLogin';

export const UserContext = createContext();

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) setTimeout(onOk, 2000);
  } else {
    Alert.alert('', message, [{ text: 'OK', onPress: onOk }], {
      cancelable: false,
    });
  }
}

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ================= LOAD USER ON APP START ================= */
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Failed to load userData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= LOGIN SUCCESS HANDLER ================= */
  const setUserAfterLogin = async (user, token) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      setUserData(user);
    } catch (error) {
      console.error('Login storage error:', error);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await AsyncStorage.clear();
    setUserData(null);
  };

  /* ================= IMAGE PICK & UPLOAD ================= */
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);

      if (fileSizeMB > 2) {
        showToast('Image must be smaller than 2MB');
        return;
      }

      await uploadFile(image);
    } catch (error) {
      console.error('pickAndUploadImage error:', error);
    }
  };

  /* ================= FILE UPLOAD ================= */
  const uploadFile = async (image) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const formData = new FormData();
      formData.append('filePath', {
        uri: image.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      formData.append('isMultiple', 'false');
      formData.append('isVideo', 'false');

      const response = await fetch(`${BASE_URL}/admin/fileUpload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        await updateProfileImage(result.data);
      } else if (isUnauthorized(result)) {
        await logout();
      } else {
        showToast('Upload failed');
      }
    } catch (error) {
      console.error('uploadFile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UPDATE PROFILE IMAGE ================= */
  const updateProfileImage = async (imagePath) => {
    let currentUserData = userData;
    if (!currentUserData?._id) {
      try {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) {
          currentUserData = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load userData for update:', error);
      }
      if (!currentUserData?._id) {
        Alert.alert('User not loaded');
        return;
      }
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/admin/profileImage/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: currentUserData._id,
          imagePath,
        }),
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        const updatedUser = {
          ...currentUserData,
          profileImage: imagePath,
        };

        setUserData(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        showToast('Profile image updated!');
      } else if (isUnauthorized(result)) {
        await logout();
      } else {
        Alert.alert('Update failed');
      }
    } catch (error) {
      console.error('updateProfileImage error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        isLoading,
        setUserAfterLogin,
        logout,
        pickAndUploadImage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
