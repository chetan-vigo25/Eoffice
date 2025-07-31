import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, StatusBar, Text, TouchableOpacity, ToastAndroid, BackHandler, Platform, ActivityIndicator } from "react-native";
import { WebView } from 'react-native-webview';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { MaterialIcons, AntDesign } from "@expo/vector-icons";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, you could integrate a Toast library like react-native-toast-message
    console.log("Toast:", message);
  }
}

export default function WebViewComp() {
  
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canGoBackWeb, setCanGoBackWeb] = useState(false);
  const canExit = useRef(false);
  const webviewRef = useRef(null);
  const exitTimer = useRef(null);
  const navigation = useNavigation();

  // Load token from storage
  const loadToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
      } else {
        console.log('⛔ No token found.');
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToken();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadToken();
    }, [])
  );

  // Android Back Button Handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackWeb && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }

      if (canExit.current) {
        BackHandler.exitApp();
        return true;
      } else {
        canExit.current = true;
        showToast('Double click to exit App.');
        exitTimer.current = setTimeout(() => {
          canExit.current = false;
        }, 2000);
        return true;
      }
    });

    return () => {
      backHandler.remove();
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
      }
    };
  }, [canGoBackWeb]);

  // iOS back gesture handler
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (Platform.OS === 'ios' && canGoBackWeb && webviewRef.current) {
        e.preventDefault();
        webviewRef.current.goBack();
      }
    });

    return unsubscribe;
  }, [canGoBackWeb]);

  // Logout
  const logout = async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      console.log("No token found");
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: null,
      redirect: "follow"
    };

    fetch(`${BASE_URL}/admin/logout`, requestOptions)
      .then(async (response) => {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.statusCode === 200) {
            await AsyncStorage.removeItem("authToken");
            setToken(null);
            showToast(result.message);
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }]
              });
            }, 500);
          } else {
            showToast(result.message);
          }
        } catch (err) {
          console.error("Failed to parse JSON:", text);
        }
      })
      .catch((error) => console.error("Logout error:", error));
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOGOUT') {
        // Navigate to login screen on logout
        navigation.navigate('Splash');
        console.log('login errr',data)
      }
    } catch (e) {
      console.log('Invalid message from WebView', e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={'#074173'} barStyle='light-content' />

      {/* Header */}
      <View style={{ flexDirection: 'row', width: '100%', backgroundColor: '#074173', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <View style={{ flexDirection:'row', gap:10, }} >
          <TouchableOpacity onPress={()=> navigation.goBack()} style={{ width:20, height:20, justifyContent:'center' }} >
             <AntDesign name="arrowleft" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: 16 }}>EASY </Text>
            <Text style={{ color: '#7ac943', fontFamily: 'Poppins-SemiBold', fontSize: 16 }}>MY OFFICE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, height: 40, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-SemiBold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#074173" style={{ flex: 1 }} />
        ) : token ? (
          <WebView
            ref={webviewRef}
            key={token}
            originWhitelist={['*']}
            source={{ uri: `https://api.easymyoffice.com/login/${token}` }}
            style={{ flex: 1 }}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleMessage}
            onNavigationStateChange={(navState) => {
              setCanGoBackWeb(navState.canGoBack);
            }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>Please log in again.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
