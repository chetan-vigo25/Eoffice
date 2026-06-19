import React, { useState, useEffect, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, ScrollView, Modal, StyleSheet, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign, Feather, Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function AdvancedList({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [scale] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advanceData, setAdvanceData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isDatePickerVisible2, setDatePickerVisibility2] = useState(false);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    getAdvanceList();
  }, []);

  const getAdvanceList = async () => {
    if (logoutHandled.current) return;
    setLoading(true);
    let token = await AsyncStorage.getItem("token");
    if (!token) {
      navigation.navigate('Autologin');
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": "",
      "isPagination": false,
      "startDate": startDate,
      "endDate": endDate
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(`${BASE_URL}/client/advance/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        const data = result.data.docs || [];
        setAdvanceData(data);
        setFilteredData(data);
        if (data.length === 0 && (startDate || endDate)) {
          showToast("No data found for the selected date range.");
        }
      } else if (result.statusCode === 401) {
        dispatch(logout());
        await AsyncStorage.removeItem('token');
        await AsyncStorage.clear();
        navigation.navigate('Autologin');
      } else {
        showToast(result.message || "Something went wrong.");
        setAdvanceData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error(error);
      setAdvanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const showDefault = async () => {
    setLoading(true);
    setStartDate('');
    setEndDate('');
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": "",
      "isPagination": false,
      "startDate": "",
      "endDate": "",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch(`${BASE_URL}/client/advance/list`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          // console.log('tttttttt', JSON.stringify(result.data.docs, null, 2))
          setAdvanceData(result.data.docs);
          setFilteredData(result.data.docs);
        } else {
          showToast(result.message);
          setAdvanceData([]);
          setFilteredData([]);
        }
      })
      .catch((error) => {
        setAdvanceData([]);
        setFilteredData([]);
        console.error(error);
      })
      .finally(() => setLoading(false));
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setStartDate(date);
    hideDatePicker();
  };

  const showDatePicker2 = () => setDatePickerVisibility2(true);
  const hideDatePicker2 = () => setDatePickerVisibility2(false);
  const handleConfirm2 = (date) => {
    setEndDate(date);
    hideDatePicker2();
  };

  const formattedDate = startDate ? moment(startDate).format("DD MMM YYYY") : "From Date";
  const formattedDateTo = endDate ? moment(endDate).format("DD MMM YYYY") : "To Date";

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(advanceData);
    } else {
      const results = advanceData.filter(item =>
        item.receiptNumber?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getAdvanceList();
    }, [])
  );

  const getStatusConfig = (status) => {
    if (status === 'Paid') {
      return { bg: '#D1FAE5', text: '#065F46', label: 'Received' };
    }
    return { bg: '#FEF3C7', text: '#92400E', label: 'Adjusted' };
  };

  const StatementCard = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    return (
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 14,
        padding: 16,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.06,
        // shadowRadius: 8,
        // elevation: 2,
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: Style.headerBgColor,
            fontFamily: 'Lato-Bold'
          }}>
            Advance {item.receiptNumber}
          </Text>
          <View style={{
            backgroundColor: statusConfig.bg,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: statusConfig.text,
              fontFamily: 'Lato-Bold'
            }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Narration */}
        {item.naration && (
          <Text style={{
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 12,
            fontFamily: 'Lato-Medium'
          }}>
            {item.naration}
          </Text>
        )}

        {/* Amount */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#1F2937',
            fontFamily: 'Lato-Bold'
          }}>
            ₹ {item.amount?.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 }} />

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="wallet" size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Lato-Medium' }}>
              Balance: ₹ {item.balance?.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="calendar" size={12} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Lato-Medium' }}>
              {moment(item.createdAt).format('DD MMM YYYY')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}
        >
          <View style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: 28,
          }}>
            {/* Handle bar */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#E5E7EB',
              alignSelf: 'center',
              marginTop: 12,
              marginBottom: 20,
              borderRadius: 2
            }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
                fontFamily: 'Lato-Bold'
              }}>
                Filter Statements
              </Text>
              <TouchableOpacity
                onPress={() => { showDefault(); setModalVisible(false); }}
                style={{
                  paddingHorizontal: 14,
                  height: 34,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#6B7280',
                  fontFamily: 'Lato-Medium'
                }}>
                  Reset All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Range */}
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#6B7280',
              marginBottom: 8,
              fontFamily: 'Lato-Bold',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Date Range
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              {/* From Date */}
              <TouchableOpacity
                onPress={showDatePicker}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 14,
                }}
              >
                <Feather name="calendar" size={18} color={Style.headerBgColor} />
                <Text style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 13,
                  color: startDate ? '#1F2937' : '#9CA3AF',
                  fontFamily: 'Lato-Medium'
                }}>
                  {formattedDate}
                </Text>
              </TouchableOpacity>

              {/* To Date */}
              <TouchableOpacity
                onPress={showDatePicker2}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 14,
                }}
              >
                <Feather name="calendar" size={18} color={Style.headerBgColor} />
                <Text style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 13,
                  color: endDate ? '#1F2937' : '#9CA3AF',
                  fontFamily: 'Lato-Medium'
                }}>
                  {formattedDateTo}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              disabled={!startDate && !endDate}
              onPress={() => { setModalVisible(false); getAdvanceList(); }}
              style={{
                width: '100%',
                height: 52,
                backgroundColor: (!startDate && !endDate) ? '#E5E7EB' : Style.headerBgColor,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: (!startDate && !endDate) ? '#9CA3AF' : '#FFFFFF',
                fontFamily: 'Lato-Bold'
              }}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={startDate || new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible2}
        mode="date"
        date={endDate || new Date()}
        onConfirm={handleConfirm2}
        onCancel={hideDatePicker2}
      />

      {/* Header Section */}
      <Animated.View style={{ paddingHorizontal: 20, paddingTop: 8, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.15)'
            }}
          >
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Lato-Bold' }}>
              Statements
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifikation')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.15)'
            }}
          >
            <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 16,
          marginBottom: 20,
        }}>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            height: 48,
            paddingHorizontal: 16,
          }}>
            <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              placeholder="Search by receipt number..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={handleSearch}
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: 'Lato-Medium',
                color: '#fff',
                marginLeft: 12,
                paddingVertical: 12,
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <AntDesign name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {/* Content Section */}
      <View style={{
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 16,
      }}>
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          {/* Toolbar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingHorizontal: 4,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Style.headerBgColor,
              fontFamily: 'Lato-Bold'
            }}>
              All Statements
              {filteredData?.length > 0 && (
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: 'normal' }}>
                  {' '}({filteredData.length})
                </Text>
              )}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={showDefault}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // shadowColor: '#000',
                  // shadowOffset: { width: 0, height: 1 },
                  // shadowOpacity: 0.05,
                  // shadowRadius: 2,
                  // elevation: 1,
                }}
              >
                <Fontisto name="spinner-refresh" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // shadowColor: '#000',
                  // shadowOffset: { width: 0, height: 1 },
                  // shadowOpacity: 0.05,
                  // shadowRadius: 2,
                  // elevation: 1,
                }}
              >
                <Feather name="sliders" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Filters Display */}
          {(startDate || endDate) && (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
              paddingHorizontal: 4,
            }}>
              {startDate && (
                <View style={{
                  backgroundColor: '#E0E7FF',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Feather name="calendar" size={10} color="#3730A3" />
                  <Text style={{ fontSize: 11, color: '#3730A3' }}>
                    From: {moment(startDate).format('DD MMM YYYY')}
                  </Text>
                  <TouchableOpacity onPress={() => { setStartDate(''); getAdvanceList(); }}>
                    <AntDesign name="close" size={10} color="#3730A3" />
                  </TouchableOpacity>
                </View>
              )}
              {endDate && (
                <View style={{
                  backgroundColor: '#E0E7FF',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Feather name="calendar" size={10} color="#3730A3" />
                  <Text style={{ fontSize: 11, color: '#3730A3' }}>
                    To: {moment(endDate).format('DD MMM YYYY')}
                  </Text>
                  <TouchableOpacity onPress={() => { setEndDate(''); getAdvanceList(); }}>
                    <AntDesign name="close" size={10} color="#3730A3" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {loading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Style.headerBgColor} />
                <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
                  Loading statements...
                </Text>
              </View>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <StatementCard key={index} item={item} />
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <MaterialCommunityIcons name="file-document-outline" size={40} color="#D1D5DB" />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center',
                  marginBottom: 8,
                  fontFamily: 'Lato-Bold'
                }}>
                  {startDate || endDate ? 'No statements found' : 'No Statements Available'}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#9CA3AF',
                  textAlign: 'center',
                  fontFamily: 'Lato-Medium'
                }}>
                  {startDate || endDate
                    ? 'Try adjusting your date range or clear filters'
                    : 'Your statements will appear here once generated'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}