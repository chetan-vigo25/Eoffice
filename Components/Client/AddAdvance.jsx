import React, { useState, useEffect, useRef } from "react";
import { StatusBar, StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, ToastAndroid, ActivityIndicator, LayoutAnimation, UIManager, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from 'react-native-razorpay';
import CryptoJS from "crypto-js";
import { useDispatch, useSelector } from 'react-redux';
import SelectDropdown from 'react-native-select-dropdown';
import { personalInfo } from "../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { DATA_ENCRYPT_DCRYPT_KEY } from "@env";
import  BASE_URL from "../../Urls/DomainUrl";
import Style from "../../Style/Style";
import { AntDesign, Feather, Entypo } from "@expo/vector-icons";

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: false }
    );
  }
}

const SECRET = DATA_ENCRYPT_DCRYPT_KEY;

export default function AddAdvance({ navigation }) {

  const dispatch = useDispatch();
  const { loading, personalInfoData, error } = useSelector((state) => state.client);

  const [scale] = useState(new Animated.Value(0)); 
  const [groupList, setGroupList] = useState([]);
  const [layoutList, setLayoutList] = useState([]);
  const [bankList, setBankList] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [layoutId, setLayoutId] = useState('');
  const [bankId, setBankId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [naration, setNaration] = useState('');
  const [razprPay_key, setRazprPay_key] = useState('');
  const [compData, setCompData] = useState([]);
  const [advHistory, setAdvHistory] = useState([]);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

    const getLayouts = async()=>{
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");
       
      const raw = JSON.stringify({
        "text": "",
        "sort": true,
        "status": "",
        "isPagination": false
      });
       
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
       
      fetch(`${BASE_URL}/client/advance/layoutlist`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode === 200) {
              setLayoutList(result?.data?.docs || []);
              setIsLoading(false);
        }else if (result.statusCode === 401) {
          if (!logoutHandled.current) {
            logoutHandled.current = true; // Flag to prevent multiple logouts
            showToast("Session expired. Please log in again.", () => {
              dispatch(logout()); // Dispatch logout action when OK is pressed
              navigation.navigate('Autologin'); // Navigate to autologin page
            });
          }
        }else{
              setIsLoading(false);
              console.log(result.message);
          }
        }
      )
      .catch((error) => console.error(error))
      .finally(() => {
        setIsLoading(false);
      });
    } 

    const getBanks = async()=>{
        setIsLoading(true);
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");
         
        const raw = "";
         
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
         
        fetch(`${BASE_URL}/client/advance/banklist`, requestOptions)
         .then((response) => response.json())
          .then((result) => {
            if(result.statusCode === 200) {
                // console.log(result.data);
                setBankList(result?.data);
                setIsLoading(false);
          }else{
                setIsLoading(false);
                console.log(result.message);
            }
          }
            )
          .catch((error) => console.error(error))
          .finally(() => {
              setIsLoading(false);
          });
    }

    const createAdvance = async () => {
      if (!layoutId || !bankId || !amount || !naration || !razprPay_key) {
        let errorMessage = '';
    
        // Check which condition is missing
        if (!layoutId || !bankId || !amount || !naration) {
          errorMessage = "Please fill all the fields";
        } else if (!razprPay_key) {
          errorMessage = "Payment method not allowed. Please contact support";
        }
        showToast(errorMessage);
        return;
      }
    
      setIsLoading(true);
      if (logoutHandled.current) return;
       let token = await AsyncStorage.getItem("token");
       if(!token) {
        navigation.navigate('Splash');
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");
    
      const raw = JSON.stringify({
        "bankAccId": bankId,
        "receiptLayoutId": layoutId,
        "amount": amount,
        "naration": naration
      });
    
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
    
      try {
        const response = await fetch(`${BASE_URL}/client/advance/create`, requestOptions);
        const result = await response.json();
    
        if (result.statusCode === 200) {
          // console.log("Adv ID:", result, new Date().toLocaleString());
          showToast(result.message);
          setGroupId('');
          setLayoutId('');
          setBankId('');
          setAmount('');
          setNaration('');
          showToast(result.message);
          // Proceed to create order after successful advance creation
          CreateOrder(result.data);
        } else {
          showToast(result.message);
        }
      } catch (error) {
        console.error("Error in createAdvance:", error);
        showToast("Failed to create advance");
      } finally {
        setIsLoading(false);
      }
    };

     const decryptData = (cipherText) => {
         const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
         const originalText = bytes.toString(CryptoJS.enc.Utf8);
        //  console.log("Decrypted Text:", originalText);
         return originalText;
     };

     const keyFetch = async () => {
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");
    
        const raw = "";
    
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
    
        fetch(`${BASE_URL}/client/auth/profilekey`, requestOptions)
          .then((response) => response.json())
            .then((result) => {
                if(result.statusCode === 200){
                    const RAZOR_PAY_KEY = decryptData(result.data.privateKey);
                    setRazprPay_key(RAZOR_PAY_KEY);
                    // console.log("RAZOR_PAY_KEY",RAZOR_PAY_KEY);
                    setCompData(result.data.userId);
                } else {
                    showToast(result.message);
                }
            })
            .catch((error) => console.error(error));
    }

    const CreateOrder = async (data) =>{
      // console.log("CreateOrder", data);
      setIsLoading(true);
       let token = await AsyncStorage.getItem("token");
       const myHeaders = new Headers();
       myHeaders.append("Authorization", "Bearer " + token);
       myHeaders.append("Content-Type", "application/json");

       const raw = JSON.stringify({
         "invoiceId": null,
         "groupAdvanceId": data?._id,
         "amount": data?.amount,
       });
       
       const requestOptions = {
         method: "POST",
         headers: myHeaders,
         body: raw,
         redirect: "follow"
       };
      //  console.log("requestOptions", requestOptions);

       fetch(`${BASE_URL}/client/invoice/payment/order`, requestOptions)
        .then((response) => response.json())
         .then((result) => {
            if(result.statusCode === 200){
              // console.log("CreateOrder result", result, new Date().toLocaleString());
                CheckoutR(result.data.id);
                setIsLoading(false);
            }else{
                showToast(result.message);
                setIsLoading(false);
            }
         })
         .catch((error) => console.error(error))
         .finally(() => {
           setIsLoading(false);
         });
    }

    const CheckoutR = (order_id) => {
      if (!razprPay_key) {
        showToast("Payment method not allow please contact to support");
        return;
      }
      var options = {
        description: 'Credits towards consultation',
        image: compData?.companyProfile?.logo,
        currency: 'INR',
        key: razprPay_key,
        // amount: '5000',
        name: compData?.fullName,
        order_id: order_id,
        prefill: {
          email: personalInfoData?.email,
          contact: personalInfoData?.mobile?.number || '',
          name: personalInfoData?.fullName || ''
        },
        theme: {color: Style.headerBgColor}
      }
        RazorpayCheckout.open(options).then((data) => {
            // handle success
            // console.log("CheckoutR", data, new Date().toLocaleString())
            verifyPayment(data)
            showToast("SUCCESS", ToastAndroid.SHORT);
            navigation.navigate('Statements');
          }).catch((error) => {
            // handle failure
            // verifyPayment(data)
             navigation.navigate('AddAdvance');
             console.log(error);
             showToast("CANCELLED", ToastAndroid.SHORT);
          });
    }

    const verifyPayment = async (data)=>{
      // console.log("verifyPayment", data);
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
          "razorpay_order_id": data.razorpay_order_id,
          "razorpay_payment_id": data.razorpay_payment_id,
          "razorpay_signature": data.razorpay_signature
        });
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        fetch(`${BASE_URL}/client/invoice/payment/verify`, requestOptions)
         .then((response) => response.json())
          .then((result) => {
            if(result.statusCode === 200){
                showToast(result.message);
                // console.log("ghhhhhhhhhhhhhh....",result, new Date().toLocaleString());
                // showToast("Payment Success",);
            }else{
                showToast(result.message);
            }    
          })
          .catch((error) => console.error(error));
    }

    useEffect(() => {
      getLayouts();
      getBanks();
      keyFetch();
      dispatch(personalInfo())
    }, [dispatch]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar translucent={false} backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
           <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
                <AntDesign name="arrowleft" size={24} color="#fff" />
             </TouchableOpacity>
             <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Add Advance</Text>
           </View>
        </Animated.View>
        <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, }} >
           <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1,}}>
             <Animated.View style={{ transform: [{ scale }] }}>
               <View>
                  <TouchableOpacity style={{ 
                    width:'100%', 
                    height:50, 
                    backgroundColor:"#f8f9fa", 
                    borderRadius:6, 
                    marginBottom:20, 
                    justifyContent:'space-between', 
                    borderWidth: .5, 
                    borderColor: '#e0e0e0',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    // Android shadow
                    elevation: 2,
                  }} >
                   <SelectDropdown
                     data={layoutList}
                     onSelect={(layoutType, index) => {
                         setLayoutId(layoutType._id);
                        //  showToast(`Selected: ${layoutType.firmName}`); 
                     }}
                     renderButton={(layoutType, isOpened) => {
                       return (
                         <View style={styles.dropdownButtonStyle}>
                           <Text style={styles.dropdownButtonTxtStyle}>
                             {(layoutType && layoutType.firmName) || 'Select Layout Type'}
                           </Text>
                           <Entypo
                             name={isOpened ? 'chevron-up' : 'chevron-down'}
                             style={styles.dropdownButtonArrowStyle}
                           />
                         </View>
                       );
                     }}
                     renderItem={(layoutType, index, isSelected) => {
                       return (
                         <View
                           style={{
                             ...styles.dropdownItemStyle,
                             ...(isSelected && { backgroundColor: '#D2D9DF' }),
                           }}
                         >
                           <Text style={styles.dropdownItemTxtStyle}>
                             {layoutType.firmName}  {/* Display the year range */}
                           </Text>
                         </View>
                       );
                     }}
                     showsVerticalScrollIndicator={false}
                     dropdownStyle={styles.dropdownMenuStyle}
                   />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ 
                    width:'100%', 
                    height:50, 
                    backgroundColor:"#f8f9fa", 
                    borderRadius:6, 
                    marginBottom:20, 
                    justifyContent:'space-between', 
                    borderWidth: .5, 
                    borderColor: '#e0e0e0',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    // Android shadow
                    elevation: 2,
                  }} >
                    <SelectDropdown
                      data={bankList}
                      onSelect={(bankType, index) => {
                          setBankId(bankType._id);
                          // showToast(`Selected: ${bankType.bankholderName}`); 
                      }}
                      renderButton={(bankType, isOpened) => {
                        return (
                          <View style={styles.dropdownButtonStyle}>
                            <Text style={styles.dropdownButtonTxtStyle}>
                              {(bankType && bankType.bankholderName) || 'Select Bank'}
                            </Text>
                            <Entypo
                              name={isOpened ? 'chevron-up' : 'chevron-down'}
                              style={styles.dropdownButtonArrowStyle}
                            />
                          </View>
                        );
                      }}
                      renderItem={(bankType, index, isSelected) => {
                        return (
                          <View
                            style={{
                              ...styles.dropdownItemStyle,
                              ...(isSelected && { backgroundColor: '#D2D9DF' }),
                            }}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {bankType.bankholderName}  {/* Display the year range */}
                            </Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                    />
                  </TouchableOpacity>
                  <View style={{ 
                    width:'100%', 
                    height:50, 
                    borderRadius:6, 
                    marginBottom:20, 
                    justifyContent:'space-between', 
                    borderWidth: .5, 
                    borderColor: '#e0e0e0',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    // Android shadow
                    elevation: 2,
                  }} >
                      <TextInput Value={amount} onChangeText={value => setAmount(value)} keyboardType="numeric" placeholder="Enter Amount" style={{ flex:1, backgroundColor:'#fff', color: Style.headerBgColor, padding:6, borderRadius:6 }} />
                  </View>
                  <View style={{ 
                    width:'100%', 
                    height:50, 
                    borderRadius:6, 
                    marginBottom:40, 
                    justifyContent:'space-between', 
                    borderWidth: .5, 
                    borderColor: '#e0e0e0',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    // Android shadow
                    elevation: 2,
                  }} >
                    <TextInput value={naration} onChangeText={value=> setNaration(value)}  placeholder="Naration" numberOfLines={2} multiline={true} style={{ flex:1, backgroundColor:'#fff', padding:6, borderRadius:6, color: Style.headerBgColor }} />
                  </View>
                  <TouchableOpacity disabled={!layoutId || !bankId || !amount || !naration} onPress={createAdvance} style={{ 
                    width: '100%', 
                    height: 45, 
                    backgroundColor: !layoutId || !bankId || !amount || !naration ? '#ccc':'#658eff', 
                    borderRadius: 5, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    // Android shadow
                    elevation: 2,
                  }}>
                    {
                      isLoading ? <ActivityIndicator size="small" color="#fff" /> :
                      <Text style={{ color: '#fff', fontSize: 16, fontFamily:'Poppins-SemiBold' }}>Add Advance</Text>
                    }
                  </TouchableOpacity>
               </View>
             </Animated.View>
           </ScrollView>
        </View>
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