import React, { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, ScrollView, ToastAndroid, ActivityIndicator, Platform, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from 'react-native-razorpay';
import CryptoJS from "crypto-js";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { DATA_ENCRYPT_DCRYPT_KEY } from "@env";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import BASE_URL from '../../../Urls/DomainUrl';
import Style from "../../../Style/Style";
import { AntDesign, Feather } from "@expo/vector-icons";

const SECRET = DATA_ENCRYPT_DCRYPT_KEY;

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function InvoiceDetail({ navigation, route }) {
  const dispatch = useDispatch();
  const { invoiceId } = route.params || {};
  const { personalInfoData } = useSelector((state) => state.client);
  const [slideAnim] = useState(new Animated.Value(30));
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [razprPay_key, setRazprPay_key] = useState('');
  const [compData, setCompData] = useState(null);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const handleLogout = useCallback(async () => {
    if (logoutHandled.current) return;
    logoutHandled.current = true;
    showToast('Session expired, please login again');
    dispatch(logout());
    await AsyncStorage.removeItem('token');
    await AsyncStorage.clear();
    navigation.navigate('Autologin');
  }, [dispatch, navigation]);

  const decryptData = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  };

  const keyFetch = async () => {
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: "",
      redirect: "follow"
    };

    fetch(`${BASE_URL}/client/auth/profilekey`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          const RAZOR_PAY_KEY = decryptData(result.data.privateKey);
          setRazprPay_key(RAZOR_PAY_KEY);
          setCompData(result.data.userId);
        } else {
          showToast(result.message);
        }
      })
      .catch((error) => console.error(error));
  };

  const fetchInvoiceDetail = async () => {
    if (logoutHandled.current) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const body = { _id: invoiceId };

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(body),
        redirect: "follow"
      };

      const response = await fetch(`${BASE_URL}/client/invoice/view`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        // console.log("Invoice Detail", JSON.stringify(result.data, null, 2))
        setInvoiceData(result.data);
      } else if (result.statusCode === 401) {
        handleLogout();
      } else {
        showToast(result.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("[InvoiceDetail Error]:", error);
      showToast("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetail();
      keyFetch();
    }
  }, [invoiceId]);

  // Razorpay: Create Order
  const CreateOrder = async () => {
    setPaymentLoading(true);
    try {
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        invoiceId: invoiceData._id,
        amount: invoiceData.grandTotal,
        groupAdvanceId: null,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch(`${BASE_URL}/client/invoice/payment/order`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        CheckoutR(result.data.id);
      } else {
        showToast(result.message);
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to create order.");
      setPaymentLoading(false);
    }
  };

  // Razorpay: Open Checkout
  const CheckoutR = (order_id) => {
    if (!razprPay_key) {
      showToast("Payment method not allow please contact to support");
      setPaymentLoading(false);
      return;
    }
    var options = {
      description: 'Credits towards consultation',
      image: compData?.companyProfile?.logo,
      currency: 'INR',
      key: razprPay_key,
      name: compData?.fullName,
      order_id: order_id,
      prefill: {
        email: personalInfoData?.email,
        contact: personalInfoData?.mobile?.number || '',
        name: personalInfoData?.fullName || ''
      },
      theme: { color: Style.headerBgColor }
    };
    RazorpayCheckout.open(options).then((data) => {
      verifyPayment(data);
    }).catch((error) => {
      console.log(error);
      showToast("CANCELLED");
      setPaymentLoading(false);
    });
  };

  // Razorpay: Verify Payment
  const verifyPayment = async (data) => {
    try {
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch(`${BASE_URL}/client/invoice/payment/verify`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        showToast(result.message);
        fetchInvoiceDetail();
        navigation.navigate('TransferSuccess', { reciptData: result.data });
      } else {
        showToast(result.message);
      }
    } catch (error) {
      console.error(error);
      showToast("Payment verification failed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData?.invoiceURL) {
      showToast("No PDF available for this invoice.");
      return;
    }

    setDownloading(true);
    try {
      const filename = invoiceData.invoiceURL.split('/').pop() || `invoice_${invoiceData.invoiceNumber}.pdf`;
      const fileUri = FileSystem.cacheDirectory + filename;

      // Download file to cache first
      const downloadResumable = FileSystem.createDownloadResumable(
        invoiceData.invoiceURL,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync();

      if (Platform.OS === 'android') {
        // Use StorageAccessFramework to save PDF to Downloads
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          showToast("Storage permission is required to download PDF.");
          return;
        }

        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename.replace('.pdf', ''),
          'application/pdf'
        );

        await FileSystem.writeAsStringAsync(safUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        showToast("PDF saved to Downloads folder.");
      } else {
        // iOS: present the share sheet so the user can save to Files / share
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
          });
        } else {
          showToast("PDF downloaded successfully.");
        }
      }
    } catch (error) {
      console.error("[PDF Download Error]:", error);
      showToast(`Failed to download PDF: ${error?.message || error}`);
    } finally {
      setDownloading(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' }}>
      <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: '#5e6366', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, flex: 1.2, textAlign: 'right' }}>{value || '-'}</Text>
    </View>
  );

  const isPaid = invoiceData?.status === 'Paid';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Lato-SemiBold', flex: 1 }}>Invoice Detail</Text>
      </View>

      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, padding: 20, transform: [{ translateY: slideAnim }] }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : invoiceData ? (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Invoice Header */}
            <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 15, }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor, flex: 1 }}>{invoiceData.invoiceNumber}</Text>
                <View style={{ backgroundColor: isPaid ? '#e8f5e9' : '#ffebee', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: isPaid ? '#2e7d32' : '#c62828' }}>{isPaid ? 'Paid' : 'Unpaid'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                {invoiceData.type} | {moment(invoiceData.createdAt).format('DD/MM/YYYY')}
              </Text>
            </View>

            {/* Amount Details */}
            <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 15, }}>
              <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor, marginBottom: 5 }}>Amount Details</Text>
              <InfoRow label="Total Amount" value={`Rs ${invoiceData.totalAmount}/-`} />
              <InfoRow label="Discount" value={`Rs ${invoiceData.discountAmount || 0}/-`} />
              {invoiceData.SGST ? <InfoRow label="SGST" value={`Rs ${invoiceData.SGST}/-`} /> : null}
              {invoiceData.CGST ? <InfoRow label="CGST" value={`Rs ${invoiceData.CGST}/-`} /> : null}
              {invoiceData.IGST ? <InfoRow label="IGST" value={`Rs ${invoiceData.IGST}/-`} /> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Grand Total</Text>
                <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>Rs {invoiceData.grandTotal}/-</Text>
              </View>
            </View>

            {/* Paid To Details */}
            {invoiceData.paidTo ? (
              <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 15, }}>
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor, marginBottom: 5 }}>Paid To</Text>
                <InfoRow label="Name" value={invoiceData.paidTo.fullName} />
                {/* <InfoRow label="Email" value={invoiceData.paidTo.email} /> */}
                <InfoRow label="Email" value="admin@singhaljain.com" />
                <InfoRow label="Mobile" value={invoiceData.paidTo.mobile ? `${invoiceData.paidTo.mobile.code} ${invoiceData.paidTo.mobile.number}` : '-'} />
              </View>
            ) : null}

            {/* Client Name */}
            {invoiceData.clientData ? (
              <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 10, padding: 15, marginBottom: 15, }}>
                <InfoRow label="Client" value={invoiceData.clientData} />
              </View>
            ) : null}

            {/* Action Button: Make Payment OR Download PDF */}
            {isPaid ? (
              <TouchableOpacity
                onPress={handleDownloadPDF}
                disabled={downloading}
                style={{
                  flexDirection: 'row',
                  backgroundColor: Style.headerBgColor,
                  borderRadius: 10,
                  padding: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 5,
                  marginBottom: 20,
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="download" size={20} color="#fff" />
                )}
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#fff' }}>
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={CreateOrder}
                disabled={paymentLoading}
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#2e7d32',
                  borderRadius: 10,
                  padding: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 5,
                  marginBottom: 20,
                  opacity: paymentLoading ? 0.7 : 1,
                }}
              >
                {paymentLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="credit-card" size={20} color="#fff" />
                )}
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#fff' }}>
                  {paymentLoading ? 'Processing...' : 'Make Payment'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>No Data Found</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
