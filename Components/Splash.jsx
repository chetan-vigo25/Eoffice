import React, { useState, useEffect, useContext, useRef } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Image, Animated, StatusBar, Platform, Alert, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { login } from "../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';

import BASE_URL from "../Urls/DomainUrl";
import Style from "../Style/Style";
import { Entypo } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/FontAwesome5';
import messaging from '@react-native-firebase/messaging';
import * as Contacts from 'expo-contacts';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function Splash({ navigation }) {

  const dispatch = useDispatch();
  const { user, login_loading, error } = useSelector((state) => state.authentication);

  const [logoOpacity] = useState(new Animated.Value(1));
  const [secondViewAnimation] = useState(new Animated.Value(100)); 
  const [secondViewOpacity] = useState(new Animated.Value(0)); 
  const [imageAnimation] = useState(new Animated.Value(0)); 
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [showPass, setShowPass] = useState(true);
  const [clientList, setClientList] = useState([]);
  const [activeTab, setActiveTab] = useState('Client');
  const [timer, setTimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [contactList, setContactList] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const requestUserPermission = async () => {
        try {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (enabled) {
            const fcmtoken = await messaging().getToken();
            console.log("fcmToken Splash---", fcmtoken);
            setFcmToken(fcmtoken);
          } else {
            console.log("Notification permission denied.");
          }
        } catch (error) {
          console.error("Permission request failed", error);
        }
      };
      requestUserPermission();
    },[])
  );

  const handleLogin = () => {
    // if (!fcmToken) {
    //   console.log("FCM Token is missing");
    //   return;
    // }
    let reqData = {
      userName: userName,
      password: password,
      fcmToken: fcmToken, 
    };
    dispatch(login(reqData));
  };

  useEffect(() => {
    if (user && user.data) {
      // console.log("user.token",user.token)
      AsyncStorage.setItem('token', user.token)
        .then(() => {
          AsyncStorage.setItem('user', JSON.stringify(user.data));
          navigation.navigate('ClientDash', { userData: user.data });
          setUserName(''); 
          setPassword('');
        })
        .catch((error) => {
          console.error('Error saving token:', error);
        });
    }
  }, [user, navigation]);

  const askForContactPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      console.log('Permission granted contact');
      setPermissionGranted(true);
      fetchContacts();
    } else {
      setPermissionGranted(false);
      console.log("Permission denied contacts");
    }
  }
  
  // Function to fetch contacts
 const fetchContacts = async () => {
   try {
     const { data } = await Contacts.getContactsAsync({
       fields: [Contacts.Fields.PhoneNumbers],
     });
 
     if (data.length > 0) {
       // Extract name and phone numbers
       const formattedContacts = data.flatMap(contact => {
         if (!contact.phoneNumbers) return [];
         return contact.phoneNumbers.map(phone => ({
           name: contact.name,
           number: phone.number,
         }));
       });
       // console.log("Formatted Contacts", formattedContacts);
       // sendContact(formattedContacts);
       setContactList(formattedContacts);
     } else {
       showToast("No contacts found");
     }
   } catch (error) {
     console.log("Error fetching contacts", error);
   }
 };

  const sendContact = async (contacts) => {
  if (!contacts || contacts.length === 0) {
    // showToast("No contacts to send.");
    return;
  }
    let token = await AsyncStorage.getItem("token");
    if (!token) {
      showToast("User not authenticated. Please login.");
      return;
    }
  
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      "mobileNumbers": contacts
    });
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
  
    fetch(`${BASE_URL}/client/contactNumber/create`, requestOptions)
      .then(async response => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unknown API error");
        }
        // console.log("contact result", result.message);
        // showToast(result.message);
      })
      .catch(error => {
        console.error("Error sending contacts to API:", error);
        showToast("Error sending contacts.");
      });
  };

  // useEffect(() => {
  //   if (user && !login_loading && !error) {
  //     // Once the user is logged in successfully, send the contacts
  //     sendContact(contactList);
  //   }
  // }, [user, login_loading, error]);

  const getClientList = async () => {
    if (!groupId || groupId.length < 12) return;
    setIsLoading(true);
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "groupName": groupId
    });
    
    const requestOptions = {
      method: "POST",
      body: raw,
      headers: myHeaders,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/auth/list`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          // console.log(result);
          setClientList(result.data);
          showToast(result.message);
        }else{
          Alert.alert('Alert',result.message);
          setClientList([]);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => { setIsLoading(false)});
  }

  const empLogin = async () => {
      setIsLoading(true);
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      
      const raw = JSON.stringify({
          "email": userName,
          "fcmToken": fcmToken,
          "password": password
      });
  
      const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
      };
  
      try {
          const response = await fetch(`${BASE_URL}/admin/login`, requestOptions);
          const result = await response.json();
          
          if (result.statusCode === 200) {
              const token = result?.token;
             //  console.log("token = result?.token", result?.token)
              await AsyncStorage.setItem('authToken', result?.token);
              navigation.navigate('WebViewComp');
              showToast(result.message);
              setIsLoading(false);
          } else {
              showToast(result.message);
          }
          setIsLoading(false);
      } catch (error) {
          console.error(error);
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (timer) {
      clearTimeout(timer); 
    }
    if (!groupId || groupId.length < 12) {
      setClientList([]);
      setIsLoading(false); // Stop loader if groupId is invalid
      return;
    }
    const newTimer = setTimeout(() => {
      getClientList(); // Make the API call after 2 seconds
    }, 1000);
    setTimer(newTimer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [groupId]);

  // console.log("user", user)

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor={'#ebf1fd'} barStyle='dark-content' />
        <ImageBackground source={require("../assets/bgImg.png")} resizeMode="cover" style={{ flex:1  }}>
          <ScrollView style={{ flex: 1, padding:20,  }} >
            <View style={{ flex: 1, justifyContent: "center",  }}>
            <View style={{ marginBottom:30, marginTop:60 }}>
            <Image
              source={require("../assets/Eofficelogo.png")}
              resizeMode="contain"
              style={{ width: "100%", height: 60 }}
            />
          </View>
          <View style={{ flexDirection:'row', gap:20, marginBottom:20 }} >
            {/* <TouchableOpacity onPress={()=> setActiveTab('Group')} style={{ flex:1, height:50, backgroundColor: activeTab === 'Group'?'#b6b6b610':'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:activeTab === 'Group'?'#658Eff':'#d6d6d6' }} >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: activeTab === 'Group'? '#658Eff':'#7c7c7c' }} >Group</Text>
            </TouchableOpacity> */}
            <TouchableOpacity onPress={()=> setActiveTab('Client')} style={{ flex:1, height:50, backgroundColor:activeTab === 'Client'?'#b6b6b610':'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:activeTab === 'Client'?'#658Eff':'#d6d6d6' }} >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: activeTab === 'Client'? '#658Eff':'#7c7c7c' }} >Client</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=> setActiveTab('Employee')} style={{ flex:1, height:50, backgroundColor:activeTab === 'Employee'?'#b6b6b610':'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:activeTab === 'Employee'?'#658Eff':'#d6d6d6' }} >
              <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: activeTab === 'Employee'? '#658Eff':'#7c7c7c' }} >Employee</Text>
            </TouchableOpacity>
          </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10, marginTop: 20 }}>
              <Text style={{ fontSize: 18, fontFamily:'Roboto-Bold' }}>Welcome to</Text>
              <Text style={{ fontSize: 18, fontFamily:'Roboto-Bold', color: '#658eff',  }}>&nbsp;E-Office!</Text>
            </View>
            <View>
            {
              activeTab === 'Client' ? (
                <>
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your e-mail</Text>
                    <View style={{ width: "100%", height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                      <TextInput
                        placeholder="Enter your e-mail"
                        value={userName}
                        onChangeText={value => setUserName(value)}
                        placeholderTextColor="#999"
                        style={{ flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 5, paddingLeft:15 }}
                      />
                    </View>
                  </View>
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your Password</Text>
                    <View style={{ flexDirection: 'row', width: "100%", backgroundColor: '#fff', height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                      <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={value => setPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={showPass ? true : false}
                        style={{ flex: 9, borderRadius: 5, padding: 5, paddingLeft:15 }}
                      />
                      <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                        <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) :activeTab === 'Group' ? (
                <>
                  <View style={{ width: '100%', marginTop: 0 }}>
                    <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter Group Name</Text>
                    <View style={{ width: "100%", flexDirection:'row', backgroundColor: '#fff', height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                      <TextInput
                        placeholder="Group name"
                        value={groupId}
                        onChangeText={value => setGroupId(value)}
                        autoCapitalize="characters"
                        placeholderTextColor="#999"
                        style={{ flex: 9, borderRadius: 5, padding: 5, paddingLeft:15 }}
                      />
                      {isLoading && (
                        <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                          <ActivityIndicator size="small" color="#658eff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your username</Text>
                     <SelectDropdown
                        data={clientList.length === 0 ? [{ fullName: 'No Client has this User ID' }] : clientList}
                        disabled={!groupId}
                        onPress={() => !groupId && showToast('Alert', 'Please fill in the Group ID first')}
                        onSelect={(clientList, index) => {
                          setUserName(clientList.email);
                        }}
                        renderButton={(clientList, isOpened) => {
                          return (
                            <View style={styles.dropdownButtonStyle}>
                               <Text style={styles.dropdownButtonTxtStyle}>
                                 {(clientList && clientList.fullName) || 'Client List'}
                               </Text>
                               <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                            </View>
                          );
                        }}
                        renderItem={(clientList, index, isSelected) => {
                          return (
                            <View style={{...styles.dropdownItemStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
                              <Text style={styles.dropdownItemTxtStyle}>{clientList.fullName}</Text>
                            </View>
                          );
                        }}
                        showsVerticalScrollIndicator={false}
                        dropdownStyle={styles.dropdownMenuStyle}
                     />
                  </View>
                  <View style={{ width: '100%', marginTop: 10 }}>
                   <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your Password</Text>
                    <View style={{ flexDirection: 'row', width: "100%", backgroundColor: '#fff', height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                      <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={value => setPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={showPass ? true : false}
                        style={{ flex: 9, borderRadius: 5, padding: 5, paddingLeft:15 }}
                      />
                      <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                        <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ):(
                <>
                 <View style={{ width: '100%', marginTop: 10 }}>
                     <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your e-mail</Text>
                      <View style={{ width: "100%", height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                        <TextInput
                          placeholder="Enter your e-mail"
                          value={userName}
                          onChangeText={value => setUserName(value)}
                          placeholderTextColor="#999"
                          style={{ flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 5, paddingLeft:15 }}
                        />
                      </View>
                   </View>
                   <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, fontFamily:'Poppins-Medium' }}>Enter your Password</Text>
                     <View style={{ flexDirection: 'row', width: "100%", backgroundColor: '#fff', height: 50, borderWidth: 1, borderRadius: 5, borderColor: '#074173', marginTop: 0 }}>
                       <TextInput
                         placeholder="Password"
                         value={password}
                         onChangeText={value => setPassword(value)}
                         placeholderTextColor="#999"
                         secureTextEntry={showPass ? true : false}
                         style={{ flex: 9, borderRadius: 5, padding: 5, paddingLeft:15 }}
                       />
                       <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center', }}>
                         <Icon name={showPass ? 'eye-slash' : 'eye'} size={16} color='#074173' />
                       </TouchableOpacity>
                     </View>
                   </View> 
                </>
              )
            }
            </View>
            <Text onPress={()=> navigation.navigate('ForgotPass')} style={{ alignSelf: 'flex-end', fontSize: 14, fontFamily:'Poppins-SemiBold', color: '#464646', paddingVertical: 10 }}>Forgot Password?</Text>
            <View style={{ width: '100%', alignItems: 'center' }}>
              {
                activeTab === 'Employee' ? (
                  <TouchableOpacity onPress={empLogin} disabled={isLoading} style={{ width: '60%', height: 40, backgroundColor: '#658eff', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                     {
                       isLoading ? <ActivityIndicator size="small" color="#fff" /> : 
                       <Text style={{ fontSize: 16, fontFamily:'Poppins-Medium', color: '#fff' }}>Login</Text>
                     }
                  </TouchableOpacity>
                ):(
                  <TouchableOpacity onPress={()=> {handleLogin()}} disabled={login_loading} style={{ width: '60%', height: 40, backgroundColor: '#658eff', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                    {
                      login_loading ? <ActivityIndicator size="small" color="#fff" /> : 
                      <Text style={{ fontSize: 16, fontFamily:'Poppins-Medium', color: '#fff' }}>Login</Text>
                    }
                  </TouchableOpacity>
                )
              }
            </View> 
            </View>                                                                  
          </ScrollView>
        </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth:1,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Style.headerBgColor,
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    // flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Style.placeHolderTextColor,
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});