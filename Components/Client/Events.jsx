import React, { useState, useEffect, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, RefreshControl, LayoutAnimation, UIManager, Platform, ScrollView, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function Events({ navigation }) {
    const dispatch = useDispatch();
    const [slideAnim] = useState(new Animated.Value(30));  
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false); 
    const [visitorData, setVisitorData] = useState([]);
    const [newsData, setNewsData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [holidayData, setHolidayData] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const logoutHandled = useRef(false);

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []);  

     useEffect(()=>{
         getViditorList();
     },[])

    const getViditorList = async()=>{
      if (logoutHandled.current) return;
       setLoading(true)
        let token = await AsyncStorage.getItem("token");
        if(!token) {
         navigation.navigate('Autologin');
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
      
      fetch(`${BASE_URL}/client/visitor/calendar`, requestOptions)
       .then((response) => response.json())
        .then(async(result) => {
          if(result.statusCode === 200){
              setVisitorData(result?.data?.visitorData);
              setEventData(result?.data?.eventData);
              setHolidayData(result?.data?.holidayData);
              setNewsData(result?.data?.newsData);
              setLoading(false);
          } else if(result.statusCode === 401){
              dispatch(logout());
              await AsyncStorage.removeItem('token');
              await AsyncStorage.clear();
              navigation.navigate('Autologin');
          } else{
              showToast(result.message);
              setLoading(false);
          }
        })
        .catch((error) => console.error(error))
        .finally(()=> setLoading(false));
    }
    
    const onRefresh = () => {
        setRefresh(true);
        getViditorList();
        setTimeout (()=>{
            setRefresh(false);
        },2000)
    }
        
  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ width: '100%', padding:20 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', }}>Calendar</Text>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
       <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex:1,}}>
        {
            loading?(
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ):
            (
                <>
                 {/* {
                   newsData.length > 0 && (
                    <>
                       <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor, padding:10 }}>Clients News</Text>
                      {
                        newsData.map((item, index) => (
                          <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', gap:10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text style={{ flex:6, fontSize: 14, fontFamily: "Lato-SemiBold", color: Style.primaryTextColor }}>
                                        {item.title}
                                    </Text>
                                    <Text style={{ flex:4, fontSize: 12, fontFamily: "Lato-Medium", color: Style.secondryTextColor }}>
                                        {moment(item.createdAt).fromNow()}
                                    </Text>
                                </View>
                            </View>
                        ))
                      }
                      </>
                   )
                 } */}
                {/* {
                  eventData.length > 0 && (
                    <>
                      <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor, padding: 10 }}>
                        Clients Events
                      </Text>                

                      {eventData.map((item, index) => (
                        <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 10,}} >
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 5,}} >
                            <Text style={{ flex: 6, fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>
                              {item.title}
                            </Text>
                            <Text style={{ flex: 4, fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                              {moment(item.createdAt).fromNow()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )
                } */}
                {
                    holidayData.length > 0 && (
                      <>
                        <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor, padding:10 }}>Office Holidays</Text>
                            {holidayData.map((item, index) => (
                                <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', gap:10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <Text style={{ flex:6, fontSize: 14, fontFamily: "Lato-SemiBold", color: Style.primaryTextColor }}>
                                            {item.name}
                                        </Text>
                                        <Text style={{ flex:4, fontSize: 12, fontFamily: "Lato-Medium", color: Style.secondryTextColor }}>
                                            {moment(item.createdAt).fromNow()}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontFamily: "Lato-SemiBold", color: Style.secondryTextColor,marginBottom: 5 }}>{moment(item.date).format("DD/MM/YYYY")}</Text>
                                    <Text style={{ fontSize: 10, fontFamily: "Lato-Medium", color: Style.secondryTextColor }}>{item.description}</Text>
                                </View>
                              ))}
                      </>
                  )
                }
                </>
            )
        }
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
