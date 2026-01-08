import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, View, Text, Dimensions, Image, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';

// import Login from './Components/Login';
import Splash from './Components/Splash';
import ClientDash from './Components/Client/ClientDash';
import PersonalInfo from './Components/Client/PersonalInfo/PersonalInfo';
import PersonalDetail from './Components/Client/PersonalInfo/PersonalDetail';
import OwnerDetail from './Components/Client/PersonalInfo/OwnerDetail';
import ContactDetail from './Components/Client/PersonalInfo/ContactDetail';
import BankDetail from './Components/Client/PersonalInfo/BankDetail';
import DigitalSign from './Components/Client/PersonalInfo/DigitalSign';
import TaskManagement from './Components/Client/Task/TaskManagement';
import TaskSummary from './Components/Client/Task/TaskSummary';
import InvoiceList from './Components/Client/Invoice/InvoiceList';
import TransactionList from './Components/Client/Transaction/TransactionList';
import TransDetail from './Components/Client/Transaction/TransDetail';
import TransferSuccess from './Components/Client/Transaction/TransferSuccess';
import TransPaidDetail from './Components/Client/Transaction/TransPaidDetail';
import AdvancedList from './Components/Client/Advance/AdvancedList';
import MyDocuments from './Components/Client/Documents/MyDocuments';
import RegDocument from './Components/Client/Documents/RegDocument';
import FinDocument from './Components/Client/Documents/FinDocument';
import Support from './Components/Client/Support';
import Notifikation from './Components/Client/Notifikation';
import Events from './Components/Client/Events';
import ForgotPass from './Components/ForgotPass';
import VerifyOtp from './Components/VerifyOtp';
import ResetPass from './Components/ResetPass';
import ClientProfile from './Components/Client/ClientProfile';
import ClientMessage from './Components/Client/ClientMessage';
import Privacy from './Components/Privacy';
import TermCondition from './Components/TermCondition';
import VisitHistory from './Components/Client/VisitHistory';
import EmployeeLogin from "./Components/Client/EmployeeLogin"
import WebViewComp from './Components/Client/WebViewComp';
import NoInternetScreen from './Components/Client/NoInternetScreen';
import Statements from './Components/Client/Statements';
import AddAdvance from './Components/Client/AddAdvance';
import Autologin from './Components/AutoLogin';
{/* EMPLOYEE */}
import HrDashboard from './Components/HRMS/HR/HrDashboard';
import EmployeDashboard from './Components/HRMS/Employe/EmployeDashboard';
import ApplyLeave from './Components/HRMS/Employe/ApplyLeave';
import EmployeAttendance from './Components/HRMS/Employe/EmployeAttendance';
import LeaveManagement from './Components/HRMS/Employe/LeaveManagement';
import EmployeWFH from './Components/HRMS/Employe/EmployeWFH';
import Payroll from './Components/HRMS/Employe/Payroll';
import EmployeProfile from './Components/HRMS/Employe/EmployeProfile';
import EmployeChangePass from './Components/HRMS/Employe/EmployeChangePass';
import EmployePaySlip from './Components/HRMS/Employe/EmployePaySlip';
import EmployeIcard from './Components/HRMS/Employe/EmployeIcard';

import { NetworkProvider } from './Context/NetworkContext';
import { DeviceLocationProvider } from './Context/DeviceLoc';
import { MapWebViewProvider } from './Context/MapWebViewContext';
import { EmployeeDashboardProvider } from './Context/EmployeeDashboardContext';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import 'react-native-gesture-handler';
import { TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Style from './Style/Style';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // <-- This makes the pop-up appear
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {

  const [isConnected, setIsConnected] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusBarBg, setStatusBarBg] = useState('#ffffff');
  const navigationRef = useRef(null);

  const getActiveRouteName = (state) => {
    if (!state) return undefined;
    const route = state.routes[state.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  // Global StatusBar fallback for Android 14/15
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor('#ebf1fd', true);
        StatusBar.setBarStyle('dark-content');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    // ✅ Track last messageId to prevent duplicate local pop-up
    let lastMessageId = null;
  
    // Foreground handler
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      const { notification, data, messageId } = remoteMessage;
  
      const title = notification?.title || data?.title || 'Notification';
      const body = notification?.body || data?.body || '';
  
      if (Platform.OS === 'ios') {
        if (messageId === lastMessageId) {
          console.log('Duplicate iOS notification skipped');
          return;
        }
        lastMessageId = messageId;
  
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        });
      }
    });
  
    // Background handler (same logic)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      const { notification, data, messageId } = remoteMessage;
  
      const title = notification?.title || data?.title || 'Notification';
      const body = notification?.body || data?.body || '';
  
      if (Platform.OS === 'ios') {
        if (messageId === lastMessageId) {
          console.log('Duplicate iOS background notification skipped');
          return;
        }
        lastMessageId = messageId;
  
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        });
      }
    });
  
    // Notification when app is in background and user taps it
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      // console.log('App opened from background notification:', remoteMessage);
      const { notification, data } = remoteMessage;
      const title = notification?.title ?? data?.title;
      const body = notification?.body ?? data?.body;
      // Optional: Alert.alert(title, body);
    });
  
    // Notification when app is launched from quit state
    messaging()
     .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          // console.log('App opened by notification at launch:', remoteMessage);
          const { notification, data } = remoteMessage;
          const title = notification?.title ?? data?.title;
          const body = notification?.body ?? data?.body;
          // Optional: Alert.alert(title, body);
        }
      });
  
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    }); 
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const requestUserPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const fcmtoken = await messaging().getToken();
          console.log("fcmToken App---", fcmtoken);
          // Optionally store in state or AsyncStorage
        } else {
          console.log("Notification permission denied.");
        }
      } catch (error) {
        console.error("Permission request failed", error);
      }
    };
    requestUserPermission();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    const state = await NetInfo.fetch();
    setIsRetrying(false);
    if (state.isConnected) {
      setIsConnected(true);
      setRefreshKey(prev => prev + 1);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !isConnected) {
        setIsConnected(true);
        setRefreshKey(prev => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [isConnected]);


// console.log("isConnected", isConnected)

  const [fontsLoaded] = useFonts({
    'Roboto-Bold': require('./assets/Fonts/Roboto-Bold.ttf'), 
    'Roboto-Light': require('./assets/Fonts/Roboto-Light.ttf'), 
    'Roboto-Medium': require('./assets/Fonts/Roboto-Medium.ttf'), 
    'Roboto-Regular': require('./assets/Fonts/Roboto-Regular.ttf'), 
    'Roboto-SemiBold': require('./assets/Fonts/Roboto-SemiBold.ttf'), 
    'Poppins-Regular': require('./assets/Fonts/Poppins-Regular.ttf'), 
    'Poppins-Bold': require('./assets/Fonts/Poppins-Bold.ttf'), 
    'Poppins-Medium': require('./assets/Fonts/Poppins-Medium.ttf'), 
    'Poppins-SemiBold': require('./assets/Fonts/Poppins-SemiBold.ttf'), 
  });

  if (!fontsLoaded) {
    return null;
  }
   
  return (
    <SafeAreaProvider style={{ flex:1 }}>
       <NetworkProvider>
          <StatusBar translucent={false} backgroundColor={statusBarBg} barStyle='dark-content' />
        <SafeAreaView
          style={{ flex: 1, backgroundColor:'transparent' }}
          edges={['left','right','bottom']}
        >
         {
            isConnected ? 
              <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0, backgroundColor: statusBarBg }}>
                <NavigationContainer
                  ref={navigationRef}
                  key={refreshKey}
                  onStateChange={(state) => {
                    const routeName = getActiveRouteName(state);
                    if (routeName === 'Splash') {
                      setStatusBarBg('#ffffff');
                    } else if (routeName === 'ClientDash') {
                      setStatusBarBg("#ebf1fd");
                    } else if (routeName === 'WebViewComp') {
                      setStatusBarBg('#074173');
                    } else {
                      setStatusBarBg(Style.headerBgColor);
                    }
                  }}
                >
                  <EmployeeDashboardProvider>
                    <MapWebViewProvider>
                      <MyStack />
                    </MapWebViewProvider>
                  </EmployeeDashboardProvider>
                </NavigationContainer>
              </View>
            : 
              <NoInternetScreen onRetry={handleRetry} isRetrying={isRetrying} />
          }
         </SafeAreaView>
       </NetworkProvider>
    </SafeAreaProvider>
  );
}

function MyStack ({ route }){
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Autologin" component={Autologin} />
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="ClientDash" component={MyTabs} options={{ ...TransitionPresets.SlideFromRightIOS }} initialParams={{ userData: route?.params?.userData }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfo} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="PersonalDetail" component={PersonalDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="OwnerDetail" component={OwnerDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ContactDetail" component={ContactDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="BankDetail" component={BankDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="DigitalSign" component={DigitalSign} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TaskManagement" component={TaskManagement} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TaskSummary" component={TaskSummary} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="InvoiceList" component={InvoiceList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransactionList" component={TransactionList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransDetail" component={TransDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransferSuccess" component={TransferSuccess} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransPaidDetail" component={TransPaidDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="AdvancedList" component={AdvancedList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="MyDocuments" component={MyDocuments} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="RegDocument" component={RegDocument} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="FinDocument" component={FinDocument} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Support" component={Support} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Notifikation" component={Notifikation} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Events" component={Events} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ForgotPass" component={ForgotPass} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtp} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ResetPass" component={ResetPass} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ClientProfile" component={ClientProfile} options={{ ...TransitionPresets.SlideFromRightIOS }}  />
      <Stack.Screen name="ClientMessage" component={ClientMessage} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Privacy" component={Privacy} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TermCondition" component={TermCondition} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="VisitHistory" component={VisitHistory} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeeLogin" component={EmployeeLogin} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="WebViewComp" component={WebViewComp} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Statements" component={Statements} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="AddAdvance" component={AddAdvance} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      {/* EMPLOYEE */}
      <Stack.Screen name="HrDashboard" component={HrDashboard} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeDashboard" component={EmployeDashboard} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeave} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeAttendance" component={EmployeAttendance} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="LeaveManagement" component={LeaveManagement} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeWFH" component={EmployeWFH} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Payroll" component={Payroll} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeProfile" component={EmployeProfile} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeChangePass" component={EmployeChangePass} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployePaySlip" component={EmployePaySlip} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="EmployeIcard" component={EmployeIcard} options={{ ...TransitionPresets.SlideFromRightIOS }} />
    </Stack.Navigator>
  )
}

function MyTabs({ route }) {
  const insets = useSafeAreaInsets();
  const userData = route?.params?.userData;
  return (
      <Tab.Navigator screenOptions={{ tabBarLabelStyle:{ fontSize:10, paddingBottom:0, paddingTop:20 }, headerShown:false, tabBarStyle:{ backgroundColor:'#fff', height: 0 }, tabBarShowLabel:false, tabBarActiveTintColor: '#175a93', tabBarInactiveTintColor: "grey",}}>
          <Tab.Screen name="ClientDash" component={ClientDash} options={{'tabBarLabel':"EmpDasboard", 'tabBarIcon': ( ({focused, color}) => (
             <Image source={focused?require('./assets/home-active.png'):require('./assets/home-inactive.png')} style={{width:focused?50:25, height:focused?50:25}} />
          ))}} initialParams={{ userData }} />
          <Tab.Screen name="ClientMessage" component={ClientMessage} options={{'tabBarLabel':"", 'tabBarIcon': ( ({focused, color}) => (
             <Image source={focused?require('./assets/contactActive.png'):require('./assets/contactInactve.png')} style={{width:focused?22:22, height:focused?22:22}} />
          ))}}/>
          <Tab.Screen name="Events" component={Events} options={{'tabBarLabel':"", 'tabBarIcon': ( ({focused, color}) => (
             <Image source={focused?require('./assets/calendarActive.png'):require('./assets/calendar-inactive.png')} style={{width:focused?50:25, height:focused?50:25}} />
          ))}} initialParams={{ userData }} />
          <Tab.Screen name="ClientProfile" component={ClientProfile} options={{'tabBarLabel':"", 'tabBarIcon': ( ({focused, color}) => (
             <Image source={focused?require('./assets/userActive.png'):require('./assets/userInactive.png')} style={{width:focused?50:25, height:focused?50:25}} />
          ))}}/>
      </Tab.Navigator>  
  );
}
