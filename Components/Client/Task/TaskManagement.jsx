import React, { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Animated, RefreshControl, FlatList, Modal, StyleSheet, ToastAndroid, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';
import usePaginatedList from '../../../hooks/usePaginatedList';

import { AntDesign, Feather, Entypo, Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import NotificationBell from "../NotificationBell";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function TaskManagement({ navigation }) {

const dispatch = useDispatch();
const insets = useSafeAreaInsets();

const CLIENT_TASK_STATUS_PENDING = "Pending"
const CLIENT_TASK_STATUS_REJECT = "Rejected"
const CLIENT_TASK_STATUS_ASSIGNED = "Assigned"
const CLIENT_TASK_STATUS_RESTART = "re_start"
const CLIENT_TASK_STATUS_REASSIGNED = "re_assigned"
const CLIENT_TASK_STATUS_REQ_REJECTED = "request_rejected"
const CLIENT_TASK_STATUS_ACCEPTED = "Accepted"
const CLIENT_TASK_STATUS_REASSIGN_TO_OTHER = "reAssign_to_other"
const CLIENT_TASK_STATUS_PENDING_AT_CLIENT = "Pending_at_client"
const CLIENT_TASK_STATUS_PENDING_AT_DEPARTMENT = "Pending_at_department"
const CLIENT_TASK_STATUS_PENDING_AT_COLLEAGUE = "Pending_at_colleague"
const CLIENT_TASK_STATUS_PENDING_AT_MANAGER = "Pending_at_manager"
const CLIENT_TASK_STATUS_WORK_IN_PROGRESS = "Work_in_progress"
const CLIENT_TASK_STATUS_PENDING_FOR_FEE = "Pending_for_fees"
const CLIENT_TASK_STATUS_COMPLETED = "Completed"
const CLIENT_TASK_STATUS_STOP = "Task_Stop"
const CLIENT_TASK_STATUS_PENDING_FOR_APPROVAL = "Pending_for_approval"
const CLIENT_TASK_STATUS_ARR = [
    CLIENT_TASK_STATUS_PENDING,
    CLIENT_TASK_STATUS_REJECT,
    CLIENT_TASK_STATUS_ASSIGNED,
    CLIENT_TASK_STATUS_RESTART,
    CLIENT_TASK_STATUS_REASSIGNED,
    CLIENT_TASK_STATUS_REQ_REJECTED,
    CLIENT_TASK_STATUS_ACCEPTED,
    CLIENT_TASK_STATUS_REASSIGN_TO_OTHER,
    CLIENT_TASK_STATUS_PENDING_AT_CLIENT,
    CLIENT_TASK_STATUS_PENDING_AT_DEPARTMENT,
    CLIENT_TASK_STATUS_PENDING_AT_COLLEAGUE,
    CLIENT_TASK_STATUS_PENDING_AT_MANAGER,
    CLIENT_TASK_STATUS_WORK_IN_PROGRESS,
    CLIENT_TASK_STATUS_PENDING_FOR_APPROVAL,
    CLIENT_TASK_STATUS_PENDING_FOR_FEE,
    CLIENT_TASK_STATUS_COMPLETED,
    CLIENT_TASK_STATUS_STOP,
]

  const [scale] = useState(new Animated.Value(0));

  const [modalVisible, setModalVisible] = useState(false);
  const [deparement, setDepartment] = useState('');
  const [statusD, setStatusD] = useState('');
  const [departmentData, setDepartmentData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  const filtersRef = useRef({ deparement: '', statusD: '', startDate: '', endDate: '' });

  const DATE_FILTERS = [
    { key: 'latest_month', label: 'This Month' },
    { key: 'one_month',    label: '1 Month' },
    { key: 'three_month',  label: '3 Months' },
    { key: 'six_month',    label: '6 Months' },
    { key: 'yearly',       label: 'Yearly' },
    { key: 'custom',       label: 'Custom' },
  ];

  // Updated: Return dates in YYYY/MM/DD format
  const computeDateRange = (filterKey, start, end) => {
    const now = moment();
    switch (filterKey) {
      case 'latest_month':
        return { 
          startDate: now.clone().startOf('month').format('YYYY/MM/DD'), 
          endDate: now.clone().format('YYYY/MM/DD') 
        };
      case 'one_month':
        return { 
          startDate: now.clone().subtract(1, 'months').format('YYYY/MM/DD'), 
          endDate: now.clone().format('YYYY/MM/DD') 
        };
      case 'three_month':
        return { 
          startDate: now.clone().subtract(3, 'months').format('YYYY/MM/DD'), 
          endDate: now.clone().format('YYYY/MM/DD') 
        };
      case 'six_month':
        return { 
          startDate: now.clone().subtract(6, 'months').format('YYYY/MM/DD'), 
          endDate: now.clone().format('YYYY/MM/DD') 
        };
      case 'yearly':
        return { 
          startDate: now.clone().subtract(1, 'year').format('YYYY/MM/DD'), 
          endDate: now.clone().format('YYYY/MM/DD') 
        };
      case 'custom':
        return {
          startDate: start ? moment(start).format('YYYY/MM/DD') : '',
          endDate: end ? moment(end).format('YYYY/MM/DD') : '',
        };
      default:
        return { startDate: '', endDate: '' };
    }
  };

  const openDatePicker = (target) => {
    DateTimePickerAndroid.open({
      value: target === 'start' ? (customStartDate || new Date()) : (customEndDate || new Date()),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          if (target === 'start') setCustomStartDate(selectedDate);
          else setCustomEndDate(selectedDate);
        }
      },
    });
  };

  const onUnauthorized = useCallback(async () => {
    dispatch(logout());
    await AsyncStorage.removeItem('token');
    await AsyncStorage.clear();
    navigation.navigate('Autologin');
  }, [dispatch, navigation]);

  const buildBody = useCallback(() => {
    const body = {
      text: "",
      sort: true,
      status: filtersRef.current.statusD || "",
      departmentId: filtersRef.current.deparement || "",
      isPagination: false,
    };
    if (filtersRef.current.startDate) body.startDate = filtersRef.current.startDate;
    if (filtersRef.current.endDate) body.endDate = filtersRef.current.endDate;
    // console.log("date filter", JSON.stringify(body, null, 2))
    return body;
  }, []);

  const extractDocs = useCallback((result) => result.data?.docs, []);

  const { data, allData, loading, refreshing, hasMore, loadFirst, loadMore, refresh } = usePaginatedList({
    url: `${BASE_URL}/client/task/list`,
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

  useFocusEffect(
    useCallback(() => {
      const { startDate, endDate } = computeDateRange(dateFilter, customStartDate, customEndDate);
      filtersRef.current = { deparement, statusD, startDate, endDate };
      loadFirst();
    }, [deparement, statusD, dateFilter, customStartDate, customEndDate]) // Added dependencies
  );

  useEffect(() => {
    getDepartment();
  }, []);

  const getDepartment = async () => {
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`${BASE_URL}/client/task/department`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if(result.statusCode === 200){
          setDepartmentData(result.data);
        }else{
          showToast(result.message);
        }
      })
      .catch((error) => console.error(error));
  }

  // Determine display list (search filters client-side)
  const displayData = filteredData !== null ? filteredData : data;
  // console.log( "🚀 Building request body with filters:", JSON.stringify(displayData, null, 2)); 

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(null);
    } else {
      const results = allData().filter(item =>
        item.taskName?.toLowerCase().includes(text.toLowerCase()) ||
        item.departmentData?.name?.toLowerCase().includes(text.toLowerCase()) ||
        item.code?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    }
  };

  const applyFilters = () => {
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    // useFocusEffect will automatically trigger loadFirst with new filters
  };

  const resetFilters = () => {
    setDepartment('');
    setStatusD('');
    setDateFilter(null);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilteredData(null);
    refresh();
  };

  const getStatusColor = (status) => {
    if (status === "Task_Stop") return { bg: '#ffebee', text: '#c62828' };
    if (status === "Completed") return { bg: '#e8f5e9', text: '#2e7d32' };
    if (status === "Assigned") return { bg: '#e3f2fd', text: '#1565c0' };
    if (status === "Work_in_progress") return { bg: '#fff3e0', text: '#e65100' };
    return { bg: '#f5f5f5', text: '#757575' };
  };

  const getStatusDisplayName = (status) => {
    return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  const renderItem = useCallback(({ item }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity
        onPress={() => { navigation.navigate('TaskSummary', { _id: item._id }) }}
        activeOpacity={0.7}
        style={{
          width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 12,
          marginBottom: 12, padding: 14,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
        }}
      >
        {/* Header: Task Name + Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor, flex: 1, marginRight: 10 }}>{item.taskName}</Text>
          <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: statusStyle.text }}>
              {getStatusDisplayName(item.status)}
            </Text>
          </View>
        </View>

        {/* Department */}
        <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 6 }}>
          {item.departmentData?.name || 'No Department'}
        </Text>

        {/* Code */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>Code: </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{item.code}</Text>
        </View>

        {/* Assigned To */}
        {item.assignedEmployeData?.map((employee, empIndex) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }} key={empIndex}>
            <Feather name="user" size={12} color={Style.secondryTextColor} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{employee.fullName}</Text>
          </View>
        ))}

        {/* Footer: Date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 10, marginTop: 8 }}>
          <Feather name="calendar" size={13} color={Style.secondryTextColor} style={{ marginRight: 6 }} />
          {
            item.status === 'Completed' ?
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(item.taskCompletedAt).format('DD/MM/YYYY')}</Text> :
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(item.createdAt).format('DD/MM/YYYY')}</Text>
          }
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
        <MaterialCommunityIcons name="clipboard-text-outline" size={50} color="#ccc" />
        <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textAlign: 'center', marginTop: 12 }}>
          {deparement || statusD || dateFilter ? 'No tasks match your filters.' : 'No Tasks Available.'}
        </Text>
      </View>
    );
  };

  const getFilterSummary = () => {
    if (dateFilter) {
      const filterLabel = DATE_FILTERS.find(f => f.key === dateFilter)?.label;
      return `${filterLabel} Tasks`;
    }
    return 'All Tasks';
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Modal
           animationType="slide"
           transparent={true}
           visible={modalVisible}
           onRequestClose={() => {
             setModalVisible(false);
           }}>
         <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' }}>
          <View style={{ width: '100%', backgroundColor: Style.basicbgColor, borderTopStartRadius: 24, borderTopEndRadius: 24, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#d0d0d0', alignSelf: 'center', marginTop: 12, marginBottom: 16, borderRadius: 2 }} />

            {/* Title + Reset */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} style={{ paddingHorizontal: 14, height: 34, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>Reset All</Text>
              </TouchableOpacity>
            </View>

            {/* Department Dropdown */}
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Department</Text>
            <View style={{ marginBottom: 16 }}>
              <SelectDropdown
                data={departmentData}
                defaultValue={deparement}
                onSelect={(selectedDepartment) => {
                  setDepartment(selectedDepartment?._id || '');
                }}
                buttonTextAfterSelection={(selectedDepartment) => selectedDepartment?.name || 'Select Department'}
                rowTextForSelection={(item) => item?.name || ''}
                renderButton={(selectedDepartment, isOpened) => {
                  return (
                    <View style={styles.dropdownButtonStyle}>
                      <Text style={styles.dropdownButtonTxtStyle}>
                        {selectedDepartment ? selectedDepartment.name : 'Select Department'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                    </View>
                  );
                }}
                renderItem={(item, index, isSelected) => {
                  return (
                    <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                      <Text style={styles.dropdownItemTxtStyle}>{item.name}</Text>
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
            </View>

            {/* Status Dropdown */}
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8 }}>Status</Text>
            <View style={{ marginBottom: 24 }}>
              <SelectDropdown
                data={CLIENT_TASK_STATUS_ARR}
                defaultValue={statusD}
                onSelect={(selectedStatus) => {
                  setStatusD(selectedStatus);
                }}
                buttonTextAfterSelection={(selectedStatus) => getStatusDisplayName(selectedStatus)}
                rowTextForSelection={(item) => getStatusDisplayName(item)}
                renderButton={(selectedStatus, isOpened) => {
                  return (
                    <View style={styles.dropdownButtonStyle}>
                      <Text style={styles.dropdownButtonTxtStyle}>
                        {selectedStatus ? getStatusDisplayName(selectedStatus) : 'Select Status'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                    </View>
                  );
                }}
                renderItem={(item, index, isSelected) => {
                  return (
                    <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                      <Text style={styles.dropdownItemTxtStyle}>{getStatusDisplayName(item)}</Text>
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
            </View>

            {/* Date Filter */}
            <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 10 }}>Date Range</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: dateFilter === 'custom' ? 12 : 24 }}>
              {DATE_FILTERS.map(f => {
                const isActive = dateFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => {
                      setDateFilter(isActive ? null : f.key);
                      if (f.key !== 'custom') { 
                        setCustomStartDate(null); 
                        setCustomEndDate(null); 
                      }
                    }}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? Style.headerBgColor : '#f5f5f5',
                      borderWidth: 1.5,
                      borderColor: isActive ? Style.headerBgColor : '#e8e8e8',
                    }}
                  >
                    <Text style={{
                      fontSize: 13, fontFamily: 'Lato-SemiBold',
                      color: isActive ? '#fff' : Style.primaryTextColor,
                    }}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Pickers */}
            {dateFilter === 'custom' && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => openDatePicker('start')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, height: 46, borderRadius: 10,
                    backgroundColor: '#f5f5f5', borderWidth: 1,
                    borderColor: customStartDate ? Style.headerBgColor : '#e0e0e0',
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                  }}
                >
                  <Feather name="calendar" size={15} color={customStartDate ? Style.headerBgColor : Style.secondryTextColor} style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 13, fontFamily: 'Lato-SemiBold',
                    color: customStartDate ? Style.primaryTextColor : Style.secondryTextColor,
                  }}>
                    {customStartDate ? moment(customStartDate).format('DD MMM YYYY') : 'Start Date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDatePicker('end')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, height: 46, borderRadius: 10,
                    backgroundColor: '#f5f5f5', borderWidth: 1,
                    borderColor: customEndDate ? Style.headerBgColor : '#e0e0e0',
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                  }}
                >
                  <Feather name="calendar" size={15} color={customEndDate ? Style.headerBgColor : Style.secondryTextColor} style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 13, fontFamily: 'Lato-SemiBold',
                    color: customEndDate ? Style.primaryTextColor : Style.secondryTextColor,
                  }}>
                    {customEndDate ? moment(customEndDate).format('DD MMM YYYY') : 'End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
          </View>
         </TouchableOpacity>
        </Modal>

      <Animated.View style={{ paddingHorizontal: 20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Task Management</Text>
          </View>
          <NotificationBell navigation={navigation} />
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, height: 46, marginTop: 14, marginBottom: 18, paddingHorizontal: 14 }}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            placeholder="Search tasks..."
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
                <Feather name="sliders" size={16} color={(deparement || statusD || dateFilter) ? Style.headerBgColor : Style.secondryTextColor} />
                {(deparement || statusD || dateFilter) && (
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
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
    height: 300,
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