import React, { useState, useEffect } from "react";
import { View, Text, StatusBar, TouchableOpacity, TextInput, Alert, Image, Animated, SafeAreaView, LayoutAnimation, UIManager, Platform, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign, Feather } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function ContactDetail({ navigation }) {

   const dispatch = useDispatch();
   const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

    const [slideAnim] = useState(new Animated.Value(30)); 

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  //  useEffect(() => {
  //       dispatch(personalInfo());
  //  }, [dispatch]);

  useEffect(() => {
    const checkTokenAndFetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token'); 
        if (!token) {
          Alert.alert(
          "Error",
          "Session expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: async () => {
                dispatch(logout());
                await AsyncStorage.clear();
                navigation.replace("Autologin");
              }
            }
          ],
      { cancelable: false }
    );
        } else {
          dispatch(personalInfo());
        }
      } catch (error) {
        console.log('Error checking token:', error);
        Alert.alert('Error', 'An error occurred while checking the token.');
      }
    };
    checkTokenAndFetchData();
  }, [dispatch]);

  //  console.log("personalInfoData contactInfo", personalInfoData?.clientProfile?.contactInfo)

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <View style={{ paddingHorizontal:20 }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center',}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Contact Details</Text>
        </View>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:"#eee", borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
       {
        isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ):
        (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
           <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor, padding:10 }}>{personalInfoData?.fullName || "No name available"}</Text>
             <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
               <View>
                 <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Mail</Text>
                 <View style={{ width:'100%', height:40,  borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                   <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.clientProfile?.contactInfo?.email || "No email available" }</Text>
                 </View>
               </View>
               <View>
                 <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Designation</Text>
                 <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                  <Text style={{ color:Style.placeHolderTextColor }} >{personalInfoData?.clientProfile?.contactInfo?.designation || "No designation available" }</Text>
                 </View>
               </View>
              <View>
               <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Phone No.</Text>
                <View style={{ flexDirection:'row', gap:10, marginBottom:10,  }} >
                  <View style={{ flex:1.5, height:40, backgroundColor:Style.inputBgColor, borderRadius:5, justifyContent:'center', alignItems:'center', elevation:4}} >
                    <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:14 }}>{personalInfoData?.clientProfile?.contactInfo?.code || "-" }</Text>
                  </View>
                  <View style={{ flex:8, height:40, justifyContent:'center', backgroundColor:Style.inputBgColor, borderRadius:5, justifyContent:'center', alignItems:'flex-start', paddingLeft:10, elevation:4 }} >
                   <Text style={{ color:Style.placeHolderTextColor }} >{personalInfoData?.clientProfile?.contactInfo?.number || "No number available" }</Text>
                  </View>
                </View>
              </View>
             </View>
          </ScrollView>
        )
       }
      </Animated.View>
    </SafeAreaView>
  );
}
