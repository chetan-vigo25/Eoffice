import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StatusBar, ScrollView, Image, TouchableOpacity, Dimensions, BackHandler, ToastAndroid, StyleSheet, Animated, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { personalInfo } from "../../Redux/Reducer/Client/Client.Reducer";
import NotificationBell from './NotificationBell';

import { useContacts } from '../../Context/Contact';
import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Feather, MaterialCommunityIcons, FontAwesome5, Ionicons, FontAwesome } from "@expo/vector-icons";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function ClientDash({ navigation, route }) {

  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { userData } = route.params;
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState(moment().format('hh:mm:ss A'));
  const logoutHandled = useRef(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animations
  const greetAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(greetAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dashData = [
    { id: 1, screen: 'PersonalInfo', name: 'Profile', iconColor: '#FF6B6B', img: require('../../assets/Images/dashImage/profile.png') },
    { id: 2, screen: 'TaskManagement', name: 'Tasks', iconColor: '#7454ff', img: require('../../assets/Images/dashImage/Task.png') },
    { id: 3, screen: 'InvoiceList', name: 'Invoices', iconColor: '#FF8F61', img: require('../../assets/Images/dashImage/Invoice.png') },
    { id: 4, screen: 'StatementsTrans', name: 'Transactions', iconColor: '#2AC3FF', img: require('../../assets/Images/dashImage/transaction.png') },
    { id: 5, screen: 'AdvancedList', name: 'Advance', iconColor: '#5A6AFF', img: require('../../assets/Images/dashImage/Advance.png') },
    { id: 6, screen: 'MyDocuments', name: 'Documents', iconColor: '#73C2FB', img: require('../../assets/Images/dashImage/Document.png') },
    { id: 7, screen: 'AddAdvance', name: 'Pay Advance', iconColor: '#00CEC9', img: require('../../assets/Images/dashImage/payadvance.png') },
    { id: 8, screen: 'VisitHistory', name: 'Visit History', iconColor: '#FF7675', img: require('../../assets/Images/dashImage/map.png') },
  ];

  const navigateToScreen = (screen) => {
    navigation.navigate(screen, { userData });
  };

  const getInvoiceList = async () => {
    if (logoutHandled.current) return;
    setLoading(true);
    let token = await AsyncStorage.getItem("token");
    if (!token) {
      navigation.navigate('Splash');
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": 'PendingPayment',
      "departmentId": "",
      "isPagination": false,
      "date": '',
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`${BASE_URL}/client/invoice/list`, requestOptions)
     .then((response) => response.json())
      .then(async (result) => {
        if (result.statusCode === 200) {
          const paidInvoicesData = result.data.docs.filter(invoice => invoice.status === "Paid");
          const unpaidInvoicesData = result.data.docs.filter(invoice => invoice.status === "PendingPayment");
          setPaidInvoices(paidInvoicesData || []);
          setUnpaidInvoices(unpaidInvoicesData || []);
          setLoading(false);
        } else if (result.statusCode === 401) {
          console.log("🔒 Unauthorized - Token may be invalid or expired");
          dispatch(logout());
          await AsyncStorage.removeItem('token');
          await AsyncStorage.clear();
          navigation.navigate('Splash');
          setLoading(false);
        } else {
          showToast(result.message || "Something went wrong.");
          setLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }

  const canExit = useRef(false);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', _backHandler);
    return () => backHandler.remove();
  }, []);

  const _backHandler = () => {
    if (navigation.isFocused()) {
      if (canExit.current) {
        return false;
      } else {
        canExit.current = true;
        ToastAndroid.show('Double tap to exit', ToastAndroid.SHORT);
        setTimeout(() => {
          canExit.current = false;
        }, 750);
        return true;
      }
    } else {
      return false;
    }
  };

  useEffect(() => {
    getInvoiceList();
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      getInvoiceList();
    }, [])
  );

  const totalUnpaidAmount = unpaidInvoices.reduce((sum, invoice) => {
    return sum + (invoice.grandTotal || 0);
  }, 0);
  
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return "Good Morning";
    } else if (currentHour < 18) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  const getIconComponent = (iconType, iconName, size, color) => {
    switch (iconType) {
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      case 'Feather':
        return <Feather name={iconName} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={iconName} size={size} color={color} />;
      case 'FontAwesome':
        return <FontAwesome name={iconName} size={size} color={color} />;
      default:
        return <Feather name={iconName} size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
      <StatusBar translucent backgroundColor={'transparent'} barStyle='light-content' />

      {/* Header Background (extends behind the status bar) */}
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.headerContent, { transform: [{ scale: headerScale }] }]}>
          <View style={styles.greetingRow}>
            <View style={{ flex:7, flexDirection:'row', alignItems:'center'}}>
              <View style={{ flex:1.5,}} >
                <View style={{ width:40, height:40, alignItems:'center' }} >
                <Image source={require('../../assets/viLogo.png')} style={{width:40, height:40}} />
              </View>
              </View>
            </View>
            {/* <View style={{ flex:1, }}>
            <View style={styles.logoContainer}>
              {userData?.logo?
              <Image source={{uri: userData?.logo}} style={styles.logoImage} />:
              <View style={{ width:150, height:150, }} >
                <Image source={require('../../assets/viLogo.png')} style={styles.logoImage} />
              </View>
              }
               
             </View>
            </View> */}
             <View style={{ flex:3, alignItems:'flex-end' }}>
              <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Support')} style={styles.actionBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="headset" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Notifikation')} style={styles.actionBtn} activeOpacity={0.7}>
                <NotificationBell navigation={navigation} />
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Animated.View>
       
        <View style={styles.greetingContainer}>
           <Text  numberOfLines={1} ellipsizeMode='tail' style={ [styles.userName, {textAlign:'center', fontSize:24}] } >{userData?.companyName || ''}</Text>
          <Text style={styles.greetName}>{getGreeting()},</Text>
          <Text numberOfLines={1} ellipsizeMode='tail' style={styles.userName}>{userData?.fullName || ''}!</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateWrapper}>
              <Feather name="calendar" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.dateText}>{moment().format('DD MMM YYYY')}</Text>
            </View>
            <View style={styles.timeWrapper}>
              <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.timeText}>{currentTime}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Invoice Summary Card */}
      <Animated.View style={[styles.summaryContainer, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
        <TouchableOpacity onPress={() => navigation.navigate('UnPaidInvoice')} activeOpacity={0.9}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Image source={require('../../assets/DollarCoin.png')} resizeMode='contain' style={{ width: 50, height: 50 }} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Total Dues</Text>
              <Text style={styles.summaryAmount}>
                {unpaidInvoices.length === 0
                  ? "No Dues"
                  : `₹ ${totalUnpaidAmount.toLocaleString('en-IN')}`}
              </Text>
              <View style={styles.summaryBadge}>
                <Feather name="clock" size={10} color="#FF8F61" />
                <Text style={styles.summaryBadgeText}>
                  {unpaidInvoices.length} pending {unpaidInvoices.length === 1 ? 'invoice' : 'invoices'}
                </Text>
              </View>
            </View>
            <View style={styles.summaryArrow}>
              <Feather name="chevron-right" size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Dashboard Grid */}
      <Animated.View style={[styles.gridContainer, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
        {/* <View style={styles.gridHeader}>
          <Text style={styles.gridTitle}>Quick Access</Text>
          <View style={styles.gridHeaderLine} />
        </View> */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.gridScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.gridWrap}>
            {dashData.map((item, index) => {
              const isDisabled = item.id === 5 && userData?.isGroupOwner === false;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => isDisabled ? showToast('Only the group owner has access') : navigateToScreen(item.screen)}
                  style={styles.dashCard}
                  activeOpacity={0.85}
                >
                  <View style={ {  }}>
                    {item.img ? (
                      <Image source={item.img} resizeMode='contain' style={{ width: 60, height: 60 }} />
                    ) : (
                      getIconComponent(item.iconType, item.icon, 28, item.iconColor)
                    )}
                  </View>
                  <Text style={[styles.dashCardTitle, { color: Style.primaryTextColor }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerBackground: {
    backgroundColor: Style.headerBgColor,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    paddingBottom: 40,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 4 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 6,
    //   },
    // }),
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  logoImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop:10,
  },
  greetName: {
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Lato-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 5,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  summaryIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
    marginBottom: 6,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    color: '#FF8F61',
  },
  summaryArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Style.headerBgColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  gridHeader: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  gridTitle: {
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
    color: Style.primaryTextColor,
    marginBottom: 4,
  },
  gridHeaderLine: {
    width: 40,
    height: 3,
    backgroundColor: Style.headerBgColor,
    borderRadius: 2,
  },
  gridScrollContent: {
    paddingBottom: 20,
  },
  gridWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  dashCard: {
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      },
    }),
  },
  dashIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashCardTitle: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    textAlign: 'center',
    lineHeight: 18,
  },
});