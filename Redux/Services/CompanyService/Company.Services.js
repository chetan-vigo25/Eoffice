import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../../Config/Http";
import { Alert, ToastAndroid, Platform } from "react-native";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export async function companyDetail(userId) {
  // console.log("userId:....i", userId)
  try {
    const requestBody = {
      _id: userId,
    };
    const response = await apiCall("POST", "/admin/company/detail", requestBody);
    // console.log("API Response:", response);
    if (response.statusCode === 200) {
      return response.data; 
    } else {
      throw new Error("Failed to fetch Company Data: " + response.message);
    }
  } catch (error) {
    console.error("Error fetching Company Data:", error);
    showToast("Error fetching company data");
    throw error; 
  }
}

export const companyServices = {
    companyDetail,
};
