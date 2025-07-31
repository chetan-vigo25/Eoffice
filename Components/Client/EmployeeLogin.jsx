import React, { useState, useEffect, useContext, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, Image, Animated, StatusBar, Alert, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';

import BASE_URL from "../../Urls/DomainUrl";
import Style from "../../Style/Style";
import { Entypo } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/FontAwesome5';
import messaging from '@react-native-firebase/messaging';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function Splash({ navigation }) { 

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const getFCMToken = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        const fcmtoken = await messaging().getToken();
        console.log("fcmToken---", fcmtoken);
        setFcmToken(fcmtoken);
      } else {
        console.log("Failed to get token");
      }
    };
  
    getFCMToken();
  }, []);

  const empLogin = async () => {
    
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
        "email": userName,
        "fcmToken": fcmToken,
        "password": password
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    try {
        const response = await fetch(`${BASE_URL}/admin/login`, requestOptions);
        const result = await response.json();
        
        if (result.statusCode === 200) {
            const token = result?.token;
            // console.log("token = result?.token", result?.token)
            await AsyncStorage.setItem('authToken', result?.token);
            navigation.navigate('WebViewComp');
            showToast(result.message);
        } else {
            showToast(result.message);
        }
    } catch (error) {
        console.error(error);
    }
};

  return (
    <SafeAreaView style={{ flex: 1 }}>
      
        <ImageBackground source={require("../../assets/bgImg.png")} resizeMode="cover" style={{ width: '100%', height: '100%', justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: "100%",
              borderRadius: 20,
              padding: 20,
              paddingVertical: 30,
            }}
          >
          <View style={{ marginBottom:30 }}>
            <Image
              source={require("../../assets/Eofficelogo.png")}
              resizeMode="contain"
              style={{ width: "100%", height: 80 }}
            />
          </View>
          <View style={{ flexDirection:'row', gap:20, marginBottom:20 }} >
          </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10 }}>
              <Text style={{ fontSize: 16, fontFamily:'Roboto-Bold' }}>Welcome to</Text>
              <Text style={{ fontSize: 16, fontFamily:'Roboto-Bold', color: '#658eff' }}>&nbsp;E-Office</Text>
            </View>
            <View> 
              <View style={{ width: '100%', marginTop: 0 }}>
                <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your username</Text>
                 <View style={{ width: "100%", height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 10 }}>
                   <TextInput
                     placeholder="Username or ID"
                     value={userName}
                     onChangeText={value => setUserName(value)}
                     placeholderTextColor="#999"
                     style={{ flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 5, paddingLeft:15 }}
                   />
                 </View>
              </View>
              <View style={{ width: '100%', marginTop: 10 }}>
               <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your Password</Text>
                <View style={{ flexDirection: 'row', width: "100%", backgroundColor: '#fff', height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 10 }}>
                  <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={value => setPassword(value)}
                    placeholderTextColor="#999"
                    secureTextEntry={showPass ? true : false}
                    style={{ flex: 9, borderRadius: 5, padding: 5, paddingLeft:15 }}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                    <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text onPress={()=> navigation.navigate('ForgotPass')} style={{ alignSelf: 'flex-end', fontSize: 14, fontFamily:'Poppins-SemiBold', color: '#464646', paddingVertical: 10 }}>Forgot Password?</Text>
            <View style={{ width: '100%', alignItems: 'center' }}>
              <TouchableOpacity onPress={empLogin} style={{ width: '60%', height: 40, backgroundColor: '#658eff', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                {/* {
                  loading ? <ActivityIndicator size="small" color="#fff" /> :  */}
                  <Text style={{ fontSize: 16, fontFamily:'Poppins-Medium', color: '#fff' }}>Login</Text>
                {/* } */}
              </TouchableOpacity>
            </View>                                                                   
          </View>
        </ImageBackground>
      {/* <Toast ref={(ref) => Toast.setRef(ref)} /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth:1,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Style.headerBgColor,
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    // flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Style.placeHolderTextColor,
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});