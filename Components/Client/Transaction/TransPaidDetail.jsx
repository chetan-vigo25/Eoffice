import React, { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Dimensions, PanResponder, StyleSheet, View, Text, SafeAreaView, Linking, TouchableOpacity, ScrollView, Image, ToastAndroid, ActivityIndicator } from 'react-native';
import { RadioButton } from 'react-native-paper';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import CryptoJS from "crypto-js";
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { useDispatch, useSelector } from 'react-redux';
import { DATA_ENCRYPT_DCRYPT_KEY } from "@env";

import BASE_URL from '../../../Urls/DomainUrl';
import Style from '../../../Style/Style';
import { AntDesign, Feather } from '@expo/vector-icons';

const SECRET = DATA_ENCRYPT_DCRYPT_KEY;

const { width } = Dimensions.get('window');
const lockWidth = width * 0.75;
const lockHeight = 60;
const smallgap = 4;
const finalPosition = lockWidth - lockHeight;

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function TransPaidDetail({ navigation, route }) {

    const { _id } = route.params;

    const dispatch = useDispatch();
    const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

    const [slideAnim] = useState(new Animated.Value(30)); 
    const [transData, setTransdata] = useState([]);
    const [razprPay_key, setRazprPay_key] = useState('');
    const [compData, setCompData] = useState([]);
    const [isloading, setIsLoading] = useState(false);

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []); 

    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
      const transDetail = async ()=>{
        setIsLoading(true)
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");
        
        const raw = JSON.stringify({
            "_id": _id
        });
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        
        fetch(`${BASE_URL}/client/invoice/view`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            if(result.statusCode === 200){
                // console.log("hsn",result.data)
                setTransdata(result.data);
            }else{
                showToast(result.message);
            }
          })
          .catch((error) => console.error(error))
          .finally(()=> setIsLoading(false))
      }

      const downloadPDF = () => {
          const { invoiceURL, status } = transData;
          if (!invoiceURL) {
              showToast("Invoice not generate.");
              return;
          }
          if (status === 'Paid') {
              Linking.openURL(invoiceURL)
                  .catch((err) => console.error("An error occurred while opening the URL", invoiceURL));
          } else {
              Alert.alert("Download Not Allowed", "This invoice is not marked as Paid.");
          }
      };

     useEffect(() => {
       transDetail();
       dispatch(personalInfo());
     }, [dispatch]);

    return (
        <SafeAreaView style={{flex:1, backgroundColor:Style.headerBgColor }}>
            <View style={{ paddingHorizontal:20 }}>
              <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
                 <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
                    <AntDesign name="arrowleft" size={24} color="#fff" />
                 </TouchableOpacity>
                <Text style={{color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Details</Text>
              </View>
            </View>
            <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
                 <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
                   <Text style={{ fontSize:18, fontFamily: 'Poppins-Medium', color:Style.headerBgColor }}>Invoice #{transData.invoiceNumber}</Text>
                     <TouchableOpacity onPress={downloadPDF} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                        <Feather name="download" size={24} color={Style.placeHolderTextColor} />
                     </TouchableOpacity>
                 </View>
                 {
                    isLoading ?
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <ActivityIndicator size="large" color={Style.headerBgColor} />
                    </View>:
                    <View style={{  }} >
                           <View>
                            <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }}>
                              <View style={{ width:"100%" }} >
                                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                                    <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.headerBgColor }}>{transData?.taskName}</Text>
                                     <View  style={{ width:100, backgroundColor:'#85BD2A', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                         <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicbgColor }}>Paid</Text>
                                     </View>
                                  </View> 
                                  <View style={{ flexDirection:'row' }} >
                                     <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.headerBgColor }}>Hsn No.: </Text>
                                     {/* <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.secondryTextColor }}>{transData?.clientCompletedTaskData[0]?.HSNCode}</Text> */}
                                  </View>
                                  <View style={{ flexDirection:'row' }} >
                                     <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.headerBgColor }}>Amount to be paid: </Text>
                                     <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.secondryTextColor }}>{transData.grandTotal}/-</Text>
                                  </View>
                              </View>
                              <View style={{ width:'100%', backgroundColor:Style.inputBgColor, marginTop:10, borderRadius:10, padding:10 }} >
                               <View style={{ flexDirection:'row', paddingVertical:10 }} >
                                   <View style={{ flex:1, justifyContent:'center', borderRightWidth:1.5, borderColor:Style.placeHolderTextColor }} >
                                       <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.placeHolderTextColor }}>Issued On</Text>
                                       <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.headerBgColor  }}>{moment(transData?.createdAt).format('DD/MM/YYYY')}</Text>
                                   </View>
                                   <View style={{ flex:1, justifyContent:'center', alignItems:'center', }} >
                                       <View>
                                           <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.placeHolderTextColor }}>Paid On</Text>
                                           <Text style={{ fontSize:16, fontFamily: 'Poppins-Medium', color:Style.headerBgColor }}>{moment(transData?.paymentHistory?.updatedAt).format('DD/MM/YYYY')}</Text>
                                       </View>
                                   </View>
                               </View>
                              </View>
                            </View>
                            <View style={{ width:'100%', backgroundColor:Style.basicbgColor, marginTop:10, borderRadius:10, padding:10, borderWidth:1, borderColor:Style.secondaryButtonColor }} >
                                <View style={{ width:'100%', height:50, backgroundColor:Style.headerBgColor, borderRadius:10, justifyContent:'center', alignItems:'center' }} >
                                    <Text style={{fontSize:16, fontFamily: 'Poppins-Medium', color:"#fff"}} >Payment Detail</Text>
                                </View>
                                <View style={{ marginTop:20 }} >
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Transaction ID</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.razorpayPaymentId}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Time</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.paymentOBJ?.created_at}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Method</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.paymentOBJ?.method}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>To</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>{transData?.paidTo?.fullName}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10, borderBottomWidth:1, borderStyle:'dashed', borderColor:Style.secondryTextColor}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>From</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>{transData?.paidBy?.fullName}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Amount</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:Style.basicTextColor }}>INR {transData?.paymentHistory?.paymentOBJ?.notes.amount}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Status</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Poppins-Medium', color:transData.status === 'Paid'?'#85BD2A':'#E51E1E', backgroundColor:transData.status === 'Paid'?'#85BD2A20':'#E51E1E10', paddingHorizontal:15, padding:4, borderRadius:50 }}>{transData.status === 'Paid'?'Success':'Failed'}</Text>
                                   </View>
                                </View>
                            </View>
                           </View>
                 </View>
                 }
              </ScrollView>
            </Animated.View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 0,
        backgroundColor:'#eee',
        height:100,
        width:'100%',
    },
    lockContainer: {
        height: lockHeight,
        width: lockWidth,
        borderRadius: lockHeight,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    txt: {
        fontSize: 14,
        letterSpacing: 2,
        fontWeight: '600'
    },
    bar: {
        position: 'absolute',
        height: lockHeight - (smallgap * 2),
        width: lockHeight - (smallgap * 2),
        backgroundColor: '#074173',
        borderRadius: lockHeight,
        left: smallgap,
        elevation: 1,
        justifyContent: "center",
        alignItems: 'center'
    }
});
