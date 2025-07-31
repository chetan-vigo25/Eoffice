import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, SafeAreaView, RefreshControl, Alert, Platform, ScrollView, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function Events({ navigation }) {

    const [slideAnim] = useState(new Animated.Value(30));  
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false); 
    const [visitorData, setVisitorData] = useState([]);
    const [newsData, setNewsData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [holidayData, setHolidayData] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []);  

    const getViditorList = async()=>{
      setLoading(true)
      let token = await AsyncStorage.getItem("token");
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
        .then((result) => {
            if(result.statusCode === 200){
              // console.log("visitor", result.data)
                setVisitorData(result?.data?.visitorData);
                setEventData(result?.data?.eventData);
                setHolidayData(result?.data?.holidayData);
                setNewsData(result?.data?.newsData);
                setLoading(false);
            }else{
                showToast(result.message);
                setLoading(false);
            }
        })
        .catch((error) => console.error(error))
        .finally(()=> setLoading(false));
    }
    
     const submitStatus = async(_id, status)=>{
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");
        
        const raw = JSON.stringify({
          "_id": _id,
          "status": status
        });
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        
        fetch(`${BASE_URL}/client/visitor/status`, requestOptions)
         .then((response) => response.json())
          .then((result) => {
            if(result.statusCode === 200){
                showToast(result.message)
                setEditingItemId(null);
                getViditorList();
            }else{
                showToast(result.message);
            }
          })
          .catch((error) => console.error(error))
     }

    useEffect(()=>{
        getViditorList();
    },[])

    const onRefresh = () => {
        setRefresh(true);
        getViditorList();
        setTimeout (()=>{
            setRefresh(false);
        },2000)
    }
        
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ width: '100%', marginTop: 0, padding:20 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', }}>Calendar</Text>
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
                    <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, padding:10 }}>Employee Visit</Text>
                 {
                      visitorData.length>0?(
                           visitorData.map((item, index)=>{
                               return(
                                   <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 10 }} >
                                       <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between' }} >
                                         <Text numberOfLines={1} ellipsizeMode="tail" style={{flex:1.5, fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.primaryTextColor }}>{item.name}</Text>
                                          <View style={{ flex:1 }}>
                                             <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Visit time/Date:</Text>
                                             <Text style={{ fontSize: 10, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{moment(item.date).format('DD-MM-YYYY/ hh:mm a')}</Text>
                                          </View>
                                       </View>
                                       <View style={{ flexDirection:"row", gap:0, alignItems:'center' }} >
                                         <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Departmemt: </Text>
                                         <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{item.departmentName}</Text>
                                       </View>
                                       <View style={{ flexDirection:"row", gap:0, alignItems:'center', marginBottom:10 }} >
                                         <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#5e6366" }}>Reason: </Text>
                                         <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor }}>{item.reason}</Text>
                                       </View>
                                       {item.updateByEmploye === true ? (
                                         <View style={{ width: '70%', height: 40, backgroundColor: "#ffdddd", alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                           <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#c32c2c" }}>Cancelled by Employee</Text>
                                         </View>
                                       ) : item.updateByClient === true ? (
                                         editingItemId === item._id ? (
                                           <View style={{ flexDirection: "row", gap: 20, alignItems: 'center' }}>
                                             <TouchableOpacity onPress={() => submitStatus(item._id, 'confirmed')} style={{ paddingHorizontal: 30, height: 40, backgroundColor: Style.headerBgColor, alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                               <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#fff" }}>Confirm</Text>
                                             </TouchableOpacity>
                                             <TouchableOpacity onPress={() => submitStatus(item._id, 'denied')} style={{ paddingHorizontal: 30, height: 40, backgroundColor: "#ffdddd", alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                               <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#c32c2c" }}>Deny</Text>
                                             </TouchableOpacity>
                                           </View>
                                         ) : (
                                           <View style={{ flexDirection: "row", gap: 20, alignItems: 'center' }}>
                                             <TouchableOpacity style={{ paddingHorizontal: 30, height: 40, backgroundColor: item.status === 'confirmed' ? '#dbffd2' : '#ffdddd', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                               <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: item.status === 'confirmed' ? '#34a32a' : '#c32c2c' }}>{item.status === 'confirmed' ? 'Confirmed' : 'Denied'}</Text>
                                             </TouchableOpacity>
                                             <Text onPress={() => item.isRemindMe !== true && setEditingItemId(item._id)} style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor, opacity: item.isRemindMe ? 0.5 : 1, }}>Change in mind?</Text>
                                           </View>
                                         )
                                       ) : (
                                         <View style={{ flexDirection: "row", gap: 20, alignItems: 'center' }}>
                                           <TouchableOpacity onPress={() => submitStatus(item._id, 'confirmed')} style={{ paddingHorizontal: 30, height: 40, backgroundColor: Style.headerBgColor, alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                             <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#fff" }}>Confirm</Text>
                                           </TouchableOpacity>
                                           <TouchableOpacity onPress={() => submitStatus(item._id, 'denied')} style={{ paddingHorizontal: 30, height: 40, backgroundColor: "#ffdddd", alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                                             <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#c32c2c" }}>Deny</Text>
                                           </TouchableOpacity>
                                         </View>
                                       )}
                                   </View>
                               )
                           })
                        ):(
                        <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                            No Data Found
                        </Text>
                     )
                 }
                  <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, padding:10 }}>Clients News</Text>
                 {
                     newsData.length > 0 ? (
                      newsData.map((item, index) => {
                          return (
                            <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', gap:10, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text style={{ fontSize: 14, flex:6, fontFamily: "Poppins-Nedium", color: Style.primaryTextColor }}>
                                        {item.title}
                                    </Text>
                                    <Text style={{ flex:4, fontSize: 12, fontFamily: "Poppins-Medium", color: Style.secondryTextColor }}>
                                        {moment(item.createdAt).fromNow()}
                                        {/* {console.log("test date",moment(item.createdAt).format('DD-MM-YYYY/ hh:mm a'))} */}
                                    </Text>
                                </View>
                            </View>
                          );
                      })
                     ) : (
                      <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                         No Data Found
                      </Text>
                     )
                 }
                  <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, padding:10 }}>Clients Events</Text>
                 {
                     eventData.length > 0 ? (
                      eventData.map((item, index) => {
                           return (
                            <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.primaryTextColor }}>
                                        {item.title}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: Style.secondryTextColor }}>
                                        {moment(item.createdAt).fromNow()}
                                    </Text>
                                </View>
                            </View>
                           );
                       })
                      ) : (
                        <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                          No Data Found
                        </Text>
                      )
                 }
                  <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, padding:10 }}>Office Holidays</Text>
                  {
                     holidayData.length > 0 ? (
                      holidayData.map((item, index) => {
                           return (
                               <View key={index} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 10 }}>
                                   <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                       <Text style={{ fontSize: 14, fontFamily: "Poppins-SemiBold", color: Style.primaryTextColor }}>
                                           {item.name}
                                       </Text>
                                       <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: Style.secondryTextColor }}>
                                           {moment(item.createdAt).fromNow()}
                                       </Text>
                                   </View>
                                   <Text style={{ fontSize: 12, fontFamily: "Poppins-SemiBold", color: Style.secondryTextColor,marginBottom: 5 }}>{moment(item.date).format("DD/MM/YYYY")}</Text>
                                   <Text style={{ fontSize: 10, fontFamily: "Poppins-Medium", color: Style.secondryTextColor }}>{item.description}</Text>
                               </View>
                           );
                       })
                      ) : (
                          <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                              No Data Found
                          </Text>
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