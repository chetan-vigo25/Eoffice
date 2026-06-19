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

export default function InvoiceList({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [statusD, setStatusD] = useState('');
  const [startDate, setStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const statusData = ['Paid', 'PendingPayment'];

  const filtersRef = React.useRef({ statusD: '', startDate: '' });

  const onUnauthorized = useCallback(async () => {
    dispatch(logout());
    showToast("Session expired. Please log in again.");
    await AsyncStorage.removeItem("token");
    navigation.navigate("Autologin");
  }, [dispatch, navigation]);

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

  // console.log("Displayed Invoices:", JSON.stringify(displayData, null, 2));

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

  const renderItem = useCallback(({ item }) => (
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
        <View style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={require('../../../assets/shareIcon.png')} resizeMode="contain" style={{ width: 20, height: 20 }} />
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

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
          {startDate || statusD ? 'No invoices match your filters.' : 'No Invoices Available.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Modal
           animationType="slide"
           transparent={true}
           visible={modalVisible}
           onRequestClose={() => {
             setModalVisible(false)
           }}>
         <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', backgroundColor: Style.basicbgColor, borderTopStartRadius: 24, borderTopEndRadius: 24, paddingHorizontal: 20, paddingBottom: 20 }}>
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#d0d0d0', alignSelf: 'center', marginTop: 12, marginBottom: 16, borderRadius: 2 }} />

            {/* Title + Reset */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} style={{ paddingHorizontal: 14, height: 34, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Fields */}
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Status</Text>
            <View style={{ marginBottom: 16 }}>
              <SelectDropdown
                data={statusData}
                onSelect={(statusData, index) => {
                  setStatusD(statusData);
                }}
                renderButton={(statusData, isOpened) => {
                  return (
                    <View style={styles.dropdownButtonStyle}>
                      <Text style={styles.dropdownButtonTxtStyle}>
                        {(statusData && statusData) || 'Select Status'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                    </View>
                  );
                }}
                renderItem={(statusData, index, isSelected) => {
                  return (
                    <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                      <Text style={styles.dropdownItemTxtStyle}>{statusData}</Text>
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Date</Text>
            <TouchableOpacity onPress={showDatePicker} style={{
              height: 50, borderRadius: 10, flexDirection: 'row',
              backgroundColor: '#f5f5f5', paddingHorizontal: 14,
              alignItems: 'center', marginBottom: 24,
            }}>
              <Feather name="calendar" size={18} color={Style.headerBgColor} />
              <Text style={{ flex: 1, color: startDate ? Style.primaryTextColor : Style.secondryTextColor, fontFamily: 'Lato-SemiBold', fontSize: 14, marginLeft: 10 }}>{formattedDate}</Text>
            </TouchableOpacity>

            {/* Apply Button */}
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
            <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>All Invoices</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity onPress={resetFilters} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Fontisto name="spinner-refresh" size={16} color={Style.secondryTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Style.basicbgColor, justifyContent: 'center', alignItems: 'center', elevation: 1 }}>
                <Feather name="sliders" size={16} color={Style.secondryTextColor} />
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
