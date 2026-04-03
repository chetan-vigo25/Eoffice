import React, { useState, useEffect, useContext, useRef } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Image, Animated, StatusBar, Platform, Alert, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions, LinearGradient } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { login } from "../Redux/Reducer/Auth/Auth.reducers";
import { logout } from "../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { UserContext } from '../Context/UserProvider';
import { checkAutoLogin } from '../Context/EmployeeAutoLogin';
import Style from "../Style/Style.js";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BASE_URL from "../Urls/DomainUrl";
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';


const CONSENT_STORAGE_KEY = 'contactConsentShown';
const LEGACY_CONSENT_KEY = 'contactPermissionHandled';
const PERSISTED_CONSENT_KEYS = [CONSENT_STORAGE_KEY, LEGACY_CONSENT_KEY];

const patchAsyncStorageClear = (() => {
  let patched = false;
  return () => {
    if (patched || typeof AsyncStorage?.clear !== 'function') {
      return;
    }
    const originalClear = AsyncStorage.clear.bind(AsyncStorage);
    AsyncStorage.clear = async () => {
      let preservedEntries = [];
      try {
        preservedEntries = await Promise.all(
          PERSISTED_CONSENT_KEYS.map(async (key) => {
            const value = await AsyncStorage.getItem(key);
            return [key, value];
          })
        );
      } catch {
        preservedEntries = [];
      }

      await originalClear();

      await Promise.all(
        preservedEntries
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => AsyncStorage.setItem(key, value))
      );
    };
    patched = true;
  };
})();

patchAsyncStorageClear();

const { width, height } = Dimensions.get('window');

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
  const { setUserAfterLogin } = useContext(UserContext);

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
  const [fcmTokenLoading, setFcmTokenLoading] = useState(true);
  const [contactList, setContactList] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [disclosed, setDisclosed] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const autoLoginCheck = async () => {
      const { isLoggedIn, userData } = await checkAutoLogin();
      if (isLoggedIn) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'EmployeDashboard', params: { userData } }],
        });
      }
    };
    autoLoginCheck();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const requestUserPermission = async () => {
        try {
          setFcmTokenLoading(true);
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const token = await Notifications.getDevicePushTokenAsync();
            console.log("fcmToken Splash---", token.data);
            setFcmToken(token.data);
          } else {
            console.log("Notification permission denied.");
          }
        } catch (error) {
          console.error("Permission request failed", error);
        } finally {
          setFcmTokenLoading(false);
        }
      };
      requestUserPermission();
    },[])
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedValue = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        if (!isMounted) return;
        if (storedValue === 'true') {
          setDisclosed(true);
        } else {
          setDisclosed(false);
        }
      } catch (e) {
        if (isMounted) {
          setDisclosed(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const markConsentShown = async () => {
    try {
      await AsyncStorage.multiSet([
        [CONSENT_STORAGE_KEY, 'true'],
        ['contactPermissionHandled', 'true'], // legacy key for backward compatibility
      ]);
    } catch (error) {
      console.error('Failed to persist contact consent flag', error);
    }
  };

  const handleLogin = async () => {
    // Wait for FCM token if it's not available yet
    let currentFcmToken = fcmToken;
    if (!currentFcmToken) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const token = await Notifications.getDevicePushTokenAsync();
          currentFcmToken = token.data;
          setFcmToken(currentFcmToken);
        }
      } catch (error) {
        console.error("Error getting FCM token:", error);
      }
    }
    
    let reqData = {
      userName: userName,
      password: password,
      fcmToken: currentFcmToken || '', // Send empty string if no token available
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
    } else {
      setPermissionGranted(false);
      console.log("Permission denied contacts");
    }
  }
  
  const handleAccept = async () => {
    await markConsentShown();
    setDisclosed(true);
    askForContactPermission();
  };
  
  const handleUserCancel = async () => {
    await markConsentShown();
    setDisclosed(true);
    // Optionally notify backend that user declined
  };
  
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

  useEffect(() => {
    if (user && !login_loading && !error && contactList && contactList.length > 0) {
      sendContact(contactList);
      // Mark consent as shown to avoid future prompts if not already set
      markConsentShown();
    }
  }, [user, login_loading, error, contactList]);

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
      
      // Wait for FCM token if it's not available yet
      let currentFcmToken = fcmToken;
      if (!currentFcmToken) {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const token = await Notifications.getDevicePushTokenAsync();
            currentFcmToken = token.data;
            setFcmToken(currentFcmToken);
          }
        } catch (error) {
          console.error("Error getting FCM token:", error);
        }
      }
      
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
  
      const raw = JSON.stringify({
          email: userName,
          fcmToken: currentFcmToken || '',
          password: password
      });
  
      const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
      };
      // console.log("Login Request Data:", raw);
      // return;
      try {
          const response = await fetch(`${BASE_URL}/admin/login`, requestOptions);
          const result = await response.json();
  
          if (result.statusCode === 200) {
              await setUserAfterLogin(result.data, result.token);
              // console.log("User Data after login:", result.data);
              // console.log("Token-----",result.token);
              navigation.navigate('EmployeDashboard', { userData: result?.data });
              // showToast(result.message);
              setIsLoading(false);
          } else if (result.statusCode === 400) {
              Alert.alert("Login Failed", result.message);
              setIsLoading(false);
          } else {
              showToast(result.message);
              setIsLoading(false);
          }
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

   useEffect(() => {
     if (!user?.data?._id) return;
   
     const userId = user.data._id;
     const socketUrl = `https://api.vieasyoffice.com?userId=${userId}`;
     socketRef.current = io(socketUrl, {
       transports: ['websocket'],
       reconnection: true,
       reconnectionAttempts: 5,
       reconnectionDelay: 1000,
       reconnectionDelayMax: 5000,
       randomizationFactor: 0.5,
     });
   
     const socket = socketRef.current;
   
     socket.on('connect', () => {
       console.warn('Socket connected');
     });  
     console.log("connect...");
     //  Log when the socket emits "force_logout"
    socket.on("force_logout", (data) => {
      console.log("Received force_logout message: ", data);
      // Prevent reconnection
      socket.io.opts.reconnection = false;
      socket.disconnect();
      socketRef.current = null;
    
      (async () => {
        await AsyncStorage.removeItem('token');
        console.log("AsyncStorage cleared.");
        dispatch(logout());
        navigation.reset({
         index: 0,
         routes: [{ name: 'Splash' }],
       });
      })();
    });
     socket.on('disconnect', () => {
       console.warn('Socket disconnected');
     });
   
     socket.on('reconnect', () => {
       console.warn('Socket reconnected');
     });
   
     socket.on('reconnect_attempt', () => {
       console.warn('Attempting to reconnect...');
     });
   
     socket.on('reconnect_error', (error) => {
       console.error('Reconnection attempt failed:', error);
     });
   
     return () => {
       socket.disconnect();
     };
   }, [user]);

  // console.log("clientList", clientList)

  return (
    <SafeAreaView style={styles.container}>
      {/* Consent Modal */}
      {!disclosed && (
        <View style={{ position: 'absolute', zIndex: 10, left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '86%', backgroundColor: '#fff', padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Lato-Bold', color: '#111', marginBottom: 8 }}>We value your privacy</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Lato-Regular', color: '#444', marginBottom: 16 }}>
              This app requests access to your contacts (with your permission) to help you invite colleagues and work better together. We never access your full contact list without your approval.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              {/* Uncomment to show a Cancel option: */}
              {/* <TouchableOpacity onPress={handleUserCancel} style={{ paddingVertical: 10, paddingHorizontal: 12, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#074173' }}>Not now</Text>
              </TouchableOpacity> */}
              <TouchableOpacity onPress={handleAccept} style={{ backgroundColor: '#074173', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#fff' }}>Agree and Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <StatusBar translucent={false} backgroundColor={'#ffffff'} barStyle='dark-content' />
      <View style={styles.backgroundContainer}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require("../assets/Eofficelogo.png")}
                  resizeMode="contain"
                  style={styles.logo}
                />
              </View>
            </View>
            
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.appNameText}>E-Office</Text>
              <Text style={styles.subtitleText}>Your digital workspace solution</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <View style={styles.tabWrapper}>
              <TouchableOpacity onPress={() => setActiveTab('Group')} 
                style={[ styles.tabButton, activeTab === 'Group' && styles.activeTabButton ]} >
                <MaterialIcons name="group" size={20} color={activeTab === 'Group' ? '#fff' : '#666'} />
                <Text style={[ styles.tabText, activeTab === 'Group' && styles.activeTabText ]}>
                  Group
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setActiveTab('Client')} style={[ styles.tabButton, activeTab === 'Client' && styles.activeTabButton ]} >
                <MaterialIcons name="person" size={20} color={activeTab === 'Client' ? '#fff' : '#666'} />
                <Text style={[ styles.tabText, activeTab === 'Client' && styles.activeTabText ]}>
                  Client
                </Text>
              </TouchableOpacity>
              
              {/* <TouchableOpacity onPress={() => setActiveTab('Employee')} style={[ styles.tabButton, activeTab === 'Employee' && styles.activeTabButton ]}>
                <MaterialIcons name="work" size={20} color={activeTab === 'Employee' ? '#fff' : '#666'} />
                <Text style={[ styles.tabText, activeTab === 'Employee' && styles.activeTabText ]}>
                  Employee
                </Text>
              </TouchableOpacity> */}
            </View>
          </View>
          {/* Form Section */}
          <View style={styles.formContainer}>
            {
              activeTab === 'Client' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your email"
                        value={userName}
                        onChangeText={value => setUserName(value)}
                        placeholderTextColor="#999"
                        style={styles.textInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={value => setPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={showPass}
                        style={styles.textInput}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPass(!showPass)} 
                        style={styles.eyeIcon}
                      >
                        <Ionicons 
                          name={showPass ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color="#074173" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : activeTab === 'Group' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Group Name</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="business-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter group name"
                        value={groupId}
                        onChangeText={value => setGroupId(value)}
                        autoCapitalize="characters"
                        placeholderTextColor="#999"
                        style={styles.textInput}
                      />
                      {isLoading && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#074173" />
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Select Client</Text>
                    <SelectDropdown
                      data={clientList.length === 0 ? [{ fullName: 'No Client has this User ID' }] : clientList}
                      disabled={!groupId}
                      onPress={() => !groupId && showToast('Alert', 'Please fill in the Group ID first')}
                      onSelect={(clientList, index) => {
                        setUserName(clientList.email);
                      }}
                      renderButton={(clientList, isOpened) => {
                        return (
                          <View style={styles.modernDropdownButton}>
                            <Ionicons name="person-outline" size={20} color="#074173" style={styles.inputIcon} />
                            <Text style={styles.modernDropdownText}>
                              {(clientList && clientList?.fullName) || 'Select Client'}
                            </Text>
                            <Ionicons 
                              name={isOpened ? 'chevron-up' : 'chevron-down'} 
                              size={20} 
                              color="#074173" 
                            />
                          </View>
                        );
                      }}
                      renderItem={(clientList, index, isSelected) => {
                        return (
                          <View style={[styles.modernDropdownItem, isSelected && styles.selectedDropdownItem]}>
                            <Text style={styles.modernDropdownItemText}>{clientList.fullName}</Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.modernDropdownMenu}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={value => setPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={showPass}
                        style={styles.textInput}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPass(!showPass)} 
                        style={styles.eyeIcon}
                      >
                        <Ionicons 
                          name={showPass ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color="#074173" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your email"
                        value={userName}
                        onChangeText={value => setUserName(value)}
                        placeholderTextColor="#999"
                        style={styles.textInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#074173" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={value => setPassword(value)}
                        placeholderTextColor="#999"
                        secureTextEntry={showPass}
                        style={styles.textInput}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPass(!showPass)} 
                        style={styles.eyeIcon}
                      >
                        <Ionicons 
                          name={showPass ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color="#074173" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )
            }
          </View>
          {/* Forgot Password */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPass')} 
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <View style={styles.loginButtonContainer}>
            {activeTab === 'Employee' ? (
              <TouchableOpacity 
                onPress={empLogin} 
                disabled={isLoading || fcmTokenLoading} 
                style={[styles.loginButton, (isLoading || fcmTokenLoading) && styles.disabledButton]}
              >
                <View style={styles.loginButtonContent}>
                  {(isLoading || fcmTokenLoading) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.loginIcon} />
                      <Text style={styles.loginButtonText}>Login</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => handleLogin()} 
                disabled={login_loading || fcmTokenLoading} 
                style={[styles.loginButton, (login_loading || fcmTokenLoading) && styles.disabledButton]}
              >
                <View style={styles.loginButtonContent}>
                  {(login_loading || fcmTokenLoading) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.loginIcon} />
                      <Text style={styles.loginButtonText}>Login</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
         <View style={{ width:'100%', alignSelf:'center', bottom:20, position:'absolute' }} >
             <Text style={{ color: '#000', fontSize:10, fontFamily:"Lato-Medium", textAlign:'center' }} >By continuing, you agree to our <Text onPress={() => navigation.navigate('TermCondition')} style={{ color: "#999", fontSize:10, fontFamily:'Lato-Medium', textAlign:'center' }} >Term</Text> & <Text onPress={() => navigation.navigate('Privacy')} style={{ color: "#999", fontSize:10, fontFamily:'Lato-Medium', textAlign:'center' }} >Privacy Policy</Text> </Text>
         </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main Container Styles
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header Section Styles
  headerSection: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoWrapper: {
    // backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    // borderWidth: 1,
    // borderColor: '#e9ecef',
  },
  logo: {
    width: 120,
    height: 50,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'Lato-Light',
    color: '#333',
    marginBottom: 0,
  },
  appNameText: {
    fontSize: 24,
    fontFamily: 'Lato-Bold',
    color: '#074173',
    marginBottom: 1,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#666',
    textAlign: 'center',
  },

  // Tab Selector Styles
  tabContainer: {
    marginBottom: 15,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: '#074173',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
  },

  // Form Container Styles
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  loadingContainer: {
    padding: 8,
  },

  // Modern Dropdown Styles
  modernDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernDropdownText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#333',
    marginLeft: 12,
  },
  modernDropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modernDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  selectedDropdownItem: {
    backgroundColor: '#f8f9fa',
  },
  modernDropdownItemText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#333',
  },

  // Forgot Password Styles
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#074173',
    textDecorationLine: 'underline',
  },

  // Login Button Styles
  loginButtonContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: '#074173',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabledButton: {
    opacity: 0.8,
  },
  loginIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
  },

  // Legacy dropdown styles (keeping for compatibility)
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
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