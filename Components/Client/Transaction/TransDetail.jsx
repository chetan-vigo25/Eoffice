import React, { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Dimensions, PanResponder, StyleSheet, View, Text, Linking, TouchableOpacity, ScrollView, Image, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import CryptoJS from "crypto-js";
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { useDispatch, useSelector } from 'react-redux';
import { DATA_ENCRYPT_DCRYPT_KEY } from "@env";
import { useFocusEffect } from '@react-navigation/native';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../../Urls/DomainUrl';
import Style from '../../../Style/Style';
import { AntDesign, Feather } from '@expo/vector-icons';

const SECRET = DATA_ENCRYPT_DCRYPT_KEY;

const { width } = Dimensions.get('window');

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function TransDetail({ navigation, route }) {

    const { _id } = route.params;

    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

    const [slideAnim] = useState(new Animated.Value(30));
    const [transData, setTransdata] = useState([]);
    const [razprPay_key, setRazprPay_key] = useState('');
    const [compData, setCompData] = useState([]);
    const [isloading, setIsLoading] = useState(false);
    const [dataFetched, setDataFetched] = useState(false);
    const logoutHandled = useRef(false);

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []); 

      const transDetail = async ()=>{
        if (logoutHandled.current) return;
         setIsLoading(true)
         let token = await AsyncStorage.getItem("token");
         if(!token) {
          navigation.navigate('Autologin');
          return;
        }
        setDataFetched(false);
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
          .then(async(result) => {
            if(result.statusCode === 200){
                // console.log("trans detail...",result.data);
                setTransdata(result.data);
                setDataFetched(true);
            }else if(result.statusCode === 401){
              showToast('Session expired, please login again');
              dispatch(logout());
              await AsyncStorage.removeItem('token');
              await AsyncStorage.clear();
              navigation.navigate('Autologin');
              setIsLoading(false)
            } else{
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
             showToast("This invoice is not marked as Paid.");
          }
      };

      const decryptData = (cipherText) => {
          const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
          return originalText;
      };

    const keyFetch = async () => {
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");
    
        const raw = "";
    
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
    
        fetch(`${BASE_URL}/client/auth/profilekey`, requestOptions)
          .then((response) => response.json())
            .then((result) => {
                if(result.statusCode === 200){
                    const RAZOR_PAY_KEY = decryptData(result.data.privateKey);
                    setRazprPay_key(RAZOR_PAY_KEY);
                    // console.log("saf",RAZOR_PAY_KEY);
                    setCompData(result.data.userId);
                } else {
                    showToast(result.message);
                }
            })
            .catch((error) => console.error(error));
    }

    const CreateOrder = async () =>{
       let token = await AsyncStorage.getItem("token");
       const myHeaders = new Headers();
       myHeaders.append("Authorization", "Bearer " + token);
       myHeaders.append("Content-Type", "application/json");

       const raw = JSON.stringify({
         "invoiceId": transData._id,
         "amount": transData.grandTotal,
         "groupAdvanceId": null,
       });
       
       const requestOptions = {
         method: "POST",
         headers: myHeaders,
         body: raw,
         redirect: "follow"
       };

       fetch(`${BASE_URL}/client/invoice/payment/order`, requestOptions)
        .then((response) => response.json())
         .then((result) => {
            if(result.statusCode === 200){
                CheckoutR(result.data.id)
            }else{
                showToast(result.message);
            }
         })
        .catch((error) => console.error(error));
    }

    const CheckoutR = (order_id) => {
      if (!razprPay_key) {
         showToast("Payment method not allow please contact to support");
        return;
      }
      var options = {
        description: 'Credits towards consultation',
        image: compData?.companyProfile?.logo,
        currency: 'INR',
        key: razprPay_key,
        // amount: '5000',
        name: compData?.fullName,
        order_id: order_id,
        prefill: {
          email: personalInfoData?.email,
          contact: personalInfoData?.mobile?.number || '',
          name: personalInfoData?.fullName || ''
        },
        theme: {color: Style.headerBgColor}
      }
        RazorpayCheckout.open(options).then((data) => {
            // handle success
            // console.log("CheckoutR", data)
            verifyPayment(data)
            transDetail();
            // showToast("SUCCESS", ToastAndroid.SHORT);
          }).catch((error) => {
            // handle failure
             console.log(error);
             showToast("CANCELLED", ToastAndroid.SHORT);
          });
    }

    const verifyPayment = async (data)=>{
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
          "razorpay_order_id": data.razorpay_order_id,
          "razorpay_payment_id": data.razorpay_payment_id,
          "razorpay_signature": data.razorpay_signature
        });
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        fetch(`${BASE_URL}/client/invoice/payment/verify`, requestOptions)
         .then((response) => response.json())
          .then((result) => {
            if(result.statusCode === 200){
                transDetail();
                navigation.navigate('TransferSuccess', { reciptData: result.data });
                showToast(result.message);
                // showToast("Payment Success", ToastAndroid.SHORT);
            }else{
                showToast(result.message);
            }    
          })
          .catch((error) => console.error(error));
    }

     useEffect(() => {
       setDataFetched(false);
       transDetail();
       keyFetch();
       dispatch(personalInfo());
     }, [dispatch,]);

     useFocusEffect(
       React.useCallback(() => {
         transDetail();
       }, [_id])
     );

    return (
        <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
            <View style={{ paddingHorizontal:20 }}>
              <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
                 <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
                    <AntDesign name="arrowleft" size={24} color="#fff" />
                 </TouchableOpacity>
                <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Details</Text>
              </View>
            </View>
            <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} style={{ flex:1 }}>
                 <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
                   <Text style={{ fontSize:18, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>{transData.type === "Advance"? "Advance":"Invoice"}</Text>
                     <TouchableOpacity onPress={downloadPDF} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                        <Feather name="download" size={24} color={Style.placeHolderTextColor} />
                     </TouchableOpacity>
                 </View>
                 {
                    !dataFetched ?
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <ActivityIndicator size="large" color={Style.headerBgColor} />
                    </View>:
                    <View style={{  }} >
                    {
                        transData.status === 'Paid'?(
                           <View>
                            <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }}>
                              <View style={{ width:"100%" }} >
                                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                                    <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>{transData.type === "Advance"?`Receipt No. ${transData.receiptNumber}`:`Invoice # ${transData.invoiceNumber}`}</Text>
                                     <View  style={{ width:100, backgroundColor:'#85BD2A', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                         <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicbgColor }}>Paid</Text>
                                     </View>
                                  </View> 
                                  {/* <View style={{ flexDirection:'row' }} >
                                     <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>Hsn No.: </Text>
                                     <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.secondryTextColor }}>{transData?.clientCompletedTaskData[0]?.HSNCode}</Text>
                                  </View> */}
                                  <View style={{ flexDirection:'row' }} >
                                     <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>Amount to be paid: </Text>
                                     <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.secondryTextColor }}>{transData.type ==="Advance"?transData.amount:transData.grandTotal}/-</Text>
                                  </View>
                              </View>
                              <View style={{ width:'100%', backgroundColor:Style.inputBgColor, marginTop:10, borderRadius:10, padding:10 }} >
                               <View style={{ flexDirection:'row', paddingVertical:10 }} >
                                   <View style={{ flex:1, justifyContent:'center', borderRightWidth:1.5, borderColor:Style.placeHolderTextColor }} >
                                       <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.placeHolderTextColor }}>Issued On</Text>
                                       <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor  }}>{moment(transData?.createdAt).format('DD/MM/YYYY')}</Text>
                                   </View>
                                   <View style={{ flex:1, justifyContent:'center', alignItems:'center', }} >
                                       <View>
                                           <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.placeHolderTextColor }}>Paid On</Text>
                                           <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>{moment(transData?.paymentHistory?.updatedAt).format('DD/MM/YYYY')}</Text>
                                       </View>
                                   </View>
                               </View>
                              </View>
                            </View>
                            <View style={{ width:'100%', backgroundColor:Style.basicbgColor, marginTop:10, borderRadius:10, padding:10, borderWidth:1, borderColor:Style.secondaryButtonColor }} >
                                <View style={{ width:'100%', height:50, backgroundColor:Style.headerBgColor, borderRadius:10, justifyContent:'center', alignItems:'center' }} >
                                    <Text style={{fontSize:16, fontFamily: 'Lato-Medium', color:"#fff"}} >Payment Detail</Text>
                                </View>
                                <View style={{ marginTop:20 }} >
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Transaction ID</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.razorpayPaymentId}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Time</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.paymentOBJ?.created_at}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Method</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>{transData?.paymentHistory?.paymentOBJ?.method}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>To</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>{transData?.paidTo?.fullName}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10, borderBottomWidth:1, borderStyle:'dashed', borderColor:Style.secondryTextColor}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>From</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>{transData?.paidBy?.fullName}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Amount</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicTextColor }}>INR {transData?.paymentHistory?.paymentOBJ?.notes.amount}</Text>
                                   </View>
                                   <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                                      <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Status</Text>
                                      <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:transData.status === 'Paid'?'#85BD2A':'#E51E1E', backgroundColor:transData.status === 'Paid'?'#85BD2A20':'#E51E1E10', paddingHorizontal:15, padding:4, borderRadius:50 }}>{transData.status === 'Paid'?'Success':'Failed'}</Text>
                                   </View>
                                </View>
                            </View>
                           </View>
                        ):(
                         <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }}>
                           <View style={{ width:"100%" }} >
                               <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center' }}>
                                    <Text style={{ flex:8, fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>{transData.type === "Advance"?`Receipt No. ${transData.receiptNumber}`:`Invoice # ${transData.invoiceNumber}`}</Text>
                                     <View style={{ flex:2, width:100, backgroundColor:'#E51E1E', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                         <Text style={{ fontSize:14, fontFamily: 'Lato-Medium', color:Style.basicbgColor }}>Unpaid</Text>
                                     </View>
                                  </View>
                               {/* <View style={{ flexDirection:'row' }} >
                                  <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>Hsn No.: </Text>
                                  <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.secondryTextColor }}>{transData?.clientCompletedTaskData[0]?.HSNCode}</Text>
                               </View> */}
                               <View style={{ flexDirection:'row' }} >
                                  <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>Amount to be paid: </Text>
                                  <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.secondryTextColor }}>{transData.grandTotal}/-</Text>
                               </View>
                           </View>
                           <View style={{ width:'100%', backgroundColor:Style.inputBgColor, marginTop:10, borderRadius:10, padding:10 }} >
                            <View style={{ flexDirection:'row', paddingVertical:10 }} >
                                <View style={{ flex:1, justifyContent:'center', borderRightWidth:1.5, borderColor:Style.placeHolderTextColor }} >
                                    <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.placeHolderTextColor }}>Issued On</Text>
                                    <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor  }}>{moment(transData?.createdAt).format('DD/MM/YYYY')}</Text>
                                </View>
                                <View style={{ flex:1, justifyContent:'center', alignItems:'center', }} >
                                    <View>
                                        <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.placeHolderTextColor }}>Due On</Text>
                                        <Text style={{ fontSize:16, fontFamily: 'Lato-Medium', color:Style.headerBgColor }}>{moment(transData?.createdAt).format('DD/MM/YYYY')}</Text>
                                    </View>
                                </View>
                            </View>
                           </View>
                           {
                            transData.type === "Advance"? <></>:
                             <TouchableOpacity onPress={()=> CreateOrder()} style={{ width:'100%', height:50, marginTop:20, backgroundColor:Style.headerBgColor, borderRadius:10, justifyContent:'center', alignItems:'center', alignSelf:'center' }} >
                                 <Text style={{fontSize:16, fontFamily: 'Lato-SemiBold', color:"#fff"}} >Make Payment</Text>
                             </TouchableOpacity>
                           }
                         </View>
                        )
                    }
                 </View>
                 }
              </ScrollView>
            </Animated.View>
        </SafeAreaView>
    )
}
