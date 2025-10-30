import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, View, Text, Image, Animated, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert, StatusBar, ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Style from "../Style/Style";
import BASE_URL from "../Urls/DomainUrl";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function ForgotPass({ navigation }) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    setLoading(true)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      // "userName": userName,
      "email": email,
      "type": "forgotPassword"
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/auth/forgot/sendotp`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
        //   console.log(result.message);
          navigation.navigate("VerifyOtp", {userName: userName, email: email,});
          setLoading(false);
        }
        else {
          setMessage(result.message);
          Alert.alert("Error", result.message, [{ text: "OK" }]);
          setLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => {setLoading(false)})
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.primaryBgColor }}>
      <StatusBar translucent={false} barStyle='dark-content' backgroundColor={Style.primaryBgColor} />
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ width: "100%", height: 200, justifyContent: "center", alignItems: "center", }} >
          <Image source={require("../assets/Eofficelogo.png")} resizeMode="contain" style={{ width: "100%", height: 100 }} />
        </View>

          <View style={{ width: "100%", backgroundColor: Style.basicbgColor,borderRadius: 20, padding: 20, paddingVertical: 30, }}  >
            {/* Content of the second view */}
            <View>
              {/* <Text style={{ fontSize: 22, fontWeight: 600, paddingVertical: 5 }}>Forgot Password</Text>
              <View style={{ width: '100%' }}>
                <View style={{ flexDirection:'row', alignItems:'center' }} >
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Enter your username</Text>
                  <Text style={{ fontSize: 16, fontWeight: 800, color:'red' }}> *</Text>
                </View>
                <View style={{ width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: Style.headerBgColor, marginTop: 2 }}>
                  <TextInput
                    placeholder="Username"
                    value={userName}
                    onChangeText={value => setUserName(value)}
                    placeholderTextColor="#808080"
                    style={{ flex: 1, backgroundColor: Style.basicbgColor, borderRadius: 5, padding: 5 }}
                  />
                </View>
              </View> */}
              <View style={{ width: '100%', marginTop: 10 }}>
                <View style={{ flexDirection:'row', alignItems:'center' }} >
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>Enter your E-mail</Text>
                  <Text style={{ fontSize: 16, fontWeight: 800, color:'red' }}> *</Text>
                </View>
                <View style={{ width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: Style.headerBgColor, marginTop: 2 }}>
                  <TextInput
                    placeholder="E-mail"
                    value={email}
                    onChangeText={value => setEmail(value)}
                    placeholderTextColor="#808080"
                    style={{ flex: 1, backgroundColor: Style.basicbgColor, borderRadius: 5, padding: 5 }}
                  />
                </View>
              </View>
              <View style={{ width: '100%', paddingHorizontal: 100, marginTop: 30 }}>
                <TouchableOpacity onPress={sendOTP} style={{ width: '100%', height: 40, backgroundColor: Style.headerBgColor, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" /> 
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: "500", color: Style.basicbgColor }}>Sent OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}