import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Animated, SafeAreaView, LayoutAnimation, UIManager, Platform, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { AntDesign, Feather } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function PersonalDetail({ navigation }) {

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

  // console.log("personalInfoData---", JSON.stringify(personalInfoData, null, 2))
  const { city, country, pinCode, state, street } = personalInfoData?.addresses?.primary || {};
  const fullAddress = `${street || "Street not available"}, ${city || "City not available"}, ${state || "State not available"} ${pinCode || "PinCode not available"}, ${country || "Country not available"}`;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <View style={{ paddingHorizontal:20, }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Personal Details</Text>
        </View>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        {
          isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ):
          (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
             <Text style={{ fontSize:14, fontWeight:'600', color:Style.headerBgColor, padding:10 }}>Personal Details</Text>
               <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
                <View>
                  <View style={{ width:'100%', height:80, flexDirection:'row', alignItems:'center', gap:20, marginVertical:10 }} >
                    <View style={{ width:80, height:80, borderRadius:100, borderWidth:2, borderColor:Style.headerBgColor, justifyContent:'center', alignItems:'center' }} >
                      <Image source={ personalInfoData?.profileImage ? { uri: personalInfoData.profileImage } : require('../../../assets/userIcon.jpeg') } resizeMode="cover" style={{ width:75, height:75, borderRadius:100 }} />
                    </View>
                    <View style={{ flex:1, justifyContent:'center', alignItems:'flex-start' }} >
                      <Text style={{ fontSize:16, color:Style.headerBgColor, fontFamily:'Lato-SemiBold' }} >{personalInfoData?.fullName || "Unknown"}</Text>
                      <Text style={{ color:Style.placeHolderTextColor, fontSize:14, fontFamily:'Lato-Medium' }} >{personalInfoData?.userName || "No username available"}</Text>
                    </View>
                  </View>
                </View>
               <View>
                 <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Phone No.</Text>
                  <View style={{ flexDirection:'row', gap:10, marginBottom:10 }} >
                    <View style={{ flex:1.5, height:40, backgroundColor:Style.inputBgColor, borderRadius:5, justifyContent:'center', alignItems:'center', elevation:4}} >
                      <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:14 }}>{personalInfoData?.mobile?.code || "-"}</Text>
                    </View>
                    <View style={{ flex:8, height:40, backgroundColor:Style.inputBgColor, borderRadius:5, justifyContent:'center', alignItems:'flex-start', paddingLeft:10, elevation:4 }} >
                     <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.mobile?.number || "No number available"}</Text>
                    </View>
                  </View>
                </View>
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>E-mail ID</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color:Style.placeHolderTextColor }} >{personalInfoData?.email || "No email available"}</Text>
                   </View>
                 </View>
                 <View>
                  <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Address</Text>
                   <View style={{ width:'100%', justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4, }}>
                    <Text style={{ color:Style.placeHolderTextColor, padding:8 }} >{fullAddress}</Text>
                   </View>
                 </View>
                <View style={{ flexDirection:'row', gap:20 }} >
                <View style={{ flex:1 }}>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Joining Date</Text>
                   <View style={{ width:'100%', height:40,  borderRadius:5, flexDirection:'row', backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center', elevation:4}}>
                       <View style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                           <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                       </View>
                      <View style={{ flex:9, borderRadius:5, padding:5 }} >
                       <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:12 }}>{moment(personalInfoData?.clientProfile?.dateOfJoining).format('DD/MM/YYYY') || "No DOJ available"}</Text>
                      </View>
                   </View>
                 </View>
                <View style={{ flex:1 }}>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>DOB</Text>
                   <View style={{ width:'100%', height:40,  borderRadius:5, flexDirection:'row', backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center', elevation:4}}>
                       <View style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                           <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                        </View>
                      <View style={{ flex:9, borderRadius:5, padding:5 }} >
                        <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:12 }}>{moment(personalInfoData?.generalInfo?.dateOfBirth).format('DD/MM/YYYY') || "No DOB available"}</Text>
                      </View>
                   </View>
                 </View>
                </View>
               </View>
               <Text style={{ fontSize:14, fontWeight:'600', color:Style.headerBgColor, padding:10 }}>Secondary Detail</Text>
               <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Organization Type</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                     <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.organizationName || "No organization available"}</Text>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>industry Type</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.industryName || "No organization available"}</Text>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>GST Number</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.clientProfile?.GSTNumber || "No GST Number available"}</Text>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>PAN Card Number</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color:Style.placeHolderTextColor }}>{personalInfoData?.clientProfile?.penNumber || "No PEN Number available"}</Text>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontFamily: 'Lato-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Aadhar Card</Text>
                   <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                    <Text style={{ color:Style.placeHolderTextColor }} >{personalInfoData?.clientProfile?.adharNumber || "No Aadhar no available"}</Text>
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
