import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, View, Text, Dimensions, Image, ToastAndroid, Alert, Platform, NativeModules, } from 'react-native';

import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import Icon from 'react-native-vector-icons/Ionicons';

// import Login from './Components/Login';
import Splash from './Components/Splash';

import ClientDash from './Components/Client/ClientDash';
import PersonalInfo from './Components/Client/PersonalInfo/PersonalInfo';
import PersonalDetail from './Components/Client/PersonalInfo/PersonalDetail';
import OwnerDetail from './Components/Client/PersonalInfo/OwnerDetail';
import ContactDetail from './Components/Client/PersonalInfo/ContactDetail';
import BankDetail from './Components/Client/PersonalInfo/BankDetail';
import DigitalSign from './Components/Client/PersonalInfo/DigitalSign';
import ClientBranch from './Components/Client/PersonalInfo/ClientBranch';
import ClientService from './Components/Client/PersonalInfo/ClientService';

import TaskManagement from './Components/Client/Task/TaskManagement';
import TaskSummary from './Components/Client/Task/TaskSummary';
import InvoiceList from './Components/Client/Invoice/InvoiceList';
import InvoiceDetail from './Components/Client/Invoice/InvoiceDetail';
import TransactionList from './Components/Client/Transaction/TransactionList';
import TransDetail from './Components/Client/Transaction/TransDetail';
import TransferSuccess from './Components/Client/Transaction/TransferSuccess';
import TransPaidDetail from './Components/Client/Transaction/TransPaidDetail';
import AdvancedList from './Components/Client/Advance/AdvancedList';
import MyDocuments from './Components/Client/Documents/MyDocuments';
import RegDocument from './Components/Client/Documents/RegDocument';
import FinDocument from './Components/Client/Documents/FinDocument';
import Support from './Components/Client/Support';
import SupportCreate from './Components/Client/SupportCreate';
import SupportChat from './Components/Client/SupportChat';
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
import WebViewComp from './Components/Client/WebViewComp';
import NoInternetScreen from './Components/Client/NoInternetScreen';
import Statements from './Components/Client/Statements';
import AddAdvance from './Components/Client/AddAdvance';
import AdvancedPaymentDetail from './Components/Client/AdvancedPaymentDetail';
import Autologin from './Components/Autologin';
import StatementsTrans from './Components/Client/Transaction/StatementsTrans';
import UnPaidInvoice from './Components/Client/Invoice/UnPaidInvoice';
{/* EMPLOYEE SCREEN */}
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


import { DeviceLocationProvider } from './Context/DeviceLoc';
import { DeviceInfoProvider } from './Context/DeviceInfoContext';
import { ContactsProvider } from './Context/Contact';
import { NetworkProvider } from './Context/NetworkContext';
import { EmployeeDashboardProvider } from './Context/EmployeeDashboardContext';
import { UserProvider } from './Context/UserProvider';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './Redux/Reducer/Auth/Auth.reducers';

import * as Notifications from 'expo-notifications';
import 'react-native-gesture-handler';
import { TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

const { StatusBarManager } = NativeModules;
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? 30 : StatusBarManager?.HEIGHT || 4;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
})

export default function App() {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const wasConnectedRef = React.useRef(true);

  useEffect(() => {
    requestUserPermission();
    // Foreground notification listener
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      // Handle foreground notification
      // Alert.alert(title, body);
    });

    // Handle notification when app is opened from notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const { title, body } = response.notification.request.content;
        // Handle initial notification
        // Alert.alert(title, body);
      }
    });

    // Cleanup
    return () => subscription.remove();
  }, []);

  // Request permission for notifications 
  const requestUserPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('Notification permission granted!');
        const token = await Notifications.getDevicePushTokenAsync();
        console.log("fcmToken---", token.data);
      } else {
        console.log('Notification permission denied.');
      }
    } catch (error) {
      console.error('Permission request failed', error);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const nowConnected = !!state.isConnected;
      if (nowConnected && !wasConnectedRef.current) {
        // Coming back online — remount the navigator with a fresh key
        setRefreshKey(prev => prev + 1);
      }
      wasConnectedRef.current = nowConnected;
      setIsConnected(nowConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    const state = await NetInfo.fetch();
    setIsRetrying(false);
    if (state.isConnected) {
      wasConnectedRef.current = true;
      setIsConnected(true);
      setRefreshKey(prev => prev + 1);
    }
  };

  const [fontsLoaded] = useFonts({
    'Roboto-Bold': require('./assets/Fonts/Roboto-Bold.ttf'), 
    'Roboto-Light': require('./assets/Fonts/Roboto-Light.ttf'), 
    'Roboto-Medium': require('./assets/Fonts/Roboto-Medium.ttf'), 
    'Roboto-Regular': require('./assets/Fonts/Roboto-Regular.ttf'), 
    'Roboto-SemiBold': require('./assets/Fonts/Roboto-SemiBold.ttf'), 
    'Lato-Regular': require('./assets/Fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('./assets/Fonts/Lato-Bold.ttf'),
    'Lato-Light': require('./assets/Fonts/Lato-Light.ttf'),
    'Lato-Medium': require('./assets/Fonts/Lato-Regular.ttf'),
    'Lato-SemiBold': require('./assets/Fonts/Lato-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
       <ContactsProvider>
        <NetworkProvider>
          <StatusBar translucent backgroundColor={'transparent'} barStyle='light-content' />
           {
             isConnected ? 
               <NavigationContainer key={refreshKey} >
                    <UserProvider>
                      <EmployeeDashboardProvider>
                        <MyStack />
                      </EmployeeDashboardProvider>
                    </UserProvider>
               </NavigationContainer>
             : 
               <NoInternetScreen onRetry={handleRetry} isRetrying={isRetrying} />
           }
        </NetworkProvider>
       </ContactsProvider>
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
      <Stack.Screen name="ClientBranch" component={ClientBranch} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="ClientService" component={ClientService} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TaskManagement" component={TaskManagement} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TaskSummary" component={TaskSummary} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="InvoiceList" component={InvoiceList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransactionList" component={TransactionList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransDetail" component={TransDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransferSuccess" component={TransferSuccess} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="TransPaidDetail" component={TransPaidDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="AdvancedList" component={AdvancedList} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="MyDocuments" component={MyDocuments} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="RegDocument" component={RegDocument} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="FinDocument" component={FinDocument} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Support" component={Support} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="SupportCreate" component={SupportCreate} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="SupportChat" component={SupportChat} options={{ ...TransitionPresets.SlideFromRightIOS }} />
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
      <Stack.Screen name="WebViewComp" component={WebViewComp} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="Statements" component={Statements} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="AddAdvance" component={AddAdvance} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="StatementsTrans" component={StatementsTrans} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="AdvancedPaymentDetail" component={AdvancedPaymentDetail} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      <Stack.Screen name="UnPaidInvoice" component={UnPaidInvoice} options={{ ...TransitionPresets.SlideFromRightIOS }} />
      {/* EMPLOYEE SCREEN */}
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
  const userData = route?.params?.userData;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#175a93',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 6,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          let iconSize = focused ? 26 : 24;

          switch (route.name) {
            case 'ClientDash':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'ClientMessage':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Events':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'ClientProfile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return (
            <Icon
              name={iconName}
              size={iconSize}
              color={color}
              style={styles.icon}
            />
          );
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen name="ClientDash" component={ClientDash} options={{ tabBarLabel: 'Dashboard', }} initialParams={{ userData }} />
      <Tab.Screen name="ClientMessage" component={ClientMessage} options={{ tabBarLabel: 'Messages', }} />
      <Tab.Screen name="Events" component={Events} options={{ tabBarLabel: 'Events', }} initialParams={{ userData }} />
      <Tab.Screen name="ClientProfile" component={ClientProfile} options={{ tabBarLabel: 'Profile', }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    height: 70,
    paddingBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  icon: {
    marginBottom: -2,
  },
});