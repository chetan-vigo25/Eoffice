import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, Text, TouchableOpacity, ToastAndroid, BackHandler, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import BASE_URL, { WEBVIEW_BASE_URL } from '../../Urls/DomainUrl';
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
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [canGoBackWeb, setCanGoBackWeb] = useState(false);
  const [webviewKey, setWebviewKey] = useState(0);
  const canExit = useRef(false);
  const webviewRef = useRef(null);
  const exitTimer = useRef(null);
  const loadingTimeout = useRef(null);
  const navigation = useNavigation();

  // Load token from storage
  const loadToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
        // console.log(savedToken);
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

  // Android Back Button Handler+
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
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
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

  // Back arrow — clear session so re-login starts fresh
  const handleGoBack = async () => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        try {
          window.localStorage && window.localStorage.clear();
          window.sessionStorage && window.sessionStorage.clear();
        } catch(e) {}
        true;
      `);
    }
    await AsyncStorage.multiRemove(['authToken', 'userData', 'checkInData', 'attendanceRecordId']);
    navigation.goBack();
  };

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
            // Clear all auth data before navigating so Splash's autoLoginCheck finds nothing
            await AsyncStorage.multiRemove(["authToken", "userData", "checkInData", "attendanceRecordId"]);

            // Proactively clear WebView storage/cookies in-page (cross-platform)
            if (webviewRef.current) {
              webviewRef.current.injectJavaScript(`
                try {
                  // Clear local/session storage
                  window.localStorage && window.localStorage.clear();
                  window.sessionStorage && window.sessionStorage.clear();
                  // Clear cookies by expiring them
                  if (document && document.cookie) {
                    document.cookie.split(';').forEach(function(c) {
                      document.cookie = c
                        .replace(/^\s+/, '')
                        .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/;SameSite=Lax');
                    });
                  }
                } catch (e) {}
                true;
              `);
            }
            // Reset local state and remount WebView to drop any cache/history
            setToken(null);
            setWebViewLoading(true);
            setWebviewKey(prev => prev + 1);
            showToast(result.message);
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          } else {
            showToast(result.message);
          }
        } catch (err) {
          console.error("Failed to parse JSON:", text);
        }
      })
      .catch((error) => console.error("Logout error:", error));
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOGOUT') {
        // Clear storage before navigating so Splash's autoLoginCheck finds no session
        await AsyncStorage.multiRemove(["authToken", "userData", "checkInData", "attendanceRecordId"]);
        setToken(null);
        setWebViewLoading(true);
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      }
    } catch (e) {
      console.log('Invalid message from WebView', e);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar translucent={false} backgroundColor={'#074173'} barStyle='light-content' />
      {/* Header */}
      <View style={{ flexDirection: 'row', width: '100%', backgroundColor: '#074173', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
        <View style={{ flexDirection:'row', gap:10, }} >
          {/* <TouchableOpacity onPress={handleGoBack} style={{ width:20, height:20, justifyContent:'center' }} >
             <AntDesign name="arrowleft" size={20} color="#fff" />
          </TouchableOpacity> */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: 'Lato-SemiBold', fontSize: 16 }}>EASY </Text>
            <Text style={{ color: '#7ac943', fontFamily: 'Lato-SemiBold', fontSize: 16 }}>MY OFFICE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, height: 40, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Lato-SemiBold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#074173" />
            <Text style={{ marginTop: 10, fontSize: 16, fontFamily: 'Lato-Medium', color: '#074173' }}>Loading...</Text>
          </View>
        ) : token ? (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webviewRef}
              key={`${token}-${webviewKey}`}
              originWhitelist={['*']}
              source={{ uri: `${WEBVIEW_BASE_URL}/login/${token}`}}
              style={{ flex: 1 }}
              sharedCookiesEnabled={false}
              thirdPartyCookiesEnabled={false}
              incognito={true}
              cacheEnabled={true}
              javaScriptCanOpenWindowsAutomatically={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handleMessage}
              onNavigationStateChange={(navState) => {
                setCanGoBackWeb(navState.canGoBack);
                // Android-specific loading state management
                if (Platform.OS === 'android') {
                  if (navState.loading) {
                    setWebViewLoading(true);
                  } else {
                    setWebViewLoading(false);
                  }
                }
              }}
              onLoadStart={() => {
                setWebViewLoading(true);
                // Android timeout fallback
                if (Platform.OS === 'android') {
                  if (loadingTimeout.current) {
                    clearTimeout(loadingTimeout.current);
                  }
                  loadingTimeout.current = setTimeout(() => {
                    setWebViewLoading(false);
                  }, 10000); // 10 second timeout
                }
              }}
              onLoadEnd={() => {
                setWebViewLoading(false);
                if (loadingTimeout.current) {
                  clearTimeout(loadingTimeout.current);
                }
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                setWebViewLoading(false);
                if (loadingTimeout.current) {
                  clearTimeout(loadingTimeout.current);
                }
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error: ', nativeEvent);
                setWebViewLoading(false);
                if (loadingTimeout.current) {
                  clearTimeout(loadingTimeout.current);
                }
              }}
              startInLoadingState={true}
              // Android-specific props
              {...(Platform.OS === 'android' && {
                mixedContentMode: 'compatibility',
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
              })}
            />
            
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Lato-Medium', color: '#074173' }}>Please log in again.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
