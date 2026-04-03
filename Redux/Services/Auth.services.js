import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../Config/Http";
import { Alert } from "react-native";
import { ToastAndroid } from "react-native";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

async function login(data) {
    console.log("Login data:", data);
    try {
        const user = await apiCall("POST", "/client/auth/login", data);
        // console.log("usertttttt", user)
        if (user) {
            // AsyncStorage.setItem(`user_info`, JSON.stringify(user?.data?.rawData));
            AsyncStorage.setItem("token", JSON.stringify(user?.data?.token))
            // console.log("gfsdhjk", { userinfo: user });
            return { userinfo: user };
        }
    } catch (error) {
        // console.error("Login error:", error);
        console.error("Login error:", error);
        return Promise.reject(error);
    }
}

function logout() {
    console.log("success notification add");
    AsyncStorage.clear();
    window.location.href("Splash");
}

export const authServices = {
    login,
    logout,
};