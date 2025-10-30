import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, SafeAreaView, View, Text, StatusBar,
  Linking, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, ToastAndroid, Platform, RefreshControl,
} from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Entypo, FontAwesome, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

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

export default function ClientMessage({ navigation }) {
  
  const dispatch = useDispatch();
  const [listData, setListData] = useState([]);
  const [defaultListData, setDefaultListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const logoutHandled = useRef(false);


  const handleCallPress = (item) => {
    const phoneNumber = `${item?.mobile?.code}${item?.mobile?.number}`;
    const url = `tel:${phoneNumber}`;
  
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Phone call not supported");
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };
  const handleEmailPress = (item) => {
    const email = item?.email;
    const url = `mailto:${email}`;
  
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Email not supported");
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const defaultmsgToList = async () => {
    if (logoutHandled.current) return;
    setIsLoading(true)
     let token = await AsyncStorage.getItem("token");
     if(!token) {
      navigation.navigate('Splash');
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
      // console.log("test deparments----",docs)
    }else if (result.statusCode === 401) {
      if (!logoutHandled.current) {
        logoutHandled.current = true; // Flag to prevent multiple logouts
        showToast("Session expired. Please log in again.", () => {
          dispatch(logout()); // Dispatch logout action when OK is pressed
          navigation.navigate('Autologin'); // Navigate to autologin page
        });
      }
      setIsLoading(false);
    } else {
      showToast(result.message || 'Failed to load data');
      setIsLoading(false)
    }

    setIsLoading(false);
  };

  useEffect(() => {
    defaultmsgToList();
  }, []);

  const onRefresh = () => {
    setRefresh(true);
    defaultmsgToList();
    setTimeout(() => {
        setRefresh(false);
    }, 2000);
}

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar translucent={false} backgroundColor={'#6a8ff3'} barStyle='light-content' />
      <View style={{ width: '100%', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins-SemiBold' }}>Message</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* List */}
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            defaultListData.length > 0 ? (
              defaultListData.map((item, index) => (
                <View key={index} style={{ flex:7, gap:15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#d6d6d6' }}>
                  <View style={{ flex: 8 }}>
                    <Text style={{ color:Style.primaryTextColor, fontFamily:'Poppins-SemiBold', fontSize:16 }}>{item?.name}</Text>
                  </View>
                  <View style={{ flex:2, height:30, gap:20, flexDirection:'row', justifyContent:'center', alignItems:'center' }} >
                    {item?.mobile?.number ? (
                        <TouchableOpacity onPress={() => handleCallPress(item)} style={{ marginTop: 0 }}>
                          <Feather name="phone-call" size={22} color={Style.primaryTextColor} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={{ marginTop: 0 }}>
                        </TouchableOpacity>
                      )}
                    {item?.email ? (
                      <TouchableOpacity onPress={() => handleEmailPress(item)} style={{ marginTop:0 }}>
                        <MaterialCommunityIcons name="email-plus-outline" size={24} color={Style.primaryTextColor} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={{ marginTop: 0 }}>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                No Data Found
              </Text>
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
