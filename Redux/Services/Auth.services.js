import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../Config/Http";
import { Alert } from "react-native";
import { ToastAndroid, Platform } from "react-native";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Alert.alert('', message); // iOS fallback
  }
}

async function login(data) {
    try {
        const user = await apiCall("POST", "/client/auth/login", data);
        // console.log("usertttttt", user)
        if (user) {
            // AsyncStorage.setItem(`user_info`, JSON.stringify(user?.data?.rawData));
            AsyncStorage.setItem("token", JSON.stringify(user?.data?.token))
            // console.log("gfsdhjk", { userinfo: user });
            showToast(JSON.stringify(user?.message) );
            return { userinfo: user };
        }
    } catch (error) {
        // console.error("Login error:", error);
        console.log("Login error:", error);
        return Promise.reject(error);
    }
}

function logout(navigation) {
  console.log("Logging out...");

  // Clear AsyncStorage token
  AsyncStorage.removeItem("token").then(() => {
      // Show a toast or alert on successful logout
      showToast("Logged out successfully!");

      // If you use navigation to go to the login screen, navigate to it here
      if (navigation) {
          navigation.navigate('Login');  // Replace 'Login' with your actual login screen name
      }
  }).catch((error) => {
      console.log("Error logging out:", error);
      showToast("An error occurred while logging out.");
  });
}


export const authServices = {
    login,
    logout,
};