import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, View, Text, Image, Animated, TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert, StatusBar, ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Style from "../Style/Style";
import BASE_URL from "../Urls/DomainUrl";
import Icon from 'react-native-vector-icons/FontAwesome5';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function ResetPass({ navigation, route }) {

  const { userName, email, otp } = route.params;
 
  const [password, setPassword] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [message, setMessage] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(true);
  const [showPass1, setShowPass1] = useState(true);

  const changePass = async () => {

    if (password !== cPassword) {
      showToast("Passwords do not match");
      return;
    }

    setIsLoading(true);
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "userName": userName,
      "email": email,
      "password": password
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/auth/forgot/resetPassword`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if(result.statusCode == 200){
            showToast(result.message);
            navigation.navigate("Splash");
        }else{
            showToast(result.message);
            setIsLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.primaryBgColor }}>
      <StatusBar barStyle='dark-content' backgroundColor={Style.primaryBgColor} />
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ width: "100%", height: 200, justifyContent: "center", alignItems: "center", }} >
          <Image source={require("../assets/Eofficelogo.png")} resizeMode="contain" style={{ width: "100%", height: 80 }} />
        </View>

          <View style={{ width: "100%", backgroundColor: Style.basicbgColor,borderRadius: 20, padding: 20, paddingVertical: 30, }}  >
            {/* Content of the second view */}
            <View>
              <Text style={{ fontSize: 22, fontWeight: 600, paddingVertical: 5 }}>Reset Password</Text>
              <View style={{ width: '100%' }}>
                <Text style={{ fontSize: 12, fontWeight: 500 }}>Enter New Password</Text>
                <View style={{ flexDirection:'row', width:'100%', height: 40, borderWidth: 1, borderRadius: 5, borderColor: Style.headerBgColor, marginTop: 0 }}>
                  <TextInput
                    placeholder="New Password"
                    value={password}
                    onChangeText={value => setPassword(value)}
                    secureTextEntry={showPass ? true : false}
                    placeholderTextColor="#808080"
                    style={{ flex: 9, backgroundColor: Style.basicbgColor, borderRadius: 5, padding: 5 }}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                    <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ width: '100%', marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: 500 }}>Enter Confirm Password</Text>
                <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: Style.headerBgColor, marginTop: 0 }}>
                  <TextInput
                    placeholder="Confirm Password"
                    value={cPassword}
                    onChangeText={value => setCPassword(value)}
                    secureTextEntry={showPass1 ? true : false}
                    placeholderTextColor="#808080"
                    style={{ flex: 9, backgroundColor: Style.basicbgColor, borderRadius: 5, padding: 5 }}
                  />
                  <TouchableOpacity onPress={() => setShowPass1(!showPass1)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                    <Icon name={showPass1 ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ width: '100%', paddingHorizontal: 80, marginTop: 30 }}>
                <TouchableOpacity onPress={changePass}  style={{ width: '100%', height: 40, backgroundColor: Style.headerBgColor, borderRadius: 5, justifyContent: 'center', alignItems: 'center', paddingHorizontal:10 }}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" /> 
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: "500", color: Style.basicbgColor }}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}