import React, { useState, useEffect, useRef } from "react";
import { Alert, StatusBar, View, Text, TouchableOpacity, Animated, SafeAreaView, RefreshControl, Platform, ScrollView, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";
import { AntDesign } from "@expo/vector-icons";

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

export default function VisitHistory({ navigation }) {

    const dispatch = useDispatch();
    const [slideAnim] = useState(new Animated.Value(30));  
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false); 
    const [visitorHistory, setVisitorHistory] = useState([]);
    const logoutHandled = useRef(false);

    const visitorList = async()=>{
      if (logoutHandled.current) return;
      setLoading(true)
       let token = await AsyncStorage.getItem("token");
       if(!token) {
        navigation.navigate('Splash');
        return;
      }
     const myHeaders = new Headers();
     myHeaders.append("Authorization", "Bearer " + token);
     myHeaders.append("Content-Type", "application/json");
     
     const raw = JSON.stringify({});
     
     const requestOptions = {
       method: "POST",
       headers: myHeaders,
       body: raw,
       redirect: "follow"
     };
     
     fetch(`${BASE_URL}/client/visitor/history`, requestOptions)
      .then((response) => response.json())
       .then((result) => {
           if(result.statusCode === 200){
               setVisitorHistory(result?.data?.visitorData)
               setLoading(false);
           }else if (result.statusCode === 401) {
             if (!logoutHandled.current) {
               logoutHandled.current = true; // Flag to prevent multiple logouts
               showToast("Session expired. Please log in again.", () => {
                 dispatch(logout()); // Dispatch logout action when OK is pressed
                 navigation.navigate('Autologin'); // Navigate to autologin page
               });
             }
           }else{
               showToast(result.message);
               setLoading(false);
           }
       })
       .catch((error) => console.error(error))
       .finally(()=> setLoading(false));
    }

    useEffect(() => {
      visitorList();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []);  

    const onRefresh = () => {
      setRefresh(true);
      visitorList();
        setTimeout (()=>{
            setRefresh(false);
        },2000)
    }
        
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar translucent={false} backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center',paddingHorizontal:20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
           <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Visit History</Text>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex:1,}}>
           {
            loading?(
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            ):(
             visitorHistory.length>0?
              visitorHistory.map((item, index)=>{
                return(
                  <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 15 }} >
                    <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between' }} >
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{flex:1.5, fontSize: 12, fontFamily: "Poppins-SemiBold", color: Style.primaryTextColor }}>{item.name}</Text>
                       <View style={{ flex:1 }}>
                          <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Visit time/Date:</Text>
                          <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{moment(item.date).format("DD-MM-YYYY / hh:mm a")}</Text>
                       </View>
                    </View>
                    <View style={{ flexDirection:"row", gap:0, alignItems:'center' }} >
                      <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Departmemt: </Text>
                      <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{item.departmentName}</Text>
                    </View>
                    <View style={{ flexDirection:"row", gap:0, alignItems:'center', marginBottom:10 }} >
                      <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Reason: </Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{item.reason}</Text>
                    </View>
                    <View style={{ marginTop:5 }} >
                      {
                        item.updateByEmploye === true?
                        <View style={{ width:'70%', height:35, justifyContent:'center', alignItems:'center', backgroundColor:'#ffdddd', borderRadius:6 }} >
                          <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color:'#c32c2c' }} >Cancelled By Employee</Text>
                        </View>:
                        item.updateByClient === true?
                        <View style={{ width:'70%', height:35, justifyContent:'center', alignItems:'center', backgroundColor:item.status === "confirmed"?'#dbffd2':'#ffdddd', borderRadius:6 }} >
                          <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color:item.status === "confirmed"?'#34a32a':'#c32c2c' }} >{item.status === "confirmed"? 'Metting Successful': 'Cancelled By You'}</Text>
                        </View>:null
                      }
                    </View>
                  </View>
                )
              }):(
               <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                   No Data Found
               </Text>
              )
            )
           }
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}