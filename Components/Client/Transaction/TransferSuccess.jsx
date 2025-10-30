import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, ImageBackground, SafeAreaView, Linking, Image, TouchableOpacity, Alert, Platform, StatusBar, ToastAndroid, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

import Style from '../../../Style/Style';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function TransferSuccess({ navigation, route }) {

   const { reciptData } = route.params;

   const downloadPDF = () => {
      const { invoiceURL } = reciptData;
      Linking.openURL(invoiceURL)
        .catch((err) => console.error("An error occurred while opening the URL", invoiceURL));
   };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.paySuccessbgColor }}>
        <StatusBar translucent={false} barStyle='light-content' backgroundColor={ Style.paySuccessbgColor } />
        <ScrollView contentContainerStyle={{ justifyContent:'center' }} showsVerticalScrollIndicator={false} style={{ flex:1, padding:20, }}>
            <View>
               <LottieView
                    autoPlay
                      style={{
                        width: "100%",
                        height: 150,
                        backgroundColor: 'transparent'
                      }}
                    source={require('../../../assets/success.json')} 
                  />
                <View style={{ alignItems:'center' }}>
                   <Text style={{ fontSize:18, color:'#cfcfcf', fontFamily:'Poppins_Medium' }}>Payment Success!</Text>
                   <Text style={{ fontSize:20, color:'#fff', fontFamily:'Poppins-SemiBold' }} >INR {reciptData?.grandTotal}</Text>
                </View>
            </View>
            <View style={{ width:'100%', backgroundColor:Style.basicbgColor, marginTop:10, borderRadius:10, padding:10, borderWidth:1, borderColor:Style.secondaryButtonColor }}>
               <TouchableOpacity style={{ width:'100%', height:50, backgroundColor:'#E3E3E3', borderRadius:10, justifyContent:'center', alignItems:'center' }} >
                   <Text style={{fontSize:16, fontWeight:"600", color:Style.basicTextColor}} >Payment Detail</Text>
               </TouchableOpacity>
                 <View style={{ marginTop:20, paddingHorizontal:20 }} >
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Transaction ID</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>{reciptData?.paymentHistory?.razorpayPaymentId}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Time</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>{reciptData?.paymentHistory?.paymentOBJ?.created_at}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Method</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>{reciptData?.paymentHistory?.paymentOBJ?.method}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>To</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>{reciptData?.paidTo?.fullName}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingBottom:10, borderBottomWidth:1, borderStyle:'dashed', borderColor:Style.secondryTextColor}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>From</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>{reciptData?.paidBy?.fullName}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Amount</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:Style.basicTextColor }}>INR {reciptData?.paymentHistory?.paymentOBJ?.notes.amount}</Text>
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:"center", paddingVertical:10}} >
                       <Text style={{ fontSize:14, fontWeight:"400", color:Style.secondryTextColor }}>Payment Status</Text>
                       <Text style={{ fontSize:14, fontWeight:"500", color:'#85BD2A', backgroundColor:'#85BD2A20', paddingHorizontal:15, padding:4, borderRadius:50 }}>Success</Text>
                       {/* <Text style={{ fontSize:16, fontWeight:"500", color:payDetail.status ==1?'#85BD2A':'#E51E1E', backgroundColor:payDetail.status ==1?'#85BD2A20':'#E51E1E10', paddingHorizontal:15, padding:4, borderRadius:50 }}>{payDetail.status==1?'Success':'Failed'}</Text> */}
                    </View>
                 </View>
            </View>
            <View style={{ marginTop:40 }}>
              {
               reciptData?.invoiceURL == null?<></>:
               <TouchableOpacity onPress={downloadPDF} style={{ flexDirection:'row', gap:10, width:'100%', height:50, borderWidth:1, borderColor:'#dedede', borderRadius:50, justifyContent:'center', alignItems:'center', marginBottom:20 }} >
                   <Image source={require('../../../assets/pdfDownload.png')} style={{ width:30, height:30 }} />
                   <Text style={{fontSize:16, fontWeight:"600", color:'#cfcfcf'}} >Download PDF</Text>
               </TouchableOpacity>
              }
              <TouchableOpacity onPress={()=> navigation.goBack()} style={{ width:'100%', height:50, backgroundColor:'#fff', borderRadius:50, justifyContent:'center', alignItems:'center' }} >
                  <Text style={{fontSize:16, fontWeight:"600", color:Style.headerBgColor}} >Back to Home</Text>
              </TouchableOpacity>
            </View>
        </ScrollView>
    </SafeAreaView>
  )
}
 