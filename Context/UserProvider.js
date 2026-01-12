import React, { createContext, useState, useEffect } from 'react';
import { ToastAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import BASE_URL from '../Urls/DomainUrl';

export const UserContext = createContext();

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };
    loadUserData();
  }, []);

  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission required", "Please allow photo access");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        const pickedImage = result.assets[0];

        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(pickedImage.uri);
        const fileSizeInMB = fileInfo.size / (1024 * 1024);
        if (fileSizeInMB > 2) {
            showToast("File too large", "Please select an image smaller than 2 MB");
          return;
        }

        // Upload to server
        await uploadFile(pickedImage);
      }
    } catch (error) {
      console.error("pickAndUploadImage error:", error);
    }
  };

  const uploadFile = async (image) => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const formData = new FormData();
      formData.append("filePath", {
        uri: image.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });
      formData.append("isMultiple", "false");
      formData.append("isVideo", "false");

      const response = await fetch(`${BASE_URL}/admin/fileUpload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        await updateProfileImage(result.data); // ✅ update user provider
      } else {
        showToast("Upload failed", result.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("uploadFile error:", error);
      Alert.alert("Upload failed", "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileImage = async (imagePath) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${BASE_URL}/admin/profileImage/update`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: userData?._id,
          imagePath,
        }),
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        // ✅ Update context & AsyncStorage
        const updatedUser = {
          ...userData,
          profileImage: imagePath,
        };
        setUserData(updatedUser);
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        showToast("Profile image updated!");
      } else {
        Alert.alert("Update failed", result.message);
      }
    } catch (error) {
      console.error("updateProfileImage error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, pickAndUploadImage, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
