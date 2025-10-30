
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StatusBar, ScrollView, Image, TouchableOpacity } from "react-native";
import { WebView } from 'react-native-webview';

import Style from '../Style/Style';
import BASE_URL from '../Urls/DomainUrl';
import { AntDesign } from "@expo/vector-icons";

export default function Privacy({ navigation }) {

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
        <StatusBar translucent={false} backgroundColor={'#6a8ff3'} barStyle='light-content' />
         <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
               <AntDesign name="arrowleft" size={24} color="#fff" />
            </TouchableOpacity>
           <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Privacy</Text>
         </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20 }} >
          <WebView
            originWhitelist={['*']}
            source={{ uri: `${BASE_URL}/client/privacy-policy` }} 
            style={{flex:1}}
          />
        </View>
    </SafeAreaView>
  )
}
