import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, ScrollView, Animated, SafeAreaView, LayoutAnimation, UIManager, Platform } from "react-native";
import Style from "../../../Style/Style";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";

import { AntDesign, Feather } from "@expo/vector-icons";

export default function PersonInfo({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

 useEffect(() => {
   dispatch(personalInfo());
 }, [dispatch]);

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
      <StatusBar translucent={false} backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
           <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
                <AntDesign name="arrowleft" size={24} color="#fff" />
             </TouchableOpacity>
             <Text style={{color: '#fff',fontSize: 14, fontWeight: '500', flex: 1, }}>Personal Information</Text>
           </View>
           {/* <View style={{flexDirection: 'row',alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
             <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4,}}>
               <TextInput placeholder="Search" style={{flex: 9,fontSize: 18,padding: 10,paddingLeft: 20,}} />
               <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                 <Image source={require('../../../assets/oui_search.png')} resizeMode='contain'style={{ width: 20, height: 20,}} />
               </TouchableOpacity>
             </View>
             <TouchableOpacity style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center',alignItems:"flex-end"}}>
                <Feather name="bell" size={28} color="#fff" />
             </TouchableOpacity>
           </View> */}
        </Animated.View>
        
         <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
           <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
               <Animated.View style={{ transform: [{ scale }] }}>
                   <TouchableOpacity onPress={()=> navigation.navigate('PersonalDetail')} style={{ width:'100%',  borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, marginBottom:10, padding:5,
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            // Android shadow
                            elevation: 1,
                           }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                           <Image source={require('../../../assets/user.png')} resizeMode="contain" style={{ width: 25, height: 30, }} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{ color:Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Personal Information</Text>
                       </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> navigation.navigate('OwnerDetail')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, marginBottom:10, padding:5, 
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            // Android shadow
                            elevation: 2,
                           }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                           <Image source={require('../../../assets/briefcase.png')} resizeMode="contain" style={{ width: 20, height: 25, }} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{color:Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Owner Details</Text>
                       </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> navigation.navigate('ContactDetail')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, marginBottom:10, padding:5, 
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            // Android shadow
                            elevation: 2,
                           }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                           <Image source={require('../../../assets/phone-call.png')} resizeMode="contain" style={{ width: 20, height: 25, }} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{color: Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Contact Details</Text>
                       </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> navigation.navigate('BankDetail')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, marginBottom:10, padding:5, 
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            // Android shadow
                            elevation: 2,
                           }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                           <Image source={require('../../../assets/layout.png')} resizeMode="contain" style={{ width: 20, height: 30, }} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{color: Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Bank Account Details</Text>
                       </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> navigation.navigate('DigitalSign')} style={{ width:'100%', borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, marginBottom:10, padding:5, 
                            // iOS shadow
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 3.84,
                            // Android shadow
                            elevation: 2,
                           }} >
                       <View style={{ flex:1.5, alignItems:'center', justifyContent:'center' }} >
                           <Image source={require('../../../assets/copy.png')} resizeMode="contain" style={{ width: 20, height: 30, }} />
                       </View>
                       <View style={{ flex:8, justifyContent:'center', alignItems:'flex-start' }} >
                          <Text style={{color: Style.headerBgColor, fontSize: 12, fontWeight: '500', }}>Digital Signatures</Text>
                       </View>
                   </TouchableOpacity>
               </Animated.View>
           </ScrollView>
         </View>
    </SafeAreaView>
  );
}
