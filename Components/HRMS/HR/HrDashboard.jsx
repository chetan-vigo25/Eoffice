import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Button, ScrollView, Modal, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import CalendarPicker from "react-native-calendar-picker";
import moment from "moment";

import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";

export default function HrDashboard({ navigation }) {

// console.log("HR Dashboard Rendered", userData);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
         <View style={{ flex:1, justifyContent:'center', alignItems:'center' }} >
            <Text>HR Dashboard</Text>
         </View>
    </SafeAreaView>
  )
}
