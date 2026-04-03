import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, Image, Animated, Platform, ToastAndroid, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { login } from "../Redux/Reducer/Auth/Auth.reducers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native'; 

import Icon from 'react-native-vector-icons/FontAwesome5';
// import Button from '../Layout/Button.json';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function Login({navigation}) {
  
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.authentication);

  const [imageAnimation] = useState(new Animated.Value(0));
  const [secondViewAnimation] = useState(new Animated.Value(0));
  const [showSecondView, setShowSecondView] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [showPass, setShowPass] = useState(true);
  const [message, setMessage] = useState();
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
       Animated.parallel([ 
         Animated.timing(imageAnimation, {
           toValue: -100, 
           duration: 1000,
           useNativeDriver: true,
         }),
         Animated.timing(secondViewAnimation, {
           toValue: -100,
           duration: 1000, 
           useNativeDriver: true,
         })
       ]).start(); 
      setShowSecondView(true); 
    }, 1000);  
      return () => clearTimeout(timeout);  
    }, []);

   const imageScale = imageAnimation.interpolate({
     inputRange: [-250, 0],
     outputRange: [0.5, 1.1],
     extrapolate: 'clamp',
   });

  // const handleLogin = () => {
  //   let reqData = {
  //     // email: "admin@shubham.com",
  //     // password: "123456"
  //     email: email,
  //     password: password
  //   };
  //   dispatch(login(reqData));
  // };

  // useEffect(() => {
  //   if (user && user.data) {
  //     AsyncStorage.setItem('token', user.token)
  //       .then(() => {
  //         // console.log('Token saved:', user.token); 
  //         setUserId(user.data._id);
  //         // console.log("User Type:", user.data.userType)
  //         // navigation.navigate('DemoSc', { userId: user.data._id });
  //         navigation.navigate('Splash');
  //       })
  //       .catch((error) => {
  //         console.error('Error saving token:', error);
  //       });
  //   }
  // }, [user, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eee" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Animated.View
          style={{
            width: "100%",
            height: 150,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateY: imageAnimation }, { scale: imageScale }],
          }}
        >
          <Image
            source={require("../assets/Eofficelogo.png")}
            resizeMode="contain"
            style={{ width: "100%", height: 100 }}
          />
        </Animated.View>
        {/* Conditionally render the second view after the 2-second delay */}
        {showSecondView && (
          <Animated.View
            style={{
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 20,
              paddingVertical: 30,
              transform: [{ translateY: imageAnimation }]
            }}
          >
            {/* Content of the second view */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <Text style={{ fontSize: 14, fontWeight: 600 }}>Welcome to</Text>
                 <Text style={{ fontSize: 14, fontWeight: 800, color: '#074173' }}>&nbsp;E-Office</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 600, paddingVertical: 5 }}>Log in</Text>
              <View style={{ width: '100%' }}>
               <Text style={{ fontSize: 12, fontWeight: 400 }}>Enter your username or email address</Text>
                <View style={{ width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 10, }}>
                  <TextInput
                    placeholder="Username or email address"
                    value={email}
                    onChangeText={value => setEmail(value)}
                    placeholderTextColor="#999"
                    style={{ flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 5, }}
                  />
                </View>
              </View>
              <View style={{ width: '100%', marginTop: 10 }}>
               <Text style={{ fontSize: 12, fontWeight: 400 }}>Enter your Password</Text>
                <View style={{ flexDirection:'row', width: "100%", height: 40, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 10 }}>
                  <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={value => setPassword(value)}
                    placeholderTextColor="#999"
                    secureTextEntry={showPass ? true : false}
                    style={{ flex: 9, backgroundColor: '#fff', borderRadius: 5, padding: 5 }}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex:1.2, justifyContent:'center', alignItems:'center', }} >
                    <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ alignSelf: 'flex-end', fontSize: 14, fontWeight: 600, color: '#074173', paddingVertical: 15 }}>Forgot Password?</Text>
               <View style={{ width: '100%', paddingHorizontal: 50, marginTop: 30 }}>
                  <TouchableOpacity disabled={loading} style={{ width: '100%', height: 40, backgroundColor: '#074173', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                    {
                      loading ? <ActivityIndicator size="small" color="#fff" /> : 
                      <Text style={{ fontSize: 16, fontWeight: "500", color: "#fff" }}>Login</Text>
                    }
                  </TouchableOpacity>
               </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
