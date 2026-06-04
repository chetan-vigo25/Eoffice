import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, ScrollView, Modal, StyleSheet, Linking, UIManager, Platform, ToastAndroid, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import DatePicker from 'react-native-modern-datepicker';

import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import Style from "../../Style/Style";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function Statements({ navigation }) {
 
  const [scale] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [advanceData, setAdvanceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getAdvanceList = async () => {
    setLoading(true)
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": "",
      "isPagination": true,
      "startDate": "",
      "endDate": "",
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/advance/historylist`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
            // console.log("Advance History...", result.data.docs);
            setAdvanceData(result.data.docs);
            setFilteredData(result.data.docs);
            setLoading(false)
        }else{
          showToast(result.message);
          setLoading(false)
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }
  
  useEffect(() => {
    getAdvanceList();
  },[])

    const onRefresh = () => {
      setRefresh(true);
      getAdvanceList();
      setTimeout(() => {
          setRefresh(false);
      }, 2000);
  }

  const downloadPDF = (item) => {
    const { receiptPDFurl, status } = item;
    if (!receiptPDFurl) {
        showToast("pdf not generated.");
        return;
    }
    if (status === 'Paid') {
        Linking.openURL(receiptPDFurl)
            .catch((err) => console.error("An error occurred while opening the URL", receiptPDFurl));
    } else {
        showToast("This invoice is not marked as Paid.");
    }
};

 const handleSearch = (text) => {
   setSearchQuery(text);
   if (text.trim() === '') {
     setFilteredData(advanceData);
   } else {
     const results = advanceData.filter(item =>
       String(item.amount || '').toLowerCase().includes(text.toLowerCase())
     );
     setFilteredData(results);
   }
 };


  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff',fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Statements</Text>
        </View>
        <View style={{flexDirection: 'row',alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={handleSearch} style={{flex: 9, fontSize: 18,padding: 10,paddingLeft: 20,}} />
            <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={require('../../assets/oui_search.png')} resizeMode='contain'style={{ width: 20, height: 20,}} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center',alignItems:"flex-end" }}>
             <Feather name="bell" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
             <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex:1 }}>
               <View>
                {
                  loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                  ):(
                    filteredData.length > 0 ?(
                      filteredData.map((item, index) => {
                        return(
                            <View key={index} style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, marginBottom:10, padding:10 }} >
                              <View style={{ width:"100%", justifyContent:'space-between', alignItems:'center' }} >
                                 {/* <Text style={{ fontSize:16, fontFamily:'Lato-Medium', color:Style.headerBgColor }}>Advance {item.receiptNumber ? item.receiptNumber : "No receipt"} </Text> */}
                                  <TouchableOpacity onPress={() => downloadPDF(item)} style={{  width:30, height:30, justifyContent:'center', alignItems:'center', alignSelf:'flex-end', borderRadius:5 }} >
                                      <Image source={require('../../assets/pdfDownload.png')} style={{ width:30, height:30 }} />
                                  </TouchableOpacity>
                              </View>
                              <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                  <Text style={{flex:6, fontSize:12, fontFamily:'Lato-Medium', color:Style.secondryTextColor }}>{item.naration ? item.naration : 'no naration!'}</Text>
                                  <View style={{ flex:4 }} ></View>
                              </View>
                               <View style={{ flexDirection:'row', paddingVertical:5, alignItems:'center', }} >
                                  <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.secondryTextColor }}>Rs : </Text>
                                  <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:Style.secondryTextColor }}>{item.amount}/-</Text>
                               </View>
                               <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                 <View style={{flex:1, flexDirection:'row', alignItems:'center' }}>
                                    <Text style={{ fontSize:12, fontFamily:'Lato-SemiBold', color:Style.secondryTextColor }}>Status: </Text>
                                    <Text style={{ fontSize:12, fontFamily:'Lato-SemiBold', color:item.status ==='Paid'?'#85BD2A': '#E51E1E' }}>{item.status==='Paid'?'Paid': 'Failed'}</Text>
                                 </View>
                                 <View style={{flex:1, flexDirection:'row', justifyContent:'flex-end', alignItems:"center" }}>
                                    <Text style={{ fontSize:12, fontFamily:'Lato-Medium', color:Style.secondryTextColor }}>Date : </Text>
                                    <Text style={{ fontSize:12, fontFamily:'Lato-Medium', color:Style.secondryTextColor }}>{moment(item.createdAt).format('DD/MM/YYYY')}</Text>
                                 </View>
                               </View>
                            </View>
                         )
                      })
                    ):(
                      <Text style={{ fontSize: 18, fontFamily:'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                          No Data Found
                      </Text>
                    )
                  )
                }
               </View>
          </ScrollView>
        </Animated.View>
        <TouchableOpacity onPress={()=> navigation.navigate('AddAdvance')} style={{ width:'100%', height:45, backgroundColor:Style.headerBgColor, borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:10 }} >
          <Text style={{ fontSize:16, fontFamily:'Lato-Medium', color:'#fff' }} >+ Add Advance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}



