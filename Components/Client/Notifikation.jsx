import React, { useState, useEffect, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Linking, Animated, SafeAreaView, ScrollView, RefreshControl, StyleSheet, Alert, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import { parseISO, isToday } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign } from "@expo/vector-icons";
import Style from "../../Style/Style";

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000); // Slight delay to simulate user reading toast
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

export default function Notifikation({ navigation }) {
 
  const dispatch = useDispatch();
  const [scale] = useState(new Animated.Value(0)); 
  const [notifyData, setNotifyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getNotification = async () => {
    if (logoutHandled.current) return;
       setIsLoading(true)
       let token = await AsyncStorage.getItem("token");
       if(!token) {
        navigation.navigate('Autologin');
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
    
    fetch(`${BASE_URL}/client/notification/history`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          setNotifyData(result?.data || []);
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
          setIsLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }

  const todayNotifications = notifyData
   .filter((n) => isToday(parseISO(n.createdAt)))
   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const olderNotifications = notifyData
   .filter((n) => !isToday(parseISO(n.createdAt)))
   .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  useEffect(()=>{
    getNotification();
  },[])
  
  const onRefresh = () => {
    setRefresh(true);
    getNotification();
    setTimeout(() => {
        setRefresh(false);
    }, 2000);
}

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar translucent={false} barStyle='light-content' backgroundColor={ Style.headerBgColor } />

      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1 }}>Notifications</Text>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
           <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex:1, }}>
              {
                isLoading ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="large" color="#0000ff" />
                  </View>
                ):(
                  notifyData.length > 0 ? (
                    <>
                    {todayNotifications.length > 0 && (
                      <>
                        <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: Style.primaryTextColor, padding: 10 }}>
                          Newest
                        </Text>
                        {todayNotifications.map((item, index) => {
                          if (item.type === "invoice") {
                            return <InvoiceCard key={item._id || index} data={item} />;
                          } else if (item.type === "task") {
                            return <TaskCard key={item._id || index} data={item} />;
                          } else {
                            return null;
                          }
                        })}
                      </>
                      )}
      
                      {olderNotifications.length > 0 && (
                        <>
                          <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: Style.primaryTextColor, padding: 10 }}>
                            Oldest
                          </Text>
                          {olderNotifications.map((item, index) => {
                            if (item.type === "invoice") {
                              return <InvoiceCard key={item._id || index} data={item} />;
                            } else if (item.type === "task") {
                              return <TaskCard key={item._id || index} data={item} />;
                            } else {
                              return null;
                            }
                          })}
                        </>
                      )}
                    </>
                  ):(
                    <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                        No Data Found
                    </Text>
                  )
                )
              }
           </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}


const TaskCard = ({ data }) => (
  <View style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, elevation:2, padding:15, marginBottom:10, borderWidth: .5, borderColor: '#e0e0e0' }} >
     <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }} >
       <Text style={{ flex:1, fontSize:12, fontFamily:"Poppins-Medium", color:Style.secondryTextColor }} >Task Name / Task Code</Text>
       <View>
       <Text style={{ flex:1, fontSize:10, fontFamily:"Poppins-Medium", color:Style.secondryTextColor, textAlign:"right" }} >
         {moment(data.createdAt).fromNow()}
       </Text>
       <Text style={{ fontSize:10, fontWeight:"500", color:Style.secondryTextColor }}>{moment(data.createdAt).format('DD/MM/YYYY')}</Text>
       </View>
     </View>
     <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }} >
       <Text style={{ fontSize:14, fontFamily:"Poppins-SemiBold", color:Style.primaryTextColor }} >
         {data?.data?.taskName || 'N/A'} / {data?.data?.code || 'N/A'}
       </Text>
     </View>
     <Text style={{ fontSize:12, fontFamily:"Poppins-Medium", color:Style.secondryTextColor }} >
       {data.title}
     </Text>
  </View>
);

const InvoiceCard = ({ data }) => (
  <View style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, elevation:2, padding:15, marginBottom:10, borderWidth: .5, borderColor: '#e0e0e0' }} >
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
      <Text style={{ fontSize:14, fontFamily:"Poppins-Medium", color:Style.primaryTextColor  }}>{data?.data?.invoiceNumber}</Text>
      <Text style={{ fontSize:10, fontFamily:"Poppins-Medium", color:Style.secondryTextColor }}>{moment(data.createdAt).fromNow()}</Text>
    </View>
    <View style={{ flexDirection:'row', justifyContent:"space-between", paddingVertical:5 }}>
       <View style={{ flex:1, flexDirection:"row", alignItems:'center' }} >
        <Text style={{ fontSize:14, fontWeight:"600", color:Style.secondryTextColor }}>Rs : </Text>
        <Text style={{ fontSize:14, fontWeight:"500", color:Style.secondryTextColor }}>{data?.data?.grandTotal}/-</Text>
       </View>
       <View style={{ flex:1, }} >
       <View style={{ flexDirection:'row', alignItems:'center', justifyContent:"flex-end" }}>
          <Text style={{ fontSize:14, fontWeight:"600", color:Style.secondryTextColor, textAlign:'right' }}>Date : </Text>
          <Text style={{ fontSize:12, fontWeight:"500", color:Style.secondryTextColor }}>{moment(data.createdAt).format('DD/MM/YYYY')}</Text>
       </View>
       </View>
    </View>
    <Text style={{ fontSize:12, fontFamily:"Poppins-Medium", color:Style.secondryTextColor }} >
       {data.title}
     </Text>
  </View>
);