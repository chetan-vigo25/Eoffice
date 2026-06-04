import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../../Config/Http";
import { Alert, ToastAndroid } from "react-native";
import { useNavigation } from "@react-navigation/native";


function showToast(message) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
}

// export async function personalInfo(requestBody) {
//   try {
//     const response = await apiCall("POST", "/client/auth/profile", requestBody);
//     if (response.statusCode === 200) {
//       return response.data;
//     } else {
//       // Show error toast if response statusCode is not 200
//       showToast("Error: " + response.message || "Failed to fetch Client Profile");
//       throw new Error("Failed to fetch Client Profile: " + response.message);
//     }
//   } catch (error) {
//     // Log the error and show a toast message
//     console.log("Error fetching Client Data:--------------", error);
//     showToast("Error fetching Client data");
//     throw error;
//   }
// }

export async function personalInfo(requestBody, navigation) {
  try {
    const response = await apiCall("POST", "/client/auth/profile", requestBody);
    if (response.statusCode === 200) {
      return response.data;
    } else if (response.statusCode === 401) {
      console.log("🔒 Unauthorized - Token may be invalid or expired----");
      showToast("Session expired. Please log in again.");
      
      // Optional: clear token and redirect to Splash
      await AsyncStorage.clear();
      navigation.replace("Autologin");
    
      throw new Error("Unauthorized access");
    } else {
      showToast("Error: " + (response.message || "Failed to fetch Client Profile"));
      throw new Error("Failed to fetch Client Profile: " + response.message);
    }
  } catch (error) {
    console.log("Error fetching Client Data:--------------", error);
    showToast("Error fetching Client data");
    await AsyncStorage.clear();
    throw error;
  }
}

export const clientServices = {
  personalInfo,
};
