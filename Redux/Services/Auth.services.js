import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCall } from "../../Config/Http";
import { Alert } from "react-native";
import { ToastAndroid } from "react-native";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

async function login(data) {
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
        // console.error(":", error);
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