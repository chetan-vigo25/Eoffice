import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, StyleSheet, StatusBar, Platform, Alert, TouchableOpacity, RefreshControl, Image, TextInput, TouchableWithoutFeedback, Keyboard, Modal, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";
import { Feather } from "@expo/vector-icons";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function ClientProfile({ navigation, route }) {

    const dispatch = useDispatch();
    const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState(null)

    const pickImages = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setImages(result.assets[0]);
        uploadFile(result.assets[0]);
      }
    };

    const logoutFun = async () => {
      setLoading(true);
      let token = await AsyncStorage.getItem("token");
  
      if (!token) {
          showToast("No active session found.");
          setLoading(false);
          return;
      }
  
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");
  
      const requestOptions = {
          method: "POST",
          headers: myHeaders,
          redirect: "follow"
      };
  
      fetch(`${BASE_URL}/client/auth/logout`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
              if (result.statusCode === 200) {
                  showToast(result.message);
                  AsyncStorage.removeItem("token");
                  dispatch(logout());
                  navigation.reset({
                      index: 0,
                      routes: [{ name: 'Splash' }]
                  });
  
                  setLoading(false);
              } else {
                  showToast(result.message);
                  setLoading(false);
              }
          })
          .catch((error) => {
              console.error(error);
              showToast("An error occurred while logging out.");
              setLoading(false);
          });
  };

    const uploadFile = async (image) => {
      if (!image) {
        showToast("Please select an image.");
        return;
      }
    
      try {
        let token = await AsyncStorage.getItem("token");
        const formData = new FormData();
        formData.append("filePath", {
          uri: image.uri,
          name: "profile.jpg",
          type: "image/jpeg", 
        });
    
        formData.append("fileLocation", "/clientImage");
        formData.append("isMultiple", "false");
        formData.append("isVideo", "false");
    
        const requestOptions = {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        };
    
        const response = await fetch(`${BASE_URL}/client/auth/fileUpload`, requestOptions);
        const result = await response.json();
    
        if (result.statusCode === 200) {
          // showToast(result.message);
          // console.log("Uploaded profile:", result);
          uploadImage(result.data[0]);
        } else {
          showToast(result.message || "Upload failed.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showToast("Something went wrong.");
      }
    };

    const uploadImage = async (data) => {
      setLoading(true)
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");
      
      const raw = JSON.stringify({
        "profileImage": data
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      
      fetch(`${BASE_URL}/client/auth/update`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode === 200){
            showToast(result.message);
            dispatch(personalInfo());
            setLoading(false);
          }else{
            showToast(result.message);
            setLoading(false);
          }
        })
        .catch((error) => console.error(error))
        .finally(()=> setLoading(false));
    };

    useEffect(() => {
         dispatch(personalInfo());
    }, [dispatch]);

    const { city, country, pinCode, state, street } = personalInfoData?.addresses?.primary || {};
    const fullAddress = `${street || "Street not available"}, ${city || "City not available"}, ${state || "State not available"} ${pinCode || "PinCode not available"}, ${country || "Country not available"}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:Style.headerBgColor }}>
      <StatusBar barStyle="light-content" style="auto" backgroundColor={Style.headerBgColor} />
        <View style={{ flex: 1 }}>
          <View style={{ width: "100%", padding: 50, alignItems: "center" }}>
            <View style={{ width:80, height:80, justifyContent:'center', alignItems:'center', borderWidth:1, borderRadius:100, borderColor:'#fff' }} >
              <Image source={ personalInfoData?.profileImage ? { uri: personalInfoData.profileImage } : require('../../assets/userIcon.jpeg') } style={{ width:75, height:75, borderRadius:100 }} />
                <TouchableOpacity
                  onPress={pickImages}
                  style={{ position: 'absolute', bottom: 5, right: 2, backgroundColor: '#ffffff', padding: 5, borderRadius: 20,}} >
                  <Feather name="edit" size={14} color="#000" />
                </TouchableOpacity>
            </View>
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontFamily:'Poppins-SemiBold' }}>Hi, {personalInfoData?.fullName || "Unknown"}</Text>
              <Text style={{ color:"#dfdfdf", fontSize:12, fontFamily:'Poppins-SemiBold' }} >{personalInfoData?.userName || "No username available"}</Text>
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: "#fff", borderTopStartRadius: 20, borderTopEndRadius: 20, padding: 20, }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%", backgroundColor: "#fff", borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2, padding: 10, }}>
                <View>
                  <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>Profile Name</Text>
                    <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, }}>
                     <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >{personalInfoData?.fullName || "No name available"}</Text>
                    </View>
                  </View>
                <View>
                 <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>Phone No.</Text>
                  <View style={{ flexDirection:'row', gap:10, marginBottom:10 }} >
                    <View style={{ flex:1.5, height:40, backgroundColor:'#b6b6b610', borderRadius:5, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#d6d6d6',}} >
                      <Text style={{ fontFamily:'Poppins-Medium', color:Style.placeHolderTextColor, fontSize:14 }}>{personalInfoData?.mobile?.code || "-"}</Text>
                    </View>
                    <View style={{ flex:8, height:40, backgroundColor:'#b6b6b610', borderRadius:5, justifyContent:'center', alignItems:'flex-start', paddingLeft:10, borderWidth:1, borderColor:'#d6d6d6', }} >
                      <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >{personalInfoData?.mobile?.number || "No number available"}</Text>
                    </View>
                  </View>
                </View>
                <View>
                    <View>
                      <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>E-mail ID</Text>
                      <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, }}>
                       <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >{personalInfoData?.email || "No email available"}</Text>
                      </View>
                    </View>
                </View>
                <View>
                    <View>
                     <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>Address</Text>
                      <View style={{ width:'100%', justifyContent:'center', borderRadius:5, backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, }}>
                       <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >{fullAddress || "No address available"}</Text>
                      </View>
                    </View>
                </View>
                <View style={{ flexDirection:'row', gap:20 }} >
                 <View style={{ flex:1 }}>
                   <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>Joining Date</Text>
                    <View style={{ width:'100%', height:40,  borderRadius:5, flexDirection:'row', backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, justifyContent:"center", alignItems:'center', }}>
                       <View style={{ flex:9, borderRadius:5, padding:5 }} >
                         <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }}>{moment(personalInfoData?.clientProfile?.dateOfJoining).format('DD/MM/YYYY') || "No DOJ available"}</Text>
                       </View>
                       <View style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                          <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                       </View>
                    </View>
                  </View>
                 <View style={{ flex:1 }}>
                   <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>DOB</Text>
                    <View style={{ width:'100%', height:40,  borderRadius:5, flexDirection:'row', backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, justifyContent:"center", alignItems:'center', }}>
                       <View style={{ flex:9, borderRadius:5, padding:5 }} >
                        <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }}>{moment(personalInfoData?.generalInfo?.dateOfBirth).format('DD/MM/YYYY') || "No DOB available"}</Text>
                       </View>
                       <View style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                          <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                       </View>
                    </View>
                  </View>
                </View>
                <View>
                    <View>
                      <TouchableOpacity onPress={()=> navigation.navigate('Privacy')} style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, }}>
                       <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >Privacy Policy</Text>
                      </TouchableOpacity>
                    </View>
                </View>
                <View>
                    <View>
                      <TouchableOpacity onPress={()=> navigation.navigate('TermCondition')} style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:'#b6b6b610', borderWidth:1, borderColor:'#d6d6d6', marginBottom:10, padding:5, }}>
                       <Text style={{ fontFamily:'Poppins-Medium', fontSize:12, color:Style.placeHolderTextColor }} >Terms & Conditions</Text>
                      </TouchableOpacity>
                    </View>
                </View>
              <TouchableOpacity onPress={()=> navigation.navigate('VisitHistory')} style={{ marginBottom:20, width: "100%", height: 50, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", justifyContent: 'space-between', alignItems: "center", alignSelf:'center', flexDirection: "row", paddingHorizontal:10 }}>
                 <Text style={{ fontSize: 14, color: Style.secondryTextColor, fontFamily:'Poppins-SemiBold', }}>Employee Visit History</Text>
                 <Feather name="arrow-up-right" size={24} color={Style.placeHolderTextColor} />
              </TouchableOpacity>
              </ScrollView>
              <View style={{ marginBottom:20 }} ></View>
               <TouchableOpacity 
                onPress={() => {
                 Alert.alert(null, "Please confirm to logout!", [
                   {
                     text: "Cancel",
                     style: "cancel",
                   },
                   {
                     text: "Confirm",
                     onPress: () => {
                       logoutFun(); // ✅ Call the logout function here
                     },
                   },
                 ]);
               }}
               style={{ marginBottom:0, width: "100%", height: 50, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center", alignSelf:'center', flexDirection: "row" }}>
                 <View style={{ flex: 9 }}>
                   <Text style={{ fontSize: 14, color: "#DD3231", fontFamily:'Poppins-SemiBold', left: 10 }}>Log out</Text>
                 </View>
                 <View style={{ flex: 1 }}>
                   <Image source={require('../../assets/logOut.png')} resizeMode='contain' style={{ width: 20, height: 20 }} />
                 </View>
               </TouchableOpacity>
          </View>
        </View>
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
