import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../../Config/Http";
import { Alert, ToastAndroid, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";

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

export async function personalInfo(requestBody, navigation) {
  try {
    // Ensure token exists before calling the API
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      // If no token, show a toast and throw an error
      throw new Error("No token found. Please log in.");
    }

    // Make the API call only if token is available
    const response = await apiCall("POST", "/client/auth/profile", requestBody);
    
    // Ensure the response is defined and has statusCode
    if (response && response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch Client Profile:2 " + response?.message);
    }
  } catch (error) {
    // Log the error and show a toast message
    showToast("Session expired. Please log in again.", () => {
      AsyncStorage.clear() // Navigate to autologin page
    });
    console.log("Error fetching Client Data:3", error);
   
    throw error;
  }
}

export const clientServices = {
  personalInfo,
};
