import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Text, StatusBar, Button, ScrollView, Modal, FlatList, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import EmployeHeader from './EmployeComponent/EmployeHeader';
// import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function EmployeChangePass({ navigation, route }) {

    const [oldPassword, setOldPassword] = useState('');
    const [oldShowPass, setOldShowPass] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [newShowPass, setNewShowPass] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmShowPass, setConfirmShowPass] = useState(true);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Change Password</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, }} >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex:1, padding:10 }} >
              <View>
               <Text style={{color: '#444', fontSize: 14, fontFamily:'Poppins-SemiBold', padding:10 }}>Employee Change Password</Text>
                <View style={{ width:'100%', backgroundColor:'#fff', padding:15, borderRadius:6, elevation:1, }} >
                  <View style={{ width: '100%', marginTop: 10, marginBottom:20 }}>
                   <Text style={{ fontSize: 14, fontFamily:'Poppins-SemiBold', color:'#074173' }}>Enter Old Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', }}>
                      <TextInput
                        placeholder="Enter Old Password"
                        value={oldPassword}
                        onChangeText={value => setOldPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={oldShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Poppins-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setOldShowPass(!oldShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={oldShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ width: '100%', marginBottom:20 }}>
                   <Text style={{ fontSize: 14, fontFamily:'Poppins-SemiBold', color:'#074173' }}>Enter New Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', paddingBottom:.5 }}>
                      <TextInput
                        placeholder="Enter New Password"
                        value={newPassword}
                        onChangeText={value => setNewPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={newShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Poppins-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setNewShowPass(!newShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={newShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ width: '100%', marginBottom:20, }}>
                   <Text style={{ fontSize: 14, fontFamily:'Poppins-SemiBold', color:'#074173' }}>Enter Confirm Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', paddingBottom:.5 }}>
                      <TextInput
                        placeholder="Enter Confirm Password"
                        value={confirmPassword}
                        onChangeText={value => setConfirmPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={confirmShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Poppins-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setConfirmShowPass(!confirmShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={confirmShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:40 }} >
                  <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Change Password</Text>
              </TouchableOpacity>
            </ScrollView>
        </View>
    </SafeAreaView>
  )
}

