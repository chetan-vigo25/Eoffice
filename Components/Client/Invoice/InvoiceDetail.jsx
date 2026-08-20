import React, { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, ScrollView, ToastAndroid, ActivityIndicator, Platform, Alert, InteractionManager } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from 'react-native-razorpay';
import CryptoJS from "crypto-js";
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { DATA_ENCRYPT_DCRYPT_KEY } from "@env";
import { downloadDocumentPdf, DOC_TYPE } from '../../../Utils/pdf';
import DocumentViewer from '../../Common/DocumentViewer';

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
  const insets = useSafeAreaInsets();
  const { invoiceId } = route.params || {};
  const { personalInfoData } = useSelector((state) => state.client);
  const [slideAnim] = useState(new Animated.Value(30));
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
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
        setInvoiceData(result.data);
        return result.data;
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

  // The Razorpay SDK settles its promise only through a native event. If that
  // event never arrives the screen would hang forever, so fall back to asking
  // the server — the invoice status is the source of truth for whether the
  // money actually moved.
  const paymentInFlight = useRef(false);
  const watchdogRef = useRef(null);
  const PAYMENT_TIMEOUT_MS = 120000;

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  useEffect(() => () => clearWatchdog(), []);

  const reconcilePayment = async (fallbackMessage) => {
    clearWatchdog();
    paymentInFlight.current = false;
    try {
      const fresh = await fetchInvoiceDetail();
      if (fresh?.status === 'Paid') {
        showToast("Payment received.");
        return true;
      }
    } catch (error) {
      console.error("[Payment Reconcile Error]:", error);
    }
    if (fallbackMessage) showToast(fallbackMessage);
    return false;
  };

  const startPaymentWatchdog = () => {
    clearWatchdog();
    paymentInFlight.current = true;
    watchdogRef.current = setTimeout(() => {
      if (!paymentInFlight.current) return;
      reconcilePayment("Could not confirm the payment. Please refresh in a moment.")
        .finally(() => setPaymentLoading(false));
    }, PAYMENT_TIMEOUT_MS);
  };

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
    startPaymentWatchdog();
    RazorpayCheckout.open(options).then((data) => {
      clearWatchdog();
      paymentInFlight.current = false;
      verifyPayment(data);
    }).catch(async (error) => {
      console.log('[Razorpay Error]:', error);
      // Landing here does not prove the payment failed — the SDK also rejects
      // when the callback is lost. Ask the server before telling the user.
      const paid = await reconcilePayment(null);
      if (!paid) showToast("Payment cancelled.");
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
        // Navigating while Razorpay's view controller is still dismissing leaves
        // it stranded on top on iOS — wait for the transition to finish.
        InteractionManager.runAfterInteractions(() => {
          navigation.navigate('TransferSuccess', { reciptData: result.data });
        });
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

  // The server renders the invoice on demand, so this works paid or unpaid.
  const canDownload = !!invoiceData?._id;

  const handleDownloadPDF = async () => {
    if (!canDownload) {
      showToast("This invoice cannot be downloaded.");
      return;
    }

    setDownloading(true);
    try {
      await downloadDocumentPdf({
        id: invoiceData._id,
        type: DOC_TYPE.invoice,
        source: invoiceData,
        baseName: `Invoice_${invoiceData?.invoiceNumber || ''}_${moment().format('DDMMYYYY')}`,
        fallbackName: 'Invoice',
        onToast: showToast,
        onUnauthorized: handleLogout,
      });
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
    <>
    <DocumentViewer
      visible={viewerOpen}
      id={invoiceData?._id}
      type={DOC_TYPE.invoice}
      title="Invoice"
      number={invoiceData?.invoiceNumber}
      onClose={() => setViewerOpen(false)}
      onUnauthorized={handleLogout}
    />
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} style={{ flex: 1 }}>
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

            {/* Make Payment shows only while unpaid; View / Download always available. */}
            {!isPaid && (
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
                  marginBottom: 12,
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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: isPaid ? 5 : 0, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setViewerOpen(true)}
                disabled={!canDownload}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  backgroundColor: '#eef2ff',
                  borderRadius: 10,
                  padding: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: '#dfe6f5',
                  opacity: canDownload ? 1 : 0.5,
                }}
              >
                <Feather name="eye" size={19} color={Style.headerBgColor} />
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDownloadPDF}
                disabled={downloading || !canDownload}
                activeOpacity={0.8}
                style={{
                  flex: 1.4,
                  flexDirection: 'row',
                  backgroundColor: canDownload ? Style.headerBgColor : '#e0e0e0',
                  borderRadius: 10,
                  padding: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={canDownload ? '#fff' : '#999'} />
                ) : (
                  <Feather name="download" size={19} color={canDownload ? '#fff' : '#999'} />
                )}
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: canDownload ? '#fff' : '#999' }}>
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>No Data Found</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
    </>
  );
}
