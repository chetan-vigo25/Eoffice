import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StatusBar, ScrollView, Image, Platform, Alert, TouchableOpacity, Dimensions, BackHandler, ToastAndroid, StyleSheet, Animated } from "react-native";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { personalInfo } from "../../Redux/Reducer/Client/Client.Reducer";

import { useContacts } from '../../Context/Contact';
import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Feather } from "@expo/vector-icons";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function ClientDash({ navigation, route }) {

  const dispatch = useDispatch();

    const { userData } = route.params;
    const [invoiceData, setInvoiceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paidInvoices, setPaidInvoices] = useState([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const logoutHandled = useRef(false);

    // Animations
    const greetAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(30)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

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
      ]).start();
    }, []);

    const dashData = [
        { id:1, screen: 'PersonalInfo', name:'Personal Information', cardColor:'#ff6968', img:require('../../assets/personIcon.png')},
        { id:2, screen: 'TaskManagement', name:'Task Management', cardColor:'#7454ff', img:require('../../assets/taskIcon.png')},
        { id:3, screen: 'InvoiceList', name:'Invoice', cardColor:'#ff8f61', img:require('../../assets/invoiceIcon.png')},
        { id:4, screen: 'StatementsTrans', name:'Transaction History', cardColor:'#2ac3ff', img:require('../../assets/transIcon.png')},
        { id:5, screen: 'AdvancedList', name:'Advance Management', cardColor:'#5a6aff', img:require('../../assets/ShoppingBag.png')},
        { id:6, screen: 'MyDocuments', name:'Download Documents', cardColor:'#73c2fb', img:require('../../assets/downloadIcon.png')},
        { id:7, screen: 'AddAdvance', name:'Pay Advance', cardColor:'#00CEC9', icon:'plus-circle'},
        { id:8, screen: 'VisitHistory', name:'Visit History', cardColor:'#FF7675', icon:'map-pin'},
    ]

    const navigateToScreen = (screen) => {
        navigation.navigate(screen, { userData });
    };

    const getInvoiceList = async () => {
      if (logoutHandled.current) return;
        setLoading(true)
         let token = await AsyncStorage.getItem("token");
         if(!token) {
          navigation.navigate('Splash');
          return;
         }
         const myHeaders = new Headers();
         myHeaders.append("Authorization", "Bearer " + token);
         myHeaders.append("Content-Type", "application/json");

         const raw = JSON.stringify({
          "text": "",
          "sort": true,
          "status": '',
          "departmentId": "",
          "isPagination": true,
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
          .then(async(result) => {
            if (result.statusCode === 200) {
              const paidInvoicesData = result.data.docs.filter(invoice => invoice.status === "Paid");
              const unpaidInvoicesData = result.data.docs.filter(invoice => invoice.status !== "Paid");
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
            ToastAndroid.show('Double click to exit App.', ToastAndroid.SHORT);
            setTimeout(() => {
              canExit.current = false;
            }, 750);
            return true;
          }
        } else {
          return false;
        }
      };

      useEffect(()=>{
       getInvoiceList();
        setTimeout(()=>{
          getInvoiceList();
        },1000)
      },[])

      useFocusEffect(
        React.useCallback(() => {
          getInvoiceList();
        },[])
      );

    const _renderItem = ({ item, index }) => {
      return (
          <TouchableOpacity
            key={index}
            onPress={() => {navigation.navigate('TransDetail', { _id: item._id })}}
            style={styles.invoiceCard}
            activeOpacity={0.8}
          >
              <View style={styles.invoiceCardTop}>
                  <View style={styles.invoiceIconWrap}>
                      <Image source={require('../../assets/DollarCoin.png')} resizeMode='contain' style={{ width:44, height:44 }} />
                  </View>
                  <View style={{ flex:1 }}>
                     <Text numberOfLines={1} ellipsizeMode='tail' style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                     <Text style={styles.invoiceAmount}>₹ {item.grandTotal} /-</Text>
                     <Text style={styles.invoiceDate}>{moment(item.createdAt).format('DD-MM-YYYY')}</Text>
                  </View>
                  <View style={{ justifyContent:'center' }}>
                     <View style={styles.invoiceArrow}>
                       <Feather name="chevron-right" size={18} color={Style.headerBgColor} />
                     </View>
                  </View>
              </View>
              <View style={styles.invoiceDivider} />
              <View style={{ paddingHorizontal:14, paddingVertical:10 }}>
                <Text style={styles.invoiceReminder}>Reminder: Outstanding Balance</Text>
              </View>
          </TouchableOpacity>
      );
    };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
      <StatusBar backgroundColor={'#074173'} barStyle='light-content' />
        <View style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:10 }}>
            {/* Greeting + Actions */}
            <Animated.View style={[styles.greetingRow, { opacity: greetAnim }]}>
                <View style={{ flex:1 }}>
                    <Text style={styles.greetName}>Hi, {userData.fullName}!</Text>
                    <Text style={styles.greetText}>{getGreeting()}</Text>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={()=> navigation.navigate('Support')} style={styles.actionBtn} activeOpacity={0.7}>
                        <Image source={require('../../assets/headset.png')} resizeMode='contain' style={{ width:22, height:22 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={styles.actionBtn} activeOpacity={0.7}>
                        <Feather name="bell" size={22} color={Style.primaryTextColor} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Invoice Section */}
            <View style={{ marginTop:12 }}>
            {unpaidInvoices.length === 0 ? (
                  <View style={styles.noDuesCard}>
                    <View style={styles.invoiceCardTop}>
                      <View style={styles.invoiceIconWrap}>
                        <Image source={require('../../assets/DollarCoin.png')} resizeMode='contain' style={{ width:44, height:44 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invoiceNumber}>Pay your Dues</Text>
                        <Text style={styles.invoiceAmount}>No Dues</Text>
                      </View>
                      <View style={{ justifyContent:'center' }}>
                        <View style={styles.invoiceArrow}>
                          <Feather name="check" size={18} color="#23a26d" />
                        </View>
                      </View>
                    </View>
                    <View style={styles.invoiceDivider} />
                    <View style={{ paddingHorizontal:14, paddingVertical:10 }}>
                      <Text style={styles.invoiceReminder}>Invoice Paid: No Outstanding Balance</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Carousel
                      layout="default"
                      data={unpaidInvoices}
                      renderItem={_renderItem}
                      sliderWidth={windowWidth}
                      itemWidth={windowWidth}
                      onSnapToItem={(index) => setActiveSlide(index)}
                      autoplay={false}
                      loop={false}
                    />
                    <Pagination
                      dotsLength={unpaidInvoices.length}
                      activeDotIndex={activeSlide}
                      containerStyle={{ paddingVertical: 8 }}
                      dotStyle={styles.paginationDot}
                      inactiveDotStyle={{ backgroundColor: '#c0c8e0' }}
                      inactiveDotOpacity={0.5}
                      inactiveDotScale={0.7}
                    />
                  </>
             )
           }
           </View>
        </View>

        {/* Dashboard Grid */}
        <Animated.View style={[styles.gridContainer, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.gridWrap}>
                    {
                        dashData.map((item, index)=> {
                         const isDisabled = item.id === 5 && userData?.isGroupOwner === false;
                            return (
                              <TouchableOpacity
                                key={index}
                                onPress={() => isDisabled ? showToast('Only the group owner has access') : navigateToScreen(item.screen)}
                                style={[styles.dashCard, { backgroundColor: item.cardColor }]}
                                activeOpacity={0.8}
                              >
                                <View style={styles.dashIconWrap}>
                                  {item.img ? (
                                    <Image source={item.img} resizeMode='contain' style={{ width:32, height:32 }} />
                                  ) : (
                                    <Feather name={item.icon} size={28} color="#fff" />
                                  )}
                                </View>
                                <Text style={styles.dashCardTitle} numberOfLines={2}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            )
                        })
                    }
                </View>
            </ScrollView>
        </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetName: {
    fontSize: 20,
    fontFamily: 'Lato-Bold',
    color: Style.primaryTextColor,
    textTransform: 'capitalize',
  },
  greetText: {
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 3,
  },
  // Invoice Cards
  invoiceCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  noDuesCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.06,
    // shadowRadius: 6,
  },
  invoiceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  invoiceIconWrap: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 14,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: Style.primaryTextColor,
  },
  invoiceAmount: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#23a26d',
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#a0a4b8',
    marginTop: 1,
  },
  invoiceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#f0f1f5',
    marginHorizontal: 14,
  },
  invoiceReminder: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#a0a4b8',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: -16,
    backgroundColor: Style.headerBgColor,
  },
  // Grid
  gridContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: -3 },
    // shadowOpacity: 0.06,
    // shadowRadius: 8,
  },
  gridWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  dashCard: {
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderRadius: 16,
    // elevation: 3,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.12,
    // shadowRadius: 6,
  },
  dashIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dashCardTitle: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 17,
  },
});
