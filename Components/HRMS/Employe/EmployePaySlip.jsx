import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, StatusBar, Button, ScrollView, Modal, FlatList, Platform, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import BASE_URL from '../../../Urls/DomainUrl';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';


// import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk);
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export default function EmployePaySlip({ navigation, route }) {
  const { item } = route.params || {};
  const { logout } = useContext(UserContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
  
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          // console.log("User Data---:", parsedData);
        }
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };

    loadUserData();
  }, []);

  const payslipTemplate = async () => {
    try {
        setLoading(true);
        let token = await AsyncStorage.getItem("authToken");
         if (!token) {
           showToast("Authentication token not found");
           setLoading(false);
           return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
          "_id": item._id,
          "type": "payslip"
        });

        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
        };

        const response = await fetch(`${BASE_URL}/admin/htmlTemplateGenerator`, requestOptions);
        const result = await response.json();
        // console.log("Response Status:", result.statusCode);
        // console.log("Full Response:", result);
        
        if(result.statusCode === 200 && result.data && result.data.html){
        //   console.log("Payslip Template Result---:", result);
          const wrappedHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                  body {
                    margin: 0;
                    padding: 0px;
                    font-family: Arial, sans-serif;
                  }
                  * {
                    box-sizing: border-box;
                  }
                </style>
              </head>
              <body>
                ${result.data.html}
              </body>
            </html>
          `;
          setHtml(wrappedHtml);
          setLoading(false);
        } else if (isUnauthorized(result)) {
          await handleEmployeUnauthorized(navigation, logout);
          setLoading(false);
        } else {
          showToast(result.message || "Failed to fetch payslip");
          console.error("API Error:", result);
          setLoading(false);
        }

    } catch (error) {
      console.error("Error fetching payslip template:", error);
      showToast("Error: " + error.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    payslipTemplate();
  }, []);

  const downloadPayslipPDF = async () => {
    if (!html) {
      showToast("Payslip not available");
      return;
    }
  
    try {
      setLoading(true);
  
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
  
      setLoading(false);
      showToast("Payslip generated");
  
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Payslip PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert("PDF saved at", uri);
      }
  
    } catch (error) {
      setLoading(false);
      console.error("PDF Error:", error);
      showToast(`Failed to generate PDF: ${error?.message || error}`);
    }
  };
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Payslip</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 }} >
            <EmployeHeader navigation={navigation} />
            <TouchableOpacity onPress={downloadPayslipPDF} style={{ width:'50%', alignSelf:'flex-end', backgroundColor:'#6a8ff3', padding:10, borderRadius:5, marginVertical:10 }} >
                <Text style={{ color:'#fff', fontSize:14, textAlign:'center', fontFamily:'Lato-SemiBold' }} >Download</Text>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex:1, }} >
              {
                loading ?
                (
                  <View style={{ flex:1, justifyContent:'center', alignItems:'center', marginTop:0 }} >
                    <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                )
                :
                (
                  html ?
                  (
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: html }}
                      style={{ flex: 1 }}
                      scalesPageToFit={true}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      renderError={(errorName) => (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: 'red' }}>Error: {errorName}</Text>
                        </View>
                      )}
                    />
                  )
                  :
                  (
                    <View style={{ flex:1, justifyContent:'center', alignItems:'center',}} >
                      <Text style={{ fontSize:16, color:'#000', fontFamily:'Lato-Regular' }} >No Payslip Available</Text>
                    </View>
                  )
                )
              }
            </ScrollView>
        </View>
    </SafeAreaView>
  )
}
