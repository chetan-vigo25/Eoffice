import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Animated, SafeAreaView, LayoutAnimation, UIManager, Platform, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign, Feather } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function BankDetail({ navigation }) {

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

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <View style={{ paddingHorizontal:20 }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Bank Details</Text>
        </View>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        {
          isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ):(
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
             <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor, padding:10 }}>{personalInfoData?.fullName || "No name available"}</Text>
               <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Account Number</Text>
                   <View style={{ width:'100%', justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color: Style.placeHolderTextColor, fontWeight: '500', fontSize: 14, padding:8 }} >{personalInfoData?.bankData?.[0]?.accountNumber || "Account number not found" }</Text>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Bank Name</Text>
                    <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                      <Text style={{ color: Style.placeHolderTextColor, fontWeight: '500', fontSize: 14, padding:8 }} >{personalInfoData?.bankData?.[0]?.bankName || "Bank not found"}</Text>
                    </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>IFSC Code</Text>
                    <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                      <Text style={{ color: Style.placeHolderTextColor, fontWeight: '500', fontSize: 14, padding:8 }} >{personalInfoData?.bankData?.[0]?.ifscCode || "IFSC code not found"}</Text>
                    </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Branch Name</Text>
                    <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                      <Text style={{ color: Style.placeHolderTextColor, fontWeight: '500', fontSize: 14, padding:8 }} >{personalInfoData?.bankData?.[0]?.branchName || "Branch not found"}</Text>
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
