import React, { useState, useEffect } from "react";
import { StatusBar, ScrollView, View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, ToastAndroid, ActivityIndicator, LayoutAnimation, UIManager, Platform } from "react-native";
import Style from "../../../Style/Style";
import moment from "moment";

import { AntDesign, Feather } from "@expo/vector-icons";

export default function MyDocuments({ navigation }) {
 
  const [scale] = useState(new Animated.Value(0)); 

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
           <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
                <AntDesign name="arrowleft" size={24} color="#fff" />
             </TouchableOpacity>
             <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>My Documents</Text>
           </View>
           {/* <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
             <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4,}}>
               <TextInput placeholder="Search" style={{flex: 9,fontSize: 18,padding: 10,paddingLeft: 20,}} />
               <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                 <Image source={require('../../../assets/oui_search.png')} resizeMode='contain' style={{ width: 20, height: 20,}} />
               </TouchableOpacity>
             </View>
             <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')}  style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center',alignItems:"flex-end"}}>
                <Feather name="bell" size={28} color="#fff" />
             </TouchableOpacity>
           </View> */}
        </Animated.View>
        <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
           <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
               <Animated.View style={{ transform: [{ scale }] }}>
                   <TouchableOpacity onPress={()=> navigation.navigate('RegDocument')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:1, marginBottom:10, padding:5, paddingVertical:8 }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                          <AntDesign name="book" size={22} color={Style.headerBgColor} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{ color:Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Registration Documents</Text>
                       </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> navigation.navigate('FinDocument')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:1, marginBottom:10, padding:5, paddingVertical:8 }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                         <AntDesign name="book" size={22} color={Style.headerBgColor} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{color:Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Financial Documents</Text>
                       </View>
                   </TouchableOpacity>
               </Animated.View>
           </ScrollView>
        </View>
    </SafeAreaView>
  );
}
