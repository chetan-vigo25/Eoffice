import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, Alert, SafeAreaView, LayoutAnimation, UIManager, Platform, ScrollView, ActivityIndicator } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { AntDesign, Feather, Entypo } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function DigitalSign({ navigation }) {

  const dispatch = useDispatch();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState(null);   

  const [slideAnim] = useState(new Animated.Value(30));   

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access media library is required");
        return;
      }  

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });  

      if (!result.canceled) {
        const { uri, type } = result.assets[0];
        const fileName = uri.split('/').pop();
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setImage(uri);
        setImageName(fileName);
        // console.log("Selected Image Info:", fileInfo);
      } else {
        console.log("No image selected");
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };  

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
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Digital Signatures</Text>
        </View>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        {
          isLoading ?(
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ):
          (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
             <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor, padding:10 }}>{personalInfoData?.fullName || "No name available"}</Text>
               <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Signature</Text>
                   <View style={{ width:'100%', height:40,  borderRadius:5, flexDirection:'row', backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                      <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                        {
                          imageName == null ? 
                          <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:12 }}>{personalInfoData?.signatureData?.[0]?.name || "Signature not found"}</Text>:
                          <Text style={{ color:'#999', fontWeight:'500', fontSize:12 }}>{imageName}</Text>
                        }
                      </View>
                      <TouchableOpacity style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                         <Entypo name="attachment" size={20} color={Style.placeHolderTextColor} />
                      </TouchableOpacity>
                   </View>
                 </View>
                 <View>
                   <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Date</Text>
                   <View style={{ width:'100%', height:40, borderRadius:5, flexDirection:'row', backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                     <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                       <Text style={{ color:Style.placeHolderTextColor, fontWeight:'500', fontSize:12 }}>{moment(personalInfoData?.signatureData?.[0]?.createdAt).format('DD/MM/YYYY') || "No DOB available"}</Text>
                     </View>
                     <TouchableOpacity style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                        <Feather name="calendar" size={20} color={Style.placeHolderTextColor} />
                      </TouchableOpacity>
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
