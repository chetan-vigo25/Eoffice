import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image } from "react-native";

import { Feather } from '@expo/vector-icons'

export default function Header({ navigation }) {

  return (
    <SafeAreaView style={{ }}>
      <View style={{ width:"100%", backgroundColor:"#fff", padding:15 }} >
        <View style={{ width:"100%", flexDirection:'row',}} >
            <View style={{ flex:8, justifyContent:'center' }} >
               <View style={{ width:'100%', height:50, backgroundColor:"#fff", borderRadius:50, flexDirection:'row', elevation:4, justifyContent:'center', alignItems:'center' }} >
                 <TextInput placeholder="Search" style={{ fontSize:14, flex:9, width:'100%', padding:10, paddingLeft:20 }}  />
                  <TouchableOpacity style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                    <Image source={require('../assets/oui_search.png')} resizeMode='contain' style={{ width:20, height:20 }} />
                  </TouchableOpacity>
               </View>
            </View>
            <View style={{ flex:1.5, justifyContent:'center', alignItems:'flex-end' }} >
              <View style={{ width: 50, height:50, borderRadius:100 }} >
                 <Image source={require('../assets/userImg.jpg')} style={{ width:'100%', height:'100%', borderRadius:100 }} />
              </View>
            </View>
        </View>
      </View> 
    </SafeAreaView>
  );
}
