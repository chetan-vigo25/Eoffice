import React, { useState, useEffect, useCallback } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, RefreshControl, FlatList, Modal, ScrollView, StyleSheet, UIManager, Platform, ToastAndroid, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectDropdown from 'react-native-select-dropdown'
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import usePaginatedList from '../../../hooks/usePaginatedList';
import { downloadDocumentPdf, DOC_TYPE } from '../../../Utils/pdf';
import DocumentViewer from '../../Common/DocumentViewer';

import { AntDesign, Feather, Entypo, Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

// Payment modes available for the receipt filter
const PAYMENT_MODES = ['cash', 'bank', 'cheque', 'online', 'upi'];

const formatMode = (mode) => (mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : '-');

export default function InvoiceList({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(0));

  // Which tab is active: 'invoice' | 'receipt'
  const [activeTab, setActiveTab] = useState('invoice');

  // ----- Invoice state (unchanged) -----
  const [modalVisible, setModalVisible] = useState(false);
  const [statusD, setStatusD] = useState('');
  const [startDate, setStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const statusData = ['Paid', 'PendingPayment'];

  const filtersRef = React.useRef({ statusD: '', startDate: '' });

  // ----- Receipt state -----
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');
  const [receiptFilteredData, setReceiptFilteredData] = useState(null);
  const [receiptPaymentMode, setReceiptPaymentMode] = useState('');
  const [receiptStartDate, setReceiptStartDate] = useState('');
  const [isReceiptDatePickerVisible, setReceiptDatePickerVisibility] = useState(false);
  const receiptFiltersRef = React.useRef({ paymentmode: '', startDate: '' });
  const receiptLoadedRef = React.useRef(false);

  // Receipt view modal
  const [receiptViewVisible, setReceiptViewVisible] = useState(false);
  const [receiptViewLoading, setReceiptViewLoading] = useState(false);
  const [receiptViewData, setReceiptViewData] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Full invoice / receipt preview (server-rendered HTML -> WebView -> PDF)
  const [viewerDoc, setViewerDoc] = useState(null);   // { id, type, title, number }

  const onUnauthorized = useCallback(async () => {
    dispatch(logout());
    showToast("Session expired. Please log in again.");
    await AsyncStorage.removeItem("token");
    navigation.navigate("Autologin");
  }, [dispatch, navigation]);

  // ===== Invoice list (unchanged) =====
  const buildBody = useCallback(() => ({
    text: "",
    sort: true,
    status: filtersRef.current.statusD || "",
    departmentId: "",
    isPagination: false,
    date: filtersRef.current.startDate || "",
  }), []);

  const extractDocs = useCallback((result) => result.data?.docs, []);

  const { data, allData, loading, refreshing, hasMore, loadFirst, loadMore, refresh } = usePaginatedList({
    url: `${BASE_URL}/client/invoice/list`,
    buildBody,
    extractDocs,
    onUnauthorized,
  });

  // ===== Receipt list =====
  const buildReceiptBody = useCallback(() => ({
    companyId: "",
    directorId: "",
    branchId: "",
    clientId: "",
    groupId: "",
    startDate: receiptFiltersRef.current.startDate || "",
    endDate: "",
    paymentmode: receiptFiltersRef.current.paymentmode || "",
    text: "",
    sort: true,
    status: "",
    isPagination: true,
  }), []);

  const {
    data: receiptData,
    allData: receiptAllData,
    loading: receiptLoading,
    refreshing: receiptRefreshing,
    hasMore: receiptHasMore,
    loadFirst: receiptLoadFirst,
    loadMore: receiptLoadMore,
    refresh: receiptRefresh,
  } = usePaginatedList({
    // Fetch all in one page, then the hook slices client-side for smooth scroll (same as invoice).
    url: `${BASE_URL}/client/invoice/receiptList?page=1&limit=10000`,
    buildBody: buildReceiptBody,
    extractDocs,
    onUnauthorized,
  });

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadFirst();
  }, []);

  // Lazy-load receipts only the first time the Receipt tab is opened (prevents duplicate calls)
  useEffect(() => {
    if (activeTab === 'receipt' && !receiptLoadedRef.current) {
      receiptLoadedRef.current = true;
      receiptLoadFirst();
    }
  }, [activeTab, receiptLoadFirst]);

  const displayData = filteredData !== null ? filteredData : data;
  const receiptDisplayData = receiptFilteredData !== null ? receiptFilteredData : receiptData;

  // ===== Search =====
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(null);
    } else {
      const results = allData().filter(item =>
        item.invoiceNumber?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    }
  };

  const handleReceiptSearch = (text) => {
    setReceiptSearchQuery(text);
    if (text.trim() === '') {
      setReceiptFilteredData(null);
    } else {
      const q = text.toLowerCase();
      const results = receiptAllData().filter(item =>
        item.receiptNumber?.toLowerCase().includes(q) ||
        item.clientName?.toLowerCase().includes(q)
      );
      setReceiptFilteredData(results);
    }
  };

  // ===== Invoice filters (unchanged) =====
  const applyFilters = () => {
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD, startDate: startDate ? moment(startDate).format("YYYY/MM/DD") : '' };
    loadFirst();
  };

  const resetFilters = () => {
    setStartDate('');
    setStatusD('');
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD: '', startDate: '' };
    loadFirst();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD, startDate: startDate ? moment(startDate).format("YYYY/MM/DD") : '' };
    refresh();
  };

  // ===== Receipt filters =====
  const applyReceiptFilters = () => {
    setModalVisible(false);
    setReceiptSearchQuery('');
    setReceiptFilteredData(null);
    receiptFiltersRef.current = {
      paymentmode: receiptPaymentMode || '',
      startDate: receiptStartDate ? moment(receiptStartDate).format("YYYY-MM-DD") : '',
    };
    receiptLoadFirst();
  };

  const resetReceiptFilters = () => {
    setReceiptStartDate('');
    setReceiptPaymentMode('');
    setModalVisible(false);
    setReceiptSearchQuery('');
    setReceiptFilteredData(null);
    receiptFiltersRef.current = { paymentmode: '', startDate: '' };
    receiptLoadFirst();
  };

  const handleReceiptRefresh = () => {
    setReceiptSearchQuery('');
    setReceiptFilteredData(null);
    receiptFiltersRef.current = {
      paymentmode: receiptPaymentMode || '',
      startDate: receiptStartDate ? moment(receiptStartDate).format("YYYY-MM-DD") : '',
    };
    receiptRefresh();
  };

  // ===== Date pickers =====
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setStartDate(date);
    hideDatePicker();
  };
  const formattedDate = startDate ? moment(startDate).format("DD/MM/YYYY") : "Select Date";

  const showReceiptDatePicker = () => setReceiptDatePickerVisibility(true);
  const hideReceiptDatePicker = () => setReceiptDatePickerVisibility(false);
  const handleReceiptConfirm = (date) => {
    setReceiptStartDate(date);
    hideReceiptDatePicker();
  };
  const formattedReceiptDate = receiptStartDate ? moment(receiptStartDate).format("DD/MM/YYYY") : "Select Date";

  // Toolbar refresh/filter dispatch based on active tab
  const onToolbarRefresh = () => (activeTab === 'invoice' ? resetFilters() : resetReceiptFilters());
  const onPullRefresh = () => (activeTab === 'invoice' ? handleRefresh() : handleReceiptRefresh());

  // ===== Receipt view =====
  const openReceiptView = useCallback(async (receiptId) => {
    if (!receiptId || receiptViewLoading) return;
    setReceiptViewVisible(true);
    setReceiptViewData(null);
    setReceiptViewLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        onUnauthorized();
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append('Authorization', 'Bearer ' + token);
      myHeaders.append('Content-Type', 'application/json');

      const response = await fetch(`${BASE_URL}/client/invoice/receiptView`, {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({ _id: receiptId }),
        redirect: 'follow',
      });
      const result = await response.json();

      if (result.statusCode === 200) {
        setReceiptViewData(result.data || null);
      } else if (result.statusCode === 401) {
        setReceiptViewVisible(false);
        onUnauthorized();
      } else {
        setReceiptViewVisible(false);
        showToast(result.message || 'Failed to load receipt.');
      }
    } catch (error) {
      console.error('[Receipt View Error]:', error);
      setReceiptViewVisible(false);
      showToast(`Failed to load receipt: ${error?.message || error}`);
    } finally {
      setReceiptViewLoading(false);
    }
  }, [receiptViewLoading, onUnauthorized]);

  const closeReceiptView = () => {
    setReceiptViewVisible(false);
    setReceiptViewData(null);
  };

  // ===== Receipt PDF download (same pattern as InvoiceDetail) =====
  // Invoices and receipts are both rendered on demand by the same endpoint.
  const downloadDocument = useCallback(async (doc, type) => {
    const rowId = doc?._id;
    const label = type === DOC_TYPE.invoice ? 'Invoice' : 'Receipt';
    const number = type === DOC_TYPE.invoice ? doc?.invoiceNumber : doc?.receiptNumber;

    if (!rowId) {
      showToast(`This ${label.toLowerCase()} cannot be downloaded.`);
      return;
    }
    if (downloadingId) return;
    setDownloadingId(rowId);
    try {
      await downloadDocumentPdf({
        id: rowId,
        type,
        source: doc,
        baseName: `${label}_${number || ''}_${moment().format('DDMMYYYY')}`,
        fallbackName: label,
        onToast: showToast,
        onUnauthorized,
      });
    } catch (error) {
      console.error(`[${label} PDF Download Error]:`, error);
      showToast(`Failed to download PDF: ${error?.message || error}`);
    } finally {
      setDownloadingId(null);
    }
  }, [downloadingId, onUnauthorized]);

  const downloadReceiptPDF = useCallback(
    (receipt) => downloadDocument(receipt, DOC_TYPE.receipt),
    [downloadDocument]
  );

  // ===== Invoice card (unchanged) =====
  const renderItem = useCallback(({ item }) => {
    const isDownloading = downloadingId === item._id;
    const canOpen = !!item._id;
    return (
    <TouchableOpacity
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item._id })}
      activeOpacity={0.7}
      style={{
        width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 12,
        marginBottom: 12, padding: 14,
      }}
    >
      {/* Header: Invoice Number + Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>{item.invoiceNumber}</Text>
        </View>
        <View style={{
          backgroundColor: item.status === 'Paid' ? '#e8f5e9' : '#ffebee',
          paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
        }}>
          <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: item.status === 'Paid' ? '#2e7d32' : '#c62828' }}>
            {item.status === 'Paid' ? 'Paid' : 'Unpaid'}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <Text style={{ fontSize: 20, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginBottom: 8 }}>
        Rs {item.grandTotal?.toLocaleString()}/-
      </Text>

      {/* Footer: Date + Share */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="calendar" size={13} color={Style.secondryTextColor} />
          <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(item.updatedAt).format('DD/MM/YYYY')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setViewerDoc({ id: item._id, type: DOC_TYPE.invoice, title: 'Invoice', number: item.invoiceNumber })}
            disabled={!canOpen}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: canOpen ? '#eef2ff' : '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
          >
            <Feather name="eye" size={16} color={canOpen ? Style.headerBgColor : '#bbb'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => downloadDocument(item, DOC_TYPE.invoice)}
            disabled={isDownloading || !canOpen}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: canOpen ? '#eef2ff' : '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
          >
            {isDownloading
              ? <ActivityIndicator size="small" color={Style.headerBgColor} />
              : <Feather name="download" size={16} color={canOpen ? Style.headerBgColor : '#bbb'} />}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    );
  }, [navigation, downloadingId, downloadDocument]);

  // ===== Receipt card (same design language as invoice card) =====
  const renderReceiptItem = useCallback(({ item }) => {
    const isDownloading = downloadingId === (item._id || item.receiptNumber);
    const canOpen = !!item._id;
    return (
      <TouchableOpacity
        onPress={() => openReceiptView(item._id)}
        activeOpacity={0.7}
        style={{
          width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 12,
          marginBottom: 12, padding: 14,
        }}
      >
        {/* Header: Receipt Number + Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>{item.receiptNumber}</Text>
            <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 2 }}>
              {item.clientName || item.groupName || '-'}
            </Text>
          </View>
          <View style={{
            backgroundColor: item.status ? '#e8f5e9' : '#ffebee',
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
          }}>
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: item.status ? '#2e7d32' : '#c62828' }}>
              {item.status ? 'Success' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={{ fontSize: 20, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginBottom: 4 }}>
          Rs {Number(item.totalAmount || 0).toLocaleString()}/-
        </Text>

        {/* Narration + Payment mode */}
        {item.naration ? (
          <Text numberOfLines={2} style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 8 }}>
            {item.naration}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Feather name="credit-card" size={13} color={Style.secondryTextColor} />
          <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{formatMode(item.paymentmode)}</Text>
        </View>

        {/* Footer: Date + Actions (View / Download) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="calendar" size={13} color={Style.secondryTextColor} />
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(item.date).format('DD/MM/YYYY')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setViewerDoc({ id: item._id, type: DOC_TYPE.receipt, title: 'Receipt', number: item.receiptNumber })}
              disabled={!canOpen}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: canOpen ? '#eef2ff' : '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
            >
              <Feather name="eye" size={16} color={canOpen ? Style.headerBgColor : '#bbb'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => downloadReceiptPDF(item)}
              disabled={isDownloading || !canOpen}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: canOpen ? '#eef2ff' : '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
            >
              {isDownloading
                ? <ActivityIndicator size="small" color={Style.headerBgColor} />
                : <Feather name="download" size={16} color={canOpen ? Style.headerBgColor : '#bbb'} />}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [downloadingId, openReceiptView, downloadReceiptPDF]);

  const renderFooter = () => {
    const isLoading = activeTab === 'invoice' ? loading : receiptLoading;
    const count = activeTab === 'invoice' ? data.length : receiptData.length;
    if (!isLoading || count === 0) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Style.headerBgColor} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (activeTab === 'invoice') {
      if (loading) return null;
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <MaterialCommunityIcons name="file-document-outline" size={50} color="#ccc" />
          <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', marginTop: 12 }}>
            {startDate || statusD ? 'No invoices match your filters.' : 'No Invoices Available.'}
          </Text>
        </View>
      );
    }
    if (receiptLoading) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <MaterialCommunityIcons name="receipt" size={50} color="#ccc" />
        <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', marginTop: 12 }}>
          {receiptStartDate || receiptPaymentMode ? 'No receipts match your filters.' : 'No Receipts Available.'}
        </Text>
      </View>
    );
  };

  // Receipt view row helper
  const RVRow = ({ label, value }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, flex: 1.3, textAlign: 'right' }}>{value || '-'}</Text>
    </View>
  );

  const isInvoiceTab = activeTab === 'invoice';

  return (
    <>
    <DocumentViewer
      visible={!!viewerDoc}
      id={viewerDoc?.id}
      type={viewerDoc?.type}
      title={viewerDoc?.title}
      number={viewerDoc?.number}
      onClose={() => setViewerDoc(null)}
      onUnauthorized={onUnauthorized}
    />
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      {/* ===== Filter Modal (shared shell; fields depend on active tab) ===== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', backgroundColor: Style.basicbgColor, borderTopStartRadius: 24, borderTopEndRadius: 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#d0d0d0', alignSelf: 'center', marginTop: 12, marginBottom: 16, borderRadius: 2 }} />

            {/* Title + Reset */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Filters</Text>
              <TouchableOpacity onPress={isInvoiceTab ? resetFilters : resetReceiptFilters} style={{ paddingHorizontal: 14, height: 34, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>Reset</Text>
              </TouchableOpacity>
            </View>

            {isInvoiceTab ? (
              <>
                {/* Invoice: Status */}
                <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Status</Text>
                <View style={{ marginBottom: 16 }}>
                  <SelectDropdown
                    data={statusData}
                    onSelect={(selected) => setStatusD(selected)}
                    defaultValue={statusD || undefined}
                    renderButton={(selected, isOpened) => (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>{(selected && selected) || 'Select Status'}</Text>
                        <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                      </View>
                    )}
                    renderItem={(selected, index, isSelected) => (
                      <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                        <Text style={styles.dropdownItemTxtStyle}>{selected}</Text>
                      </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    dropdownStyle={styles.dropdownMenuStyle}
                  />
                </View>

                {/* Invoice: Date */}
                <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Date</Text>
                <TouchableOpacity onPress={showDatePicker} style={{
                  height: 50, borderRadius: 10, flexDirection: 'row',
                  backgroundColor: '#f5f5f5', paddingHorizontal: 14,
                  alignItems: 'center', marginBottom: 24,
                }}>
                  <Feather name="calendar" size={18} color={Style.headerBgColor} />
                  <Text style={{ flex: 1, color: startDate ? Style.primaryTextColor : Style.secondryTextColor, fontFamily: 'Lato-SemiBold', fontSize: 14, marginLeft: 10 }}>{formattedDate}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!startDate && !statusD}
                  onPress={applyFilters}
                  style={{
                    width: '100%', height: 48,
                    backgroundColor: (!startDate && !statusD) ? '#e0e0e0' : Style.headerBgColor,
                    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Lato-SemiBold', fontSize: 15, color: (!startDate && !statusD) ? '#999' : '#fff' }}>Apply Filters</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Receipt: Payment Mode */}
                <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Payment Mode</Text>
                <View style={{ marginBottom: 16 }}>
                  <SelectDropdown
                    data={PAYMENT_MODES}
                    onSelect={(selected) => setReceiptPaymentMode(selected)}
                    defaultValue={receiptPaymentMode || undefined}
                    renderButton={(selected, isOpened) => (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>{selected ? formatMode(selected) : 'Select Payment Mode'}</Text>
                        <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                      </View>
                    )}
                    renderItem={(selected, index, isSelected) => (
                      <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                        <Text style={styles.dropdownItemTxtStyle}>{formatMode(selected)}</Text>
                      </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    dropdownStyle={styles.dropdownMenuStyle}
                  />
                </View>

                {/* Receipt: Date */}
                <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Date</Text>
                <TouchableOpacity onPress={showReceiptDatePicker} style={{
                  height: 50, borderRadius: 10, flexDirection: 'row',
                  backgroundColor: '#f5f5f5', paddingHorizontal: 14,
                  alignItems: 'center', marginBottom: 24,
                }}>
                  <Feather name="calendar" size={18} color={Style.headerBgColor} />
                  <Text style={{ flex: 1, color: receiptStartDate ? Style.primaryTextColor : Style.secondryTextColor, fontFamily: 'Lato-SemiBold', fontSize: 14, marginLeft: 10 }}>{formattedReceiptDate}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!receiptStartDate && !receiptPaymentMode}
                  onPress={applyReceiptFilters}
                  style={{
                    width: '100%', height: 48,
                    backgroundColor: (!receiptStartDate && !receiptPaymentMode) ? '#e0e0e0' : Style.headerBgColor,
                    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Lato-SemiBold', fontSize: 15, color: (!receiptStartDate && !receiptPaymentMode) ? '#999' : '#fff' }}>Apply Filters</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={startDate || new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
      <DateTimePickerModal
        isVisible={isReceiptDatePickerVisible}
        mode="date"
        date={receiptStartDate || new Date()}
        onConfirm={handleReceiptConfirm}
        onCancel={hideReceiptDatePicker}
      />

      {/* ===== Receipt View Modal ===== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={receiptViewVisible}
        onRequestClose={closeReceiptView}
      >
        <View style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', maxHeight: '88%', backgroundColor: Style.primaryBgColor, borderTopStartRadius: 24, borderTopEndRadius: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Receipt Details</Text>
              <TouchableOpacity onPress={closeReceiptView} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                <AntDesign name="close" size={18} color={Style.secondryTextColor} />
              </TouchableOpacity>
            </View>

            {receiptViewLoading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Style.headerBgColor} />
              </View>
            ) : receiptViewData ? (
              <ScrollView
                style={{ paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <RVRow label="Receipt Number" value={receiptViewData.receiptNumber} />
                  <RVRow label="Client Name" value={receiptViewData.clientId?.fullName} />
                  <RVRow label="Date" value={receiptViewData.date ? moment(receiptViewData.date).format('DD MMM YYYY') : '-'} />
                  <RVRow label="Narration" value={receiptViewData.naration} />
                  <RVRow label="Payment Mode" value={formatMode(receiptViewData.paymentmode)} />
                </View>

                {/* Amounts */}
                <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <RVRow label="Sub Total" value={`Rs ${Number(receiptViewData.subTotalAmount || 0).toLocaleString()}/-`} />
                  <RVRow label="Total Amount" value={`Rs ${Number(receiptViewData.totalAmount || 0).toLocaleString()}/-`} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Grand Total</Text>
                    <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>Rs {Number(receiptViewData.grandTotalAmount || 0).toLocaleString()}/-</Text>
                  </View>
                </View>

                {/* Heads */}
                {Array.isArray(receiptViewData.heads) && receiptViewData.heads.length > 0 && (
                  <View style={{ backgroundColor: Style.basicbgColor, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginBottom: 8 }}>Heads</Text>
                    {receiptViewData.heads.map((h, idx) => (
                      <View key={idx} style={{ paddingVertical: 8, borderTopWidth: idx === 0 ? 0 : 0.5, borderTopColor: '#eee' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>{formatMode(h.headType)}</Text>
                          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>Rs {Number(h.amount || 0).toLocaleString()}/-</Text>
                        </View>
                        {h.invoiceId ? (
                          <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 2 }}>Invoice ID: {h.invoiceId}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Download PDF */}
                <TouchableOpacity
                  onPress={() => downloadReceiptPDF(receiptViewData)}
                  disabled={!receiptViewData._id || downloadingId === receiptViewData._id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    height: 48, borderRadius: 12,
                    backgroundColor: receiptViewData._id ? Style.headerBgColor : '#e0e0e0',
                  }}
                >
                  {downloadingId === receiptViewData._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="download" size={16} color={receiptViewData._id ? '#fff' : '#999'} />
                      <Text style={{ fontFamily: 'Lato-SemiBold', fontSize: 15, color: receiptViewData._id ? '#fff' : '#999' }}>Download Receipt PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>No receipt data.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== Header ===== */}
      <Animated.View style={{ paddingHorizontal: 20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Invoices</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifikation')} style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="bell" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, height: 46, marginTop: 14, marginBottom: 14, paddingHorizontal: 14 }}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            placeholder={isInvoiceTab ? "Search invoices..." : "Search receipts..."}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={isInvoiceTab ? searchQuery : receiptSearchQuery}
            onChangeText={isInvoiceTab ? handleSearch : handleReceiptSearch}
            style={{ flex: 1, fontSize: 14, fontFamily: 'Lato-Medium', color: '#fff', marginLeft: 10, padding: 0 }}
          />
          {(isInvoiceTab ? searchQuery : receiptSearchQuery) ? (
            <TouchableOpacity onPress={() => (isInvoiceTab ? handleSearch('') : handleReceiptSearch(''))}>
              <AntDesign name="close" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4, marginBottom: 18 }}>
          {[{ key: 'invoice', label: 'Invoices' }, { key: 'receipt', label: 'Receipts' }].map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.8}
                style={{ flex: 1, height: 38, borderRadius: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: active ? '#fff' : 'transparent' }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: active ? Style.headerBgColor : 'rgba(255,255,255,0.85)' }}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, paddingTop: 16, paddingHorizontal: 16 }}>
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          {/* Toolbar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>{isInvoiceTab ? 'All Invoices' : 'All Receipts'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity onPress={onToolbarRefresh} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Fontisto name="spinner-refresh" size={16} color={Style.secondryTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Feather name="sliders" size={16} color={Style.secondryTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {isInvoiceTab ? (
            loading && data.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={Style.headerBgColor} />
              </View>
            ) : (
              <FlatList
                data={displayData}
                keyExtractor={(item) => item._id?.toString()}
                renderItem={renderItem}
                onEndReached={filteredData === null ? loadMore : undefined}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />}
              />
            )
          ) : (
            receiptLoading && receiptData.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={Style.headerBgColor} />
              </View>
            ) : (
              <FlatList
                data={receiptDisplayData}
                keyExtractor={(item) => item._id?.toString()}
                renderItem={renderReceiptItem}
                onEndReached={receiptFilteredData === null ? receiptLoadMore : undefined}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={receiptRefreshing} onRefresh={onPullRefresh} />}
              />
            )
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
    </>
  );
}
const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: Style.primaryTextColor,
  },
  dropdownButtonArrowStyle: {
    fontSize: 22,
    color: Style.secondryTextColor,
  },
  dropdownMenuStyle: {
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: Style.primaryTextColor,
  },
});
