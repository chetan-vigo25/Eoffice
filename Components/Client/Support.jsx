import React, { useState, useEffect, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Animated, Platform, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, ActivityIndicator} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";
import { AntDesign, Feather, Entypo } from "@expo/vector-icons";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function Support({ navigation }) {
  const dispatch = useDispatch();
  const [scale] = useState(new Animated.Value(0)); 
  const [issueMsg, setIssuepMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const createIssue = async ()=>{
    if (logoutHandled.current) return;
    setIsLoading(true)
     let token = await AsyncStorage.getItem("token");
     if(!token) {
      navigation.navigate('Autologin');
      return;
     }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "description": issueMsg
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/issueReport/create`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if(result.statusCode === 200){
          console.log(result);
          showToast(result.message);
          setIsLoading(false);
          setIssuepMsg('');
        }else if(result.statusCode === 401){
          dispatch(logout());
          AsyncStorage.removeItem('token');
          AsyncStorage.clear();
          navigation.navigate('Autologin');
          showToast('Session expired, please login again');
        }else{
          showToast(result.message);
          setIsLoading(false)
        }
      })
      .catch((error) => console.error(error))
      .finally(()=> setIsLoading(false));
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar barStyle='light-content' backgroundColor={ Style.headerBgColor } />
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1 }}>Support</Text>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
           <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
                <View>
                  <View style={{  }}>
                      <Text style={{ color: Style.secondryTextColor, fontSize: 14, fontFamily:"Lato-SemiBold" }}>Enter your Query here</Text>
                  </View>
                  <View style={{ paddingHorizontal:1 }}>
                     <TextInput
                       placeholder="Enter your query..."
                       placeholderTextColor={Style.primaryTextColor}
                       value={issueMsg}
                       onChangeText={(issueMsg) => setIssuepMsg(issueMsg)}
                       style={styles.textInput}
                       multiline={true} 
                       numberOfLines={10}
                     />
                  </View>
                  <TouchableOpacity disabled={issueMsg === ""} onPress={createIssue} style={{ width:'100%', height:45, backgroundColor:issueMsg===""?'#cbcbcb': Style.headerBgColor, justifyContent:'center', alignItems:'center', borderRadius:6 }} >
                    {
                      isLoading?<ActivityIndicator color={'white'} />:
                      <Text style={{ color:'#fff', fontSize:14, fontFamily:'Lato-Medium' }} >Report your issue</Text>
                    }
                  </TouchableOpacity>
                </View>
           </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    textInput: {
      padding: 15,
      marginBottom: 20,
      borderRadius: 5,
      height: 120,
      textAlign: 'left',        
      textAlignVertical: 'top',  
      color: Style.primaryTextColor,
      fontSize: 12,
      backgroundColor:'#fff',
      fontFamily:'Lato-Medium'
    }
  });