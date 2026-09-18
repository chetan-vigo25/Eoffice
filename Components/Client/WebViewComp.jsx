import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, Text, TouchableOpacity, ToastAndroid, BackHandler, Platform, ActivityIndicator, Image } from "react-native";
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

// Collapses the empty whitespace the web page renders below its top navbar.
// The portal is a SPA, so we install a persistent <style> and re-apply for a
// few seconds while the app mounts. Add more selectors here if the gap persists.
const REMOVE_TOP_GAP_CSS = `
  html, body { margin: 0 !important; padding-top: 0 !important; }
  body > :first-child { margin-top: 0 !important; }
`;

const REMOVE_TOP_GAP_JS = `
  (function () {
    function applyFix() {
      try {
        if (!document.head) return;
        if (!document.getElementById('rn-gap-fix')) {
          var style = document.createElement('style');
          style.id = 'rn-gap-fix';
          style.innerHTML = ${JSON.stringify(REMOVE_TOP_GAP_CSS)};
          document.head.appendChild(style);
        }
        if (!document.querySelector('meta[name="viewport"]')) {
          var m = document.createElement('meta');
          m.name = 'viewport';
          m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
          document.head.appendChild(m);
        }
      } catch (e) {}
    }
    applyFix();
    var tries = 0;
    var iv = setInterval(function () { applyFix(); if (++tries > 10) clearInterval(iv); }, 500);
  })();
  true;
`;

export default function WebViewComp() {
  
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [canGoBackWeb, setCanGoBackWeb] = useState(false);
  const [webviewKey, setWebviewKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const isLoggingOut = useRef(false);
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
      if (isLoggingOut.current) {
        return false;
      }
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
      // Only intercept a back gesture (the stack dispatches POP for the swipe,
      // GO_BACK for the header/hardware button). A logout uses navigation.reset,
      // which must never be blocked or the screen stays mounted with no token.
      const actionType = e.data?.action?.type;
      if (isLoggingOut.current || (actionType !== 'POP' && actionType !== 'GO_BACK')) {
        return;
      }
      if (Platform.OS === 'ios' && canGoBackWeb && webviewRef.current) {
        e.preventDefault();
        webviewRef.current.goBack();
      }
    });

    return unsubscribe;
  }, [canGoBackWeb]);

  // Wipe the page's own session so a re-login always starts fresh
  const clearWebViewSession = () => {
    if (!webviewRef.current) return;
    webviewRef.current.injectJavaScript(`
      try {
        window.localStorage && window.localStorage.clear();
        window.sessionStorage && window.sessionStorage.clear();
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
  };

  // Clear every trace of the session and send the user back to the login screen
  const goToSplash = async () => {
    isLoggingOut.current = true;
    setLoggingOut(true);
    clearWebViewSession();
    await AsyncStorage.multiRemove(['authToken', 'userData', 'checkInData', 'attendanceRecordId']);
    setToken(null);
    setWebViewLoading(true);
    setWebviewKey(prev => prev + 1);
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  // Back arrow — clear session so re-login starts fresh
  const handleGoBack = async () => {
    isLoggingOut.current = true;
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
    if (isLoggingOut.current) return;

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      // Nothing to revoke — the session is already gone, just go back to login
      await goToSplash();
      return;
    }

    isLoggingOut.current = true;
    setLoggingOut(true);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: null,
      redirect: "follow"
    };

    try {
      const response = await fetch(`${BASE_URL}/admin/logout`, requestOptions);
      const text = await response.text();
      let result = null;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
      }
      if (result?.message) {
        showToast(result.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Whatever the API said, the local session must not survive a logout tap
    await goToSplash();
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOGOUT') {
        await goToSplash();
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={require('../../assets/viLogo.png')} style={{ width: 40, height: 40 }} />
            {/* <Text style={{ color: '#fff', fontFamily: 'Lato-SemiBold', fontSize: 16 }}>VI-EASY </Text>SJE_KB_0137 */}
            {/* <Text style={{ color: '#7ac943', fontFamily: 'Lato-SemiBold', fontSize: 16 }}>MY OFFICE</Text> */}
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, height: 40, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Lato-SemiBold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        {loading || loggingOut ? (
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
              injectedJavaScript={REMOVE_TOP_GAP_JS}
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
