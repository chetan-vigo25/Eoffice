import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, LayoutAnimation, UIManager, ToastAndroid, Alert, Platform, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { AntDesign, Feather } from "@expo/vector-icons";
import Style from "../../../Style/Style";

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
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export default function OwnerDetail({ navigation }) {

  const dispatch = useDispatch();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

  const [slideAnim] = useState(new Animated.Value(30)); 
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Check for token when the component mounts
    const checkTokenAndFetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          // If no token, show an alert
          showToast("Session expired. Please log in again.", () => {
            AsyncStorage.clear();
            dispatch(logout()); // Dispatch logout action when OK is pressed
            navigation.navigate('Autologin'); // Navigate to autologin page
          });
        } else {
          // If token exists, dispatch the personalInfo action
          dispatch(personalInfo());
        }
      } catch (error) {
        console.log('Error checking token:', error);
        Alert.alert('Error', 'An error occurred while checking the token.');
      }
    };

    checkTokenAndFetchData();
  }, [dispatch]);

  // Convert ownerData to an array if it exists and is array-like
  const ownerDataArray = Array.isArray(personalInfoData?.ownerData)
  ? personalInfoData.ownerData
  : [];


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 }}>Owner's Details</Text>
        </View>
      </View>
      
      {/* Render either the data or a fallback message if no data available */}
      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, padding: 20, transform: [{ translateY: slideAnim }] }}>
        {
          isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ):
          (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {ownerDataArray.length > 0 ? (
              ownerDataArray.map((owner, index) => {
                const {
                  city,
                  country,
                  pinCode,
                  state,
                  street,
                } = owner?.addresses?.primary || {};
                const fullAddress = `${street || "Street not available"}, ${
                  city || "City not available"
                }, ${state || "State not available"} ${
                  pinCode || "PinCode not available"
                }, ${country || "Country not available"}`;

                return (
                  <View key={index} style={{ marginBottom: 0 }}>
                    <Text style={{fontSize: 14, fontFamily: "Poppins-SemiBold",color: Style.headerBgColor, padding: 10,}} >{owner?.fullName || `Owner ${index + 1}`}</Text>
                    <View style={{ width: "100%", marginBottom: 10, backgroundColor: Style.basicbgColor, padding: 10, borderRadius: 10, elevation: 2, }}>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: 500,color: Style.secondryTextColor, paddingBottom: 5,}} >Mail</Text>
                        <View style={{ width: "100%", height: 40, justifyContent: "center", borderRadius: 5, backgroundColor: Style.inputBgColor, marginBottom: 10, padding: 5, elevation: 4,}}>
                          <Text style={{ color: Style.placeHolderTextColor }}>{owner?.email || "No email available"}</Text>
                        </View>
                      </View>
                      <View>
                        <Text style={{ fontSize: 12,fontWeight: 500, color: Style.secondryTextColor, paddingBottom: 5,}} >Date of Birth</Text>
                        <View style={{ width: "100%", height: 40, borderRadius: 5, flexDirection: "row", backgroundColor: Style.inputBgColor, marginBottom: 10, padding: 5, justifyContent: "space-between", alignItems: "center", elevation: 4,}} >
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", }} >
                            <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                          </View>
                          <View style={{ flex: 9, borderRadius: 5, padding: 5 }}>
                            <Text style={{ color: Style.placeHolderTextColor, fontWeight: "500", fontSize: 12,}} >{owner?.generalInfo?.dateOfBirth?moment(owner?.generalInfo?.dateOfBirth).format("DD-MM-YYYY"): "No DOB"}</Text>
                          </View>
                        </View>
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: 500, color: Style.secondryTextColor, paddingBottom: 5,}} >Phone No.</Text>
                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, }} >
                          <View style={{ flex: 1.5, height: 40, justifyContent: "center", backgroundColor: Style.inputBgColor, borderRadius: 5, alignItems: "center",elevation: 4,}} >
                            <Text style={{ color: Style.placeHolderTextColor,fontWeight: "500",fontSize: 14,}}>{owner?.mobile?.code || "-"}</Text>
                          </View>
                          <View style={{ flex: 8, height: 40, justifyContent: "center", backgroundColor: Style.inputBgColor, borderRadius: 5, alignItems: "flex-start", paddingLeft: 10, elevation: 4, }}>
                            <Text style={{ color: Style.placeHolderTextColor, fontWeight: "500", fontSize: 14, }}>{owner?.mobile?.number || "No number available"}</Text>
                          </View>
                        </View>
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: 500, color: Style.secondryTextColor, paddingBottom: 5, }} > Address </Text>
                        <View style={{ width: "100%", justifyContent: "center", borderRadius: 5, backgroundColor: Style.inputBgColor, padding: 5, elevation: 4,}} >
                          <Text style={{ color: Style.placeHolderTextColor, fontWeight: "500", fontSize: 14, padding: 8,}} > {fullAddress}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ justifyContent: "center", alignItems: "center", marginTop: 20 }}>
                <Text style={{ fontSize: 16, color: Style.headerBgColor }}>
                  No owner details available
                </Text>
              </View>
            )}
          </ScrollView>
          )
        }
      </Animated.View>
    </SafeAreaView>
  );
}