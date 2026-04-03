import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Linking, Animated, SafeAreaView, FlatList, RefreshControl, Alert, StyleSheet, LayoutAnimation, UIManager, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import { parseISO, isToday } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign } from "@expo/vector-icons";
import Style from "../../Style/Style";

const PAGE_SIZE = 10;

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function Notifikation({ navigation }) {
  const dispatch = useDispatch();
  const [scale] = useState(new Animated.Value(0));
  const [notifyData, setNotifyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
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
      .then(async(result) => {
        if (result.statusCode === 200) {
          setNotifyData(result?.data || []);
          setDisplayCount(PAGE_SIZE);
        }else if(result.statusCode === 401){
          showToast('Session expired, please login again');
          dispatch(logout());
          await AsyncStorage.removeItem('token');
          await AsyncStorage.clear();
          navigation.navigate('Autologin');
        }else{
          showToast(result.message);
          setIsLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }

  // Sort all notifications: today first (newest first), then older (newest first)
  const sortedNotifications = [...notifyData].sort((a, b) => {
    const aIsToday = isToday(parseISO(a.createdAt));
    const bIsToday = isToday(parseISO(b.createdAt));
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Only show `displayCount` items
  const visibleNotifications = sortedNotifications.slice(0, displayCount);
  const hasMore = displayCount < sortedNotifications.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  }, [hasMore, loadingMore]);

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
     <StatusBar barStyle='light-content' backgroundColor={ Style.headerBgColor } />

      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1 }}>Notifications</Text>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
           {isLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="large" color="#0000ff" />
              </View>
           ) : notifyData.length === 0 ? (
              <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                  No Data Found
              </Text>
           ) : (
              <FlatList
                data={visibleNotifications}
                keyExtractor={(item, index) => item._id || index.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}
                renderItem={({ item, index }) => {
                  // Show section header before first today item and first older item
                  const isCurrentToday = isToday(parseISO(item.createdAt));
                  const prevItem = index > 0 ? visibleNotifications[index - 1] : null;
                  const isPrevToday = prevItem ? isToday(parseISO(prevItem.createdAt)) : null;
                  let sectionHeader = null;

                  if (index === 0 && isCurrentToday) {
                    sectionHeader = 'Newest';
                  } else if (isPrevToday === true && !isCurrentToday) {
                    sectionHeader = 'Oldest';
                  } else if (index === 0 && !isCurrentToday) {
                    sectionHeader = 'Oldest';
                  }

                  return (
                    <>
                      {sectionHeader && (
                        <Text style={{ fontSize: 14, fontFamily: "Lato-Medium", color: Style.primaryTextColor, padding: 10 }}>
                          {sectionHeader}
                        </Text>
                      )}
                      {item.type === "invoice" ? (
                        <InvoiceCard data={item} />
                      ) : item.type === "task" ? (
                        <TaskCard data={item} />
                      ) : null}
                    </>
                  );
                }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#0000ff" />
                    </View>
                  ) : !hasMore && visibleNotifications.length > 0 ? (
                    <Text style={{ textAlign: 'center', paddingVertical: 15, fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                      No more notifications
                    </Text>
                  ) : null
                }
              />
           )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const TaskCard = ({ data }) => (
  <View style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, elevation:2, padding:15, marginBottom:10 }} >
     <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }} >
       <Text style={{ flex:1, fontSize:12, fontFamily:"Lato-Medium", color:Style.secondryTextColor }} >Task Name / Task Code</Text>
       <View>
       <Text style={{ flex:1, fontSize:10, fontFamily:"Lato-Medium", color:Style.secondryTextColor, textAlign:"right" }} >
         {moment(data.createdAt).fromNow()}
       </Text>
       <Text style={{ fontSize:10, fontWeight:"500", color:Style.secondryTextColor }}>{moment(data.createdAt).format('DD/MM/YYYY')}</Text>
       </View>
     </View>
     <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }} >
       <Text style={{ fontSize:14, fontFamily:"Lato-SemiBold", color:Style.primaryTextColor }} >
         {data?.data?.taskName || 'N/A'} / {data?.data?.code || 'N/A'}
       </Text>
     </View>
     <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:Style.secondryTextColor }} >
       {data.title}
     </Text>
  </View>
);
 
const InvoiceCard = ({ data }) => (
  <View style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, elevation:2, padding:15, marginBottom:10 }} >
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
      <Text style={{ fontSize:14, fontFamily:"Lato-Medium", color:Style.primaryTextColor  }}>{data?.data?.invoiceNumber}</Text>
      <Text style={{ fontSize:10, fontFamily:"Lato-Medium", color:Style.secondryTextColor }}>{moment(data.createdAt).fromNow()}</Text>
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
    <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:Style.secondryTextColor }} >
       {data.title}
     </Text>
  </View>
);