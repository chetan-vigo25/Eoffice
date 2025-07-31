import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../../Config/Http";
import { Alert, ToastAndroid } from "react-native";


function showToast(message) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
}

export async function personalInfo(requestBody) {
  try {
    const response = await apiCall("POST", "/client/auth/profile", requestBody);
    if (response.statusCode === 200) {
      return response.data;
    } else {
      // Show error toast if response statusCode is not 200
      showToast("Error: " + response.message || "Failed to fetch Client Profile");
      throw new Error("Failed to fetch Client Profile: " + response.message);
    }
  } catch (error) {
    // Log the error and show a toast message
    console.error("Error fetching Client Data:", error);
    showToast("Error fetching Client data");
    throw error;
  }
}



export const clientServices = {
  personalInfo,
};
