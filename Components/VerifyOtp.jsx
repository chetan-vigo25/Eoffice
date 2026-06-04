import React, { useRef, useState, useEffect } from 'react'
import {StatusBar, Text, View, Image, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../Urls/DomainUrl';
import { OtpInput } from "react-native-otp-entry";

import Style from '../Style/Style';

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function VerifyOtp({ navigation, route }) {

  const { userName, email } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(120);
  const [isActive, setIsActive] = useState(true);
  
  const submitOTP = async() => {
    setIsLoading(true);
    let token = await AsyncStorage.getItem("token");
    // let OTP = otp.join("");
    if(otp.length != 6){
       showToast("Please enter valid OTP");
       setIsLoading(false);
       return ;
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "userName": userName,
      "email": email,
      "otp": parseInt(otp),
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`${BASE_URL}/client/auth/forgot/verifyotp`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
          if(result.statusCode === 200){
            // console.log("result", result);
            ToastAndroid.show(result.message, ToastAndroid.LONG);
            navigation.navigate("ResetPass", { userName: userName, email: email, otp: otp });
        }
        else {
          // Alert.alert("Error", result.message, [{ text: "OK" }]);
          showToast(result.message);
          setIsLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
      console.log(otp);
  }

  const reSendOTP = async() => {
     const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        
        const raw = JSON.stringify({
          "userName": userName,
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
              // console.log("result", result);
             showToast(result.message);
             setIsLoading(false);
             setSeconds(120); // Reset to 2 minutes
             setIsActive(true);
            }
            else {
              setMessage(result.message);
              Alert.alert("Error", result.message, [{ text: "OK" }]);
            }
          })
          .catch((error) => console.error(error))
          .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, seconds]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
 
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
       <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled' style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{justifyContent:'center', alignItems:'center', padding:20}}>
               <View style={{marginTop:10}}>
                   <Image style={{height:70}} source={require('../assets/Eofficelogo.png')} resizeMode='contain'></Image>
               </View> 
          </View>
          <View style={{flex:1, marginTop:'10%', paddingHorizontal:30,}}>
            <Text style={{fontSize:16, fontFamily:'Lato-SemiBold',}}>Enter 6 Digit OTP</Text>
            <OtpInput
              numberOfDigits={6}
              focusColor="#6a8ff3"
              autoFocus={false}
              hideStick={false}
              blurOnFilled={true}
              disabled={false}
              type="numeric"
              secureTextEntry={false}
              focusStickBlinkingDuration={500}
              // onFocus={() => console.log("Focused")}
              // onBlur={() => console.log("Blurred")}
              onTextChange={(text) => setOtp(text)}
              // onFilled={(text) => console.log(`OTP is ${text}`)}
              textInputProps={{
                accessibilityLabel: "One-Time Password",
              }}
              textProps={{
                accessibilityRole: "text",
                accessibilityLabel: "OTP digit",
                allowFontScaling: false,
              }}
              theme={{
                containerStyle: styles.container,
                pinCodeContainerStyle: styles.pinCodeContainer,
                pinCodeTextStyle: styles.pinCodeText,
                focusStickStyle: styles.focusStick,
                focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                placeholderTextStyle: styles.placeholderText,
                filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
              }}
            />
            <View style={{flexDirection:'row', justifyContent:"center", marginTop:15,}}>
              <Text style={{ color: "black", fontSize:12.5,}}>Did not received OTP?</Text>
                <TouchableOpacity   onPress={() => { if (seconds === 0) { reSendOTP();} }} disabled={seconds > 0}>
                    <Text style={{ color:Style.headerBgColor, fontSize:12.5, }}> {seconds === 0 ? ' Resend OTP' : ''}   </Text>
                </TouchableOpacity>
            </View>
            <View style={{flexDirection:'row', justifyContent:"center", marginTop:15,}}>
              <Text style={{ color: "black", fontSize:12.5,}}>OTP expire in:</Text>
                <TouchableOpacity >
                    <Text style={{ color:Style.headerBgColor, fontSize:14, }}> {formatTime(seconds)} </Text>
                </TouchableOpacity>
            </View>
            {
              !otp ? (
                <View style={{backgroundColor:'#ECF0F6', marginTop:'35%', borderRadius:6,  justifyContent:'center', alignItems:'center', height:40, zIndex:999}}>
                  <Text style={{color:'#6a8ff3', fontSize:16, fontFamily:'Lato-SemiBold'}}>Submit</Text>
                </View>
              ):(
                <TouchableOpacity disabled={isLoading} onPress={() => {submitOTP()}} style={{backgroundColor:Style.headerBgColor, marginTop:'35%', borderRadius:6,  justifyContent:'center', alignItems:'center', height:40, zIndex:999}}>
                 {
                isLoading ? (
                 <ActivityIndicator color={'white'} />
                   ) : (
                     <Text style={{color:'white', fontSize:16, fontFamily:'Lato-SemiBold'}}>Submit</Text>
                     )}
                </TouchableOpacity>
              )
            }
          </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  TextInputBox:
  {
    flex: 1,
    backgroundColor: '#ECF0F6',
    justifyContent: 'center',
    borderRadius: 10,
  },
})
