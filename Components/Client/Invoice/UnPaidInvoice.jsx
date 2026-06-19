import React, { useState, useEffect, useCallback } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, RefreshControl, FlatList, Modal, StyleSheet, UIManager, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectDropdown from 'react-native-select-dropdown'
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import usePaginatedList from '../../../hooks/usePaginatedList';

import { AntDesign, Feather, Entypo, Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function UnPaidInvoice({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [statusD, setStatusD] = useState('PendingPayment'); // Default to PendingPayment
  const [startDate, setStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const statusData = ['All', 'Paid', 'PendingPayment'];

  const filtersRef = React.useRef({ statusD: 'PendingPayment', startDate: '' });

  const onUnauthorized = useCallback(async () => {
    dispatch(logout());
    showToast("Session expired. Please log in again.");
    await AsyncStorage.removeItem("token");
    navigation.navigate("Autologin");
  }, [dispatch, navigation]);

  const buildBody = useCallback(() => {
    const body = {
      text: "",
      sort: true,
      departmentId: "",
      isPagination: false,
    };
    
    // Add status filter if not 'All'
    if (filtersRef.current.statusD && filtersRef.current.statusD !== 'All') {
      body.status = filtersRef.current.statusD;
    }
    
    // Add date filter if present
    if (filtersRef.current.startDate) {
      body.date = filtersRef.current.startDate;
    }
    return body;
    
  }, []);

  const extractDocs = useCallback((result) => result.data?.docs, []);

  const { data, allData, loading, refreshing, hasMore, loadFirst, loadMore, refresh } = usePaginatedList({
    url: `${BASE_URL}/client/invoice/list`,
    buildBody,
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

  const displayData = filteredData !== null ? filteredData : data;

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

  const applyFilters = () => {
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { 
      statusD: statusD, 
      startDate: startDate ? moment(startDate).format("YYYY/MM/DD") : '' 
    };
    loadFirst();
  };

  const resetFilters = () => {
    setStartDate('');
    setStatusD('PendingPayment');
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD: 'PendingPayment', startDate: '' };
    loadFirst();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { 
      statusD: statusD, 
      startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : '' 
    };
    refresh();
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setStartDate(date);
    hideDatePicker();
  };
  const formattedDate = startDate ? moment(startDate).format("DD/MM/YYYY") : "Select Date";

  const onRefresh = () => {
    handleRefresh();
  };
//   console.log('formattedDate', formattedDate)
//   console.log('startDate', startDate)

  const getStatusStyle = (status) => {
    if (status === 'Paid') {
      return { bg: '#e8f5e9', text: '#2e7d32', label: 'Paid' };
    }
    return { bg: '#ffebee', text: '#c62828', label: 'Unpaid' };
  };

  const renderItem = useCallback(({ item }) => {
    const statusStyle = getStatusStyle(item.status);
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
            backgroundColor: statusStyle.bg,
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
          }}>
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: statusStyle.text }}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={{ fontSize: 20, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginBottom: 8 }}>
          ₹ {item.grandTotal?.toLocaleString('en-IN')}/-
        </Text>

        {/* Footer: Date + Share */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="calendar" size={13} color={Style.secondryTextColor} />
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
              {moment(item.updatedAt).format('DD/MM/YYYY')}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              // Handle share functionality
              if (item.invoicePDFurl) {
                // Add share logic here
                showToast("Share feature coming soon");
              }
            }}
            style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}
          >
            <Image source={require('../../../assets/shareIcon.png')} resizeMode="contain" style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderFooter = () => {
    if (!loading || data.length === 0) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Style.headerBgColor} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <MaterialCommunityIcons name="file-document-outline" size={50} color="#ccc" />
        <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', marginTop: 12 }}>
          {startDate || (statusD && statusD !== 'PendingPayment') ? 'No invoices match your filters.' : 'No Unpaid Invoices Available.'}
        </Text>
        {(startDate || (statusD && statusD !== 'PendingPayment')) && (
          <TouchableOpacity onPress={resetFilters} style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Get filter summary text
  const getFilterSummary = () => {
    if (statusD === 'PendingPayment' && !startDate) return 'Unpaid Invoices';
    if (statusD === 'Paid') return 'Paid Invoices';
    if (statusD === 'All') return 'All Invoices';
    if (startDate) return `Invoices from ${moment(startDate).format('DD/MM/YYYY')}`;
    return 'Unpaid Invoices';
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: Style.basicbgColor, borderTopStartRadius: 24, borderTopEndRadius: 24, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#d0d0d0', alignSelf: 'center', marginTop: 12, marginBottom: 16, borderRadius: 2 }} />

            {/* Title + Reset */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} style={{ paddingHorizontal: 14, height: 34, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>Reset All</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Status</Text>
            <View style={{ marginBottom: 16 }}>
              <SelectDropdown
                data={statusData}
                defaultValue={statusD}
                onSelect={(selectedStatus) => {
                  setStatusD(selectedStatus);
                }}
                buttonTextAfterSelection={(selectedStatus) => selectedStatus}
                rowTextForSelection={(item) => item}
                renderButton={(selectedStatus, isOpened) => {
                  return (
                    <View style={styles.dropdownButtonStyle}>
                      <Text style={styles.dropdownButtonTxtStyle}>
                        {selectedStatus || 'Select Status'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                    </View>
                  );
                }}
                renderItem={(item, index, isSelected) => {
                  return (
                    <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                      <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
            </View> */}

            {/* Date Filter */}
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Select Date</Text>
            <TouchableOpacity onPress={showDatePicker} style={{
              height: 50, borderRadius: 10, flexDirection: 'row',
              backgroundColor: '#f5f5f5', paddingHorizontal: 14,
              alignItems: 'center', marginBottom: 24,
            }}>
              <Feather name="calendar" size={18} color={Style.headerBgColor} />
              <Text style={{ flex: 1, color: startDate ? Style.primaryTextColor : Style.secondryTextColor, fontFamily: 'Lato-SemiBold', fontSize: 14, marginLeft: 10 }}>{formattedDate}</Text>
              {startDate && (
                <TouchableOpacity onPress={() => setStartDate('')}>
                  <AntDesign name="close" size={16} color={Style.secondryTextColor} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={applyFilters}
              style={{
                width: '100%', height: 48,
                backgroundColor: Style.headerBgColor,
                borderRadius: 12, justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Lato-SemiBold', fontSize: 15, color: '#fff' }}>Apply Filters</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={startDate || new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
      
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
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, height: 46, marginTop: 14, marginBottom: 18, paddingHorizontal: 14 }}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            placeholder="Search invoices..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={handleSearch}
            style={{ flex: 1, fontSize: 14, fontFamily: 'Lato-Medium', color: '#fff', marginLeft: 10, padding: 0 }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <AntDesign name="close" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      <View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, paddingTop: 16, paddingHorizontal: 16 }}>
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          {/* Toolbar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>
              {getFilterSummary()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity onPress={resetFilters} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Fontisto name="spinner-refresh" size={16} color={Style.secondryTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Feather name="sliders" size={16} color={(statusD !== 'PendingPayment' || startDate) ? Style.headerBgColor : Style.secondryTextColor} />
                {(statusD !== 'PendingPayment' || startDate) && (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e65100', borderWidth: 1.5, borderColor: '#fff' }} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {loading && data.length === 0 ? (
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
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
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