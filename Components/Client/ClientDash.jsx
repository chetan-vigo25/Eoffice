
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StatusBar, ScrollView, Image, TouchableOpacity, Dimensions, BackHandler, ToastAndroid, Platform, Alert } from "react-native";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import moment from "moment";

import { useContacts } from '../../Context/Contact';
import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Feather, AntDesign } from "@expo/vector-icons";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function ClientDash({ navigation, route }) {
    
    const { userData } = route.params;
    const [invoiceData, setInvoiceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paidInvoices, setPaidInvoices] = useState([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);

    const dashData = [
        { id:1, screen: 'PersonalInfo', name:'Personal Information', cardColor:'#ff6968', img:require('../../assets/personIcon.png')},
        { id:2, screen: 'TaskManagement', name:'Task Management', cardColor:'#7454ff', img:require('../../assets/taskIcon.png')},
        { id:3, screen: 'InvoiceList', name:'Invoice', cardColor:'#ff8f61', img:require('../../assets/invoiceIcon.png')},
        { id:4, screen: 'TransactionList', name:'Transaction History', cardColor:'#2ac3ff', img:require('../../assets/transIcon.png')},
        { id:5, screen: 'AdvancedList', name:'Advance Management', cardColor:'#5a6aff', img:require('../../assets/ShoppingBag.png')},
        { id:6, screen: 'MyDocuments', name:'Download Documents', cardColor:'#73c2fb', img:require('../../assets/downloadIcon.png')},
    ]

    const navigateToScreen = (screen) => {
        navigation.navigate(screen);
    };

    const getInvoiceList = async () => {
        setLoading(true)
         let token = await AsyncStorage.getItem("token");
         const myHeaders = new Headers();
         myHeaders.append("Authorization", "Bearer " + token);
         myHeaders.append("Content-Type", "application/json");
    
         const raw = JSON.stringify({
          "text": "",
          "sort": true,
          "status": '',
          "departmentId": "",
          "isPagination": false,
          "date": '',
        });
    
         const requestOptions = {
           method: "POST",
           headers: myHeaders,
           body: raw,
           redirect: "follow"
         };
         
         fetch(`${BASE_URL}/client/invoice/list`, requestOptions)
         .then((response) => response.json())
          .then((result) => {
             if (result.statusCode === 200) {
                 const paidInvoicesData = result.data.docs.filter(invoice => invoice.status === "Paid");
                 const unpaidInvoicesData = result.data.docs.filter(invoice => invoice.status !== "Paid");
                 setPaidInvoices(paidInvoicesData || []);
                 setUnpaidInvoices(unpaidInvoicesData || []); 
                 setLoading(false);
             } else {
                 showToast(result.message);
                 setLoading(false);
             }
         })
         .catch((error) => console.error(error))
         .finally(() => setLoading(false));
      }

     const canExit = useRef(false);
      useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', _backHandler);
        return () => backHandler.remove();
     }, []);

      const _backHandler = () => {
        if (navigation.isFocused()) {
          if (canExit.current) {
            return false;
          } else {
            canExit.current = true;
            ToastAndroid.show('Double click to exit App.', ToastAndroid.SHORT);
            setTimeout(() => {
              canExit.current = false;
            }, 750);
            return true;
          }
        } else {
          return false;
        }
      };

      useEffect(()=>{
       getInvoiceList();
        setTimeout(()=>{
          getInvoiceList();
        },1000)
      },[])

      useFocusEffect(
        React.useCallback(() => {
          getInvoiceList();
        },[])
      );

    const _renderItem = ({ item, index }) => {
      return (
          <TouchableOpacity key={index} onPress={() => {navigation.navigate('TransDetail', { _id: item._id })}} style={{ width:'90%', backgroundColor:'#fff', borderRadius:6, elevation:3, }} >
              <View style={{ flexDirection:'row', gap:10, padding:10 }} >
                  <View style={{ width:60, height:60, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#00000020', borderRadius:6 }} >
                      <Image source={require('../../assets/DollarCoin.png')} resizeMode='contain' style={{ width:50, height:50 }} />
                  </View>
                  <View style={{ flex:1,}} >
                     <Text style={{ fontSize:12, fontFamily:'Poppins-SemiBold', color:Style.primaryTextColor }} >{item.invoiceNumber}</Text>
                     <Text style={{ fontSize:10, fontFamily:'Poppins-Medium', color:'#23a26d' }} >₹ {item.grandTotal}/-</Text>
                     <Text style={{ fontSize:10, fontFamily:'Poppins-Medium', color:Style.secondryTextColor }} >{moment(item.createdAt).format('DD-MM-YYYY')}</Text>
                  </View>
                  <View style={{ width:50, height:50, justifyContent:'center', alignItems:'flex-end', }} >
                     <AntDesign name="rightcircleo" size={26} color={Style.secondryTextColor} />
                  </View>
              </View>
              <View style={{ width:"85%", borderBottomWidth:3, borderColor:'#00000020' }} ></View>
              <View style={{ padding: 10 }} >
                <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.secondryTextColor }} >Reminder: Outstanding Balance</Text>
              </View>
          </TouchableOpacity>
      );
    };

    const getGreeting = () => {
        const currentHour = new Date().getHours();
         if (currentHour < 12) {
           return "Good Morning";
         } else if (currentHour < 18) {
           return "Good Afternoon";
         } else {
           return "Good Evening";
         }
    };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ebf1fd' }}>
      <StatusBar backgroundColor={'#ebf1fd'} barStyle='dark-content' />
        <View style={{ padding:20 }} >
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom: 20, }} >
                <View style={{ flex:3,}} >
                    <Text style={{ fontSize:16, fontFamily:'Poppins-SemiBold', color:Style.primaryTextColor, textTransform:'capitalize' }} >Hi, {userData?.fullName}!</Text>
                    <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:'#808080' }} >{getGreeting()}</Text>
                </View>
                <View style={{ flex:1, width:'100%', flexDirection:'row' }} >
                    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }} >
                        <TouchableOpacity onPress={()=> navigation.navigate('Support')} style={{ width:40, height:40, justifyContent:'center', alignItems:'center', }} >
                            <Image source={require('../../assets/headset.png')} resizeMode='contain' style={{ width:30, height:30 }} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }} >
                     <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ width:40, height:40, justifyContent:'center', alignItems:'flex-end', }} >
                        <Feather name="bell" size={30} color={Style.primaryTextColor} />
                     </TouchableOpacity>
                    </View>
                </View>
            </View>
            {unpaidInvoices.length === 0 ? (
                  <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 6, elevation: 3 }} >
                    <View style={{ flexDirection: 'row', gap: 10, padding: 10 }} >
                      <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00000020', borderRadius: 6, }} >
                        <Image source={require('../../assets/DollarCoin.png')} resizeMode='contain' style={{ width: 50, height: 50 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: Style.primaryTextColor }} >Pay your Dues</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#23a26d' }} >No Dues</Text>
                      </View>
                      <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-end' }} >
                        <AntDesign name="rightcircleo" size={26} color={Style.secondryTextColor} />
                      </View>
                    </View>
                    <View style={{ width: "85%", borderBottomWidth: 3, borderColor: '#00000020' }} ></View>
                    <View style={{ padding: 10 }} >
                      <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: Style.secondryTextColor }} >Invoice Paid: No Outstanding Balance</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Carousel
                      layout="default"
                      data={unpaidInvoices}
                      renderItem={_renderItem}
                      sliderWidth={windowWidth}
                      itemWidth={windowWidth}
                      onSnapToItem={(index) => setActiveSlide(index)}
                      autoplay={false}
                      loop={false}
                    />
                    <Pagination
                      dotsLength={unpaidInvoices.length}
                      activeDotIndex={activeSlide}
                      containerStyle={{ paddingVertical: 10 }}
                      dotStyle={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        marginHorizontal: -10,
                        backgroundColor: '#000'
                      }}
                      inactiveDotStyle={{
                        backgroundColor: '#ccc'
                      }}
                      inactiveDotOpacity={0.4}
                      inactiveDotScale={0.6}
                    />
                  </>
             )
           }
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:15 }} >
         <ScrollView showsVerticalScrollIndicator={true} style={{ flex:1, padding:5 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', flexWrap:'wrap' }} >
                {
                    dashData.map((item, index)=> {
                     const isDisabled = item.id === 5 && userData?.isGroupOwner === false;
                      const dashTitels = item.name.split(' ');
                        return (
                          // <TouchableOpacity key={index} onPress={() => navigateToScreen(item.screen)} style={{ width:'48%', justifyContent:'center', alignItems:'center', padding:15, backgroundColor:item.cardColor, marginBottom:10, borderRadius:6 }} >
                          <TouchableOpacity key={index} onPress={() => isDisabled ? showToast('Client has no rights') : navigateToScreen(item.screen)} style={{ width:'48%', justifyContent:'center', alignItems:'center', padding:15, backgroundColor:item.cardColor, marginBottom:10, borderRadius:6 }} >
                            <Image source={item.img} resizeMode='contain' style={{ width:40, height:40 }} />
                              {
                                  dashTitels.map((word, idx)=>{
                                      return(
                                        <Text key={idx} style={{ fontSize:12, fontFamily:'Poppins-Medium', color:'#fff', textAlign:'center' }} >
                                            {word.charAt(0).toUpperCase() + word.slice(1)} 
                                        </Text>
                                      )
                                  })  
                              }
                          </TouchableOpacity>
                        )
                    })
                }
            </View>
            <TouchableOpacity onPress={()=> navigation.navigate('AddAdvance')} style={{ width:'100%', height:45, backgroundColor:Style.headerBgColor, borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:10 }} >
              <Text style={{ fontSize:16, fontFamily:'Poppins-Medium', color:'#fff' }} ></Text>
            </TouchableOpacity>
         </ScrollView>
        </View>
    </SafeAreaView>
  )
}
