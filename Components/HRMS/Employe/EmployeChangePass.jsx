import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform, Button, ScrollView, TextInput, Alert, TouchableOpacity, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../Urls/DomainUrl';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/FontAwesome5';

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk);
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export default function EmployeChangePass({ navigation, route }) {

    const [oldPassword, setOldPassword] = useState('');
    const [oldShowPass, setOldShowPass] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [newShowPass, setNewShowPass] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmShowPass, setConfirmShowPass] = useState(true);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
      const loadUserData = async () => {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
    
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            console.log("User Data PayRoll---:", parsedData);
          }
        } catch (error) {
          console.error("Failed to load userData:", error);
        }
      };
  
      loadUserData();
    }, []);

    const validateChangePassForm = () => {
      let newErrors = {};
      if (!oldPassword || !oldPassword.trim()) { newErrors.oldPassword = "Old password is required"; }
      if (!newPassword || !newPassword.trim()) { newErrors.newPassword = "New password is required"; }
      if (!confirmPassword || !confirmPassword.trim()) { newErrors.confirmPassword = "Confirm password is required"; }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleResetPass = () => {
      setNewPassword('');
      setOldPassword('');
      setConfirmPassword('');
    };

    const employeChangePass = async () => {
      try{
        setLoading(true);
        let token = await AsyncStorage.getItem("authToken");
         if (!token) {
           showToast("Authentication token not found");
           setLoading(false);
           return;
        }
        if (!validateChangePassForm()) {
          return;
        }
        if(newPassword !== confirmPassword){
          showToast("New password and confirm password does not match");
          setLoading(false);
          return;
        }
        const myHeaders = new Headers();  
        myHeaders.append("Content-Type", "application/json");  
        myHeaders.append("Authorization", "Bearer " + token);

        const raw = JSON.stringify({
          "_id": userData?._id,
          "newPassword": newPassword,
          "password": confirmPassword
        });
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        console.log("requestOptions---:", raw);

        const response = await fetch(`${BASE_URL}/admin/common/changePassword`, requestOptions);
        const result = await response.json()
        if(result.statusCode === 200){
          showToast(result.message);
          handleResetPass();
          setLoading(false);
        }else{
          showToast(result.message);
          setLoading(false);
        }
      }catch(error){
        console.log(error)
        setLoading(false);
      }finally{
        setLoading(false);
      }
    }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Change Password</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, }} >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex:1, padding:10 }} >
              <View>
               <Text style={{color: '#444', fontSize: 14, fontFamily:'Lato-SemiBold', padding:10 }}>Employee Change Password</Text>
                <View style={{ width:'100%', backgroundColor:'#fff', padding:15, borderRadius:6, elevation:1, }} >
                  <View style={{ width: '100%', marginTop: 10, marginBottom:20 }}>
                   <Text style={{ fontSize: 14, fontFamily:'Lato-SemiBold', color:'#074173' }}>Enter Old Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', }}>
                      <TextInput
                        placeholder="Enter Old Password"
                        value={oldPassword}
                        onChangeText={value => setOldPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={oldShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Lato-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setOldShowPass(!oldShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={oldShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                    {errors.oldPassword && <Text style={{ color: 'red', fontSize: 12 }}>{errors.oldPassword}</Text>}
                  </View>
                  <View style={{ width: '100%', marginBottom:20 }}>
                   <Text style={{ fontSize: 14, fontFamily:'Lato-SemiBold', color:'#074173' }}>Enter New Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', paddingBottom:.5 }}>
                      <TextInput
                        placeholder="Enter New Password"
                        value={newPassword}
                        onChangeText={value => setNewPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={newShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Lato-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setNewShowPass(!newShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={newShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                    {errors.newPassword && <Text style={{ color: 'red', fontSize: 12 }}>{errors.newPassword}</Text>}
                  </View>
                  <View style={{ width: '100%', marginBottom:20, }}>
                   <Text style={{ fontSize: 14, fontFamily:'Lato-SemiBold', color:'#074173' }}>Enter Confirm Password</Text>
                    <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', paddingBottom:.5 }}>
                      <TextInput
                        placeholder="Enter Confirm Password"
                        value={confirmPassword}
                        onChangeText={value => setConfirmPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={confirmShowPass ? true : false}
                        style={{ flex: 9, fontFamily:'Lato-Regular', backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                      />
                      <TouchableOpacity onPress={() => setConfirmShowPass(!confirmShowPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                        <Icon name={confirmShowPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={{ color: 'red', fontSize: 12 }}>{errors.confirmPassword}</Text>}
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => employeChangePass()} style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:40 }} >
                  <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Lato-SemiBold" }} >Change Password</Text>
              </TouchableOpacity>
            </ScrollView>
        </View>
    </SafeAreaView>
  )
}

