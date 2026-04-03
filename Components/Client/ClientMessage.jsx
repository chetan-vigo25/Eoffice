import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, SafeAreaView, View, Text, StatusBar,
  Linking, ScrollView, Alert, Image, TouchableOpacity, ToastAndroid,
  ActivityIndicator, Platform
} from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function ClientMessage({ navigation }) {
  const dispatch = useDispatch();
  const [defaultListData, setDefaultListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const logoutHandled = useRef(false);

  const handleCallPress = (item) => {
  const phoneNumber = `${item?.mobile?.code}${item?.mobile?.number}`;
  if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch(err => console.error("Failed to open dialer", err));
    } else {
      console.error("No phone number available");
    }
  };
  const handleEmailPress = (item) => {
    const email = item?.email;
    if (email) {
      const url = `mailto:${email}`; 
      Linking.openURL(url).catch(err => console.error("Failed to open email", err));
    } else {
      console.error("No email available");
    }
  };

   useEffect(() => {
     defaultmsgToList();
   }, []);

  const defaultmsgToList = async () => {
   if (logoutHandled.current) return;
      setIsLoading(true)
       let token = await AsyncStorage.getItem("token");
       if(!token) {
        Alert.alert(
          "Error",
          "Session expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: async () => {
                dispatch(logout());
                await AsyncStorage.clear();
                navigation.replace("Splash");
              }
            }
          ],
      { cancelable: false }
    );
        return;
    }
    const response = await fetch(`${BASE_URL}/client/department/support/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "",
        sort: true,
        status: "",
        departmentId: "",
        isPagination: false
      })
    });

    const result = await response.json();

    if (result.statusCode === 200) {
      const docs = result?.data?.departmentIds || [];
      setDefaultListData(docs);
    } else if(result.statusCode === 401){
      dispatch(logout());
      await AsyncStorage.removeItem('token');
      await AsyncStorage.clear();
      navigation.navigate('Autologin');
    } else {
      showToast(result.message || 'Failed to load data');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Message</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 2 }}>Contact your departments</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10 }}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ) : (
            defaultListData.length > 0 ? (
              defaultListData.map((item, index) => (
                <View key={index} style={{
                  backgroundColor: Style.basicbgColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 3,
                }}>
                  {/* Avatar + Name */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}> 
                    <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: Style.primaryTextColor, fontFamily: 'Lato-SemiBold', fontSize: 15, flex: 1 }}>
                      {item?.name}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item?.mobile?.number ? (
                      <TouchableOpacity onPress={() => handleCallPress(item)} style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: '#e8f5e9',
                        justifyContent: 'center', alignItems: 'center',
                      }}>
                        <Feather name="phone-call" size={17} color="#2e7d32" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={{ marginTop: 0 }}>
                      </TouchableOpacity>
                    )}
                    {item?.email ? (
                      <TouchableOpacity onPress={() => handleEmailPress(item)} style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: '#e3f2fd',
                        justifyContent: 'center', alignItems: 'center',
                      }}>
                        <MaterialCommunityIcons name="email-plus-outline" size={19} color="#1565c0" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={{ marginTop: 0 }}>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="message-text-outline" size={48} color="#ccc" />
                <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', marginTop: 12 }}>
                  No Data Found
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}