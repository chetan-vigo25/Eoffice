import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, StatusBar, ScrollView, Modal, TextInput, Alert, Image, TouchableOpacity, ActivityIndicator, ToastAndroid, Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from 'react-native-dropdown-select-list';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import BASE_URL from '../../../Urls/DomainUrl';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Feather } from "@expo/vector-icons";

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
            if (onOk);
          },
        },
      ],
      { cancelable: false }
    );
  }
}

const BALANCE_PALETTES = [
  { bg: '#eaf1ff', accent: '#6a8ff3' },
  { bg: '#fff0ed', accent: '#f4845f' },
  { bg: '#e8f7f0', accent: '#22a06b' },
  { bg: '#fdf4e0', accent: '#e6a400' },
  { bg: '#f4eefb', accent: '#7b61ff' },
  { bg: '#e7f5fb', accent: '#35a7d1' },
];

const getStatusInfo = (status) => {
  switch (status) {
    case 'Approved':
      return { label: 'Approved', color: '#22a06b', bg: '#e8f7f0' };
    case 'Rejected':
      return { label: 'Rejected', color: '#e94e4e', bg: '#fdecec' };
    case 'Pending':
    default:
      return { label: 'Pending', color: '#e6a400', bg: '#fdf4e0' };
  }
};

const formatDayType = (type) => {
  if (!type) return '';
  if (type === 'firstHalf') return 'First Half';
  if (type === 'secondHalf') return 'Second Half';
  if (type === 'fullDay') return 'Full Day';
  return type;
};

export default function LeaveManagement({ navigation }) {
    const { logout } = useContext(UserContext);

    const [manualRecords, setManualRecords] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingLeaveId, setEditingLeaveId] = useState(null);
    const [selectedDays, setSelectedDays] = useState('Single');
    const [leaveType, setLeaveType] = useState(null);
    const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
    const [leaveTypeMap, setLeaveTypeMap] = useState({});
    const [selectedDateVisible, setSelectedDateVisible] = useState(false);
    const [selectDate, setSelectDate] = useState(null);
    const [selDayType, setSelDayType] = useState(null);
    const [isFirstHalfDisabled, setIsFirstHalfDisabled] = useState(false);
    const [fromDateVisible, setFromDateVisible] = useState(false);
    const [fromDate, setFromDate] = useState(null);
    const [fromDateType, setFromDateType] = useState(null);
    const [toDateVisible, setToDateVisible] = useState(false);
    const [toDate, setToDate] = useState(null);
    const [toDateType, setToDateType] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [leaveListData, setLeaveListData] = useState([]);
    const [leaveRequestListData, setLeaveRequestListData] = useState([]);
    const [errors, setErrors] = useState({});
    const [loadingLeaveList, setLoadingLeaveList] = useState(true);
    const [loadingLeaveRequest, setLoadingLeaveRequest] = useState(true);

    // Day type options for multiple leave (firstHalf disabled by default)
    const multipleLeaveDefaultDayTypes = [
      { label: 'First Half (Not Available)', value: 'firstHalf', disabled: true },
      { label: 'Second Half', value: 'secondHalf', disabled: false },
      { label: 'Full Day', value: 'fullDay', disabled: false }
    ];

    const singleLeaveDayTypes = [
      { label: 'First Half', value: 'firstHalf', disabled: false },
      { label: 'Second Half', value: 'secondHalf', disabled: false },
      { label: 'Full Day', value: 'fullDay', disabled: false }
    ];

      const leaveData = [
        { type: "Casual Leave", total: 4, used: 1, available: 4, },
        { type: "Sick Leave", total: 20, used: 15, available: 5, },
        { type: "Paternity Leave", total: 30, used: 10, available: 30, },
      ];

      const PAGE_SIZE = 10;
      const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
      const [isLoadingMore, setIsLoadingMore] = useState(false);
      const combinedData = [...manualRecords, ...leaveRequestListData];
      const currentData = combinedData.slice(0, visibleCount);
      const hasMoreData = visibleCount < combinedData.length;

      const handleScroll = (event) => {
        if (isLoadingMore || !hasMoreData) return;
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 120;
        const isNearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isNearBottom) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, combinedData.length));
            setIsLoadingMore(false);
          }, 400);
        }
      };

      useEffect(() => {
        const loadUserData = async () => {
          try {
            const storedUserData = await AsyncStorage.getItem('userData');

            if (storedUserData) {
              const parsedData = JSON.parse(storedUserData);
              setUserData(parsedData);
              leaveRequestData(parsedData);
              leaveList(parsedData);
            }
          } catch (error) {
            console.error("Failed to load userData:", error);
          }
        };

        loadUserData();
      }, []);

      const leaveList = async (userDataParam) => {
        setLoadingLeaveList(true);
        try{
          let token = await AsyncStorage.getItem("authToken");
         if (!token) {
           showToast("Authentication token not found");
           return;
        }
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        const raw = JSON.stringify({
          "branchId": userDataParam?.branchId,
          "companyId": userDataParam?.companyId,
          "employeId": userDataParam?._id,
          "isPagination": false,
          "leaveTypeId": "",
          "sort": true,
          "status": "",
          "text": "",
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        const response = await fetch(`${BASE_URL}/admin/employe/assign/leave/employelist`, requestOptions);
        const result = await response.json();
        if (result.statusCode === 200) {
          setLeaveListData(result.data.docs || []);
          const leaveOptions = result.data.docs.map(leave => ({
            key: leave.leaveTypeData._id,
            value: leave.leaveTypeData.name
          }));
          setLeaveTypeOptions(leaveOptions);
          const leaveMapping = result.data.docs.reduce((acc, leave) => {
            acc[leave.leaveTypeData.name] = leave.leaveTypeData._id;
            return acc;
          }, {});
          setLeaveTypeMap(leaveMapping);
          setLoadingLeaveList(false);
        } else if (isUnauthorized(result)) {
          await handleEmployeUnauthorized(navigation, logout);
          setLoadingLeaveList(false);
        } else {
          console.error("Leave List API Error:", result.message);
          setLoadingLeaveList(false);
        }
        }catch(error){
          console.error("Failed to load Leave assign data:", error);
          setLoadingLeaveList(false);
        }
      };

      const leaveRequestData = async (userDataParam) => {
        setLoadingLeaveRequest(true);
        try{
          let token = await AsyncStorage.getItem("authToken");
         if (!token) {
           showToast("Authentication token not found");
           return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        let allData = [];
        let currentPage = 1;
        let hasNextPage = true;
        const limit = 50;

        while (hasNextPage) {
          const raw = JSON.stringify({
            "branchId": userDataParam?.branchId,
            "companyId": userDataParam?.companyId,
            "employeId": userDataParam?._id,
            "isPagination": true,
            "leaveTypeId": "",
            "page": currentPage,
            "limit": limit,
            "sort": true,
            "status": "",
            "text": "",
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };

          const response = await fetch(`${BASE_URL}/admin/employe/leaveRequest/list?page=${currentPage}&limit=${limit}`, requestOptions);
          const result = await response.json();

          if (result.statusCode === 200) {
            const pageData = result.data.docs || result.data || [];

            if (pageData.length === 0) {
              hasNextPage = false;
            } else {
              allData = [...allData, ...pageData];

              hasNextPage = result.data?.hasNextPage !== false;

              if (pageData.length < limit) {
                hasNextPage = false;
              }

              if (result.data?.totalPages) {
                hasNextPage = currentPage < result.data.totalPages;
              }

              currentPage++;
            }
          } else if (isUnauthorized(result)) {
            await handleEmployeUnauthorized(navigation, logout);
            hasNextPage = false;
            break;
          } else {
            console.error("Leave Request API Error:", result.message);
            if (currentPage === 1) {
              const rawAll = JSON.stringify({
                "branchId": userDataParam?.branchId,
                "companyId": userDataParam?.companyId,
                "employeId": userDataParam?._id,
                "isPagination": false,
                "leaveTypeId": "",
                "sort": true,
                "status": "",
                "text": "",
              });

              const requestOptionsAll = {
                method: "POST",
                headers: myHeaders,
                body: rawAll,
                redirect: "follow"
              };

              const responseAll = await fetch(`${BASE_URL}/admin/employe/leaveRequest/list`, requestOptionsAll);
              const resultAll = await responseAll.json();

              if (resultAll.statusCode === 200) {
                allData = resultAll.data.docs || resultAll.data || [];
                hasNextPage = false;
              } else if (isUnauthorized(resultAll)) {
                await handleEmployeUnauthorized(navigation, logout);
                hasNextPage = false;
              } else {
                showToast(resultAll.message || "Failed to fetch leave requests");
                hasNextPage = false;
              }
            } else {
              hasNextPage = false;
            }
          }
        }

        const myEmployeId = userDataParam?._id;
        const myLeaveRequests = myEmployeId
          ? allData.filter((item) => {
              const itemEmployeId =
                item?.employeId ||
                item?.employeData?._id ||
                item?.employeData?.employeId;
              return String(itemEmployeId) === String(myEmployeId);
            })
          : [];

        setLeaveRequestListData(myLeaveRequests);
        setVisibleCount(PAGE_SIZE);
        setLoadingLeaveRequest(false);
        }catch(error){
          console.error("Failed to load leave request data:", error);
          showToast("Error loading leave requests: " + error.message);
          setLoadingLeaveRequest(false);
        }
      };

      const validateLeaveForm = () => {
        let newErrors = {};

        if (!leaveType) newErrors.leaveType = "Leave type is required";
        if (!selectedDays) newErrors.selectedDays = "Select leave duration";

        if (selectedDays === "Single") {
          if (!selectDate) newErrors.selectDate = "Date is required";
          if (!selDayType) newErrors.selDayType = "Select day type";
        }

        if (selectedDays === "Multiple") {
          if (!fromDate) newErrors.fromDate = "From date is required";
          if (!toDate) newErrors.toDate = "To date is required";
          if (!fromDateType) newErrors.fromDateType = "From date type is required";
          if (!toDateType) newErrors.toDateType = "To date type is required";
        }

        if (!reason.trim()) newErrors.reason = "Reason is required";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
      };

      const applyleaveRequest = async () => {
        try{

          setLoading(true);
          let token = await AsyncStorage.getItem("authToken");
           if (!token) {
             showToast("Authentication token not found");
             setLoading(false);
             return;
          }

          if (!validateLeaveForm()) {
            setLoading(false);
            return;
          }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        const startDate = selectedDays === 'Single' ? selectDate : fromDate;
        const startDateBreakDown = selectedDays === 'Single' ? selDayType : fromDateType;
        const endDate = selectedDays === 'Single' ? selectDate : toDate;
        const endDateBreakDown = selectedDays === 'Single' ? selDayType : toDateType;

        const raw = JSON.stringify({
          "approvedBy": null,
          "attachment": [],
          "branchId": userData?.branchId,
          "companyId": userData?.companyId,
          "directorId": null,
          "employeId": userData?._id,
          "endDate": moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          "leaveTypeId": leaveType,
          "reason": reason,
          "startDate": moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          ...(selectedDays === 'Single' ? {"subType": selDayType || "" }:
          {"endDateBreakDown": endDateBreakDown, "startDateBreakDown": startDateBreakDown}),
          "type": selectedDays,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        const response = await fetch(`${BASE_URL}/admin/employe/leaveRequest/create`, requestOptions);
        const result = await response.json();
        if (result.statusCode === 200) {
          setModalVisible(false);
          resetFormFields();

          leaveRequestData(userData);
          showToast(result.message || "Leave request submitted successfully");
          setLoading(false);
        } else if (isUnauthorized(result)) {
          await handleEmployeUnauthorized(navigation, logout);
          setLoading(false);
        } else {
          console.error("Leave Request Apply API Error:", result.message);
          showToast(result.message || "Failed to submit leave request");
          setLoading(false);
        }
        }catch(error){
          console.error("Failed to apply leave request:", error);
          showToast("Error submitting leave request: " + error.message);
          setLoading(false);
        }
      }
      const updateleaveRequest = async () => {
        try{

          setLoading(true);
          let token = await AsyncStorage.getItem("authToken");
           if (!token) {
             showToast("Authentication token not found");
             setLoading(false);
             return;
          }

          if (!validateLeaveForm()) {
            setLoading(false);
            return;
          }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        const startDate = selectedDays === 'Single' ? selectDate : fromDate;
        const startDateBreakDown = selectedDays === 'Single' ? selDayType : fromDateType;
        const endDate = selectedDays === 'Single' ? selectDate : toDate;
        const endDateBreakDown = selectedDays === 'Single' ? selDayType : toDateType;

        const raw = JSON.stringify({
          "_id": editingLeaveId,
          "approvedBy": null,
          "attachment": [],
          "branchId": userData?.branchId,
          "companyId": userData?.companyId,
          "directorId": null,
          "employeId": userData?._id,
          "endDate": moment(endDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          "leaveTypeId": leaveType,
          "reason": reason,
          "startDate": moment(startDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          ...(selectedDays === 'Single' ? {"subType": selDayType || "" }:
          {"endDateBreakDown": endDateBreakDown, "startDateBreakDown": startDateBreakDown}),
          "type": selectedDays,
        });
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        console.log("Update Leave Request Payload:", raw);
        const response = await fetch(`${BASE_URL}/admin/employe/leaveRequest/update`, requestOptions);
        const result = await response.json();
        if (result.statusCode === 200) {
          setModalVisible(false);
          resetFormFields();

          leaveRequestData(userData);
          showToast(result.message || "Leave request updated successfully");
          setLoading(false);
        } else if (isUnauthorized(result)) {
          await handleEmployeUnauthorized(navigation, logout);
          setLoading(false);
        } else {
          console.error("Leave Request Update API Error:", result.message);
          showToast(result.message || "Failed to update leave request");
          setLoading(false);
        }
        }catch(error){
          console.error("Failed to update leave request:", error);
          showToast("Error updating leave request: " + error.message);
          setLoading(false);
        }
      }

      const resetFormFields = () => {
        setSelectDate(null);
        setSelDayType(null);
        setFromDate(null);
        setFromDateType(null);
        setToDate(null);
        setToDateType(null);
        setLeaveType(null);
        setReason('');
        setSelectedDays('Single');
        setErrors({});
        setIsEditMode(false);
        setEditingLeaveId(null);
      };

      const openEditModal = (item) => {
        setEditingLeaveId(item._id);
        setIsEditMode(true);
        setReason(item.reason);
        setLeaveType(item.leaveTypeId);

        if (item.type === 'Single') {
          setSelectedDays('Single');
          setSelectDate(moment(item.startDate).format('DD/MM/YYYY'));
          setSelDayType(item.subType || 'fullDay');
        } else {
          setSelectedDays('Multiple');
          setFromDate(moment(item.startDate).format('DD/MM/YYYY'));
          setToDate(moment(item.endDate).format('DD/MM/YYYY'));
          setFromDateType(item.startDateBreakDown || 'fullDay');
          setToDateType(item.endDateBreakDown || 'fullDay');
        }

        setModalVisible(true);
      };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />

        <View style={styles.topBar}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <AntDesign name="arrowleft" size={22} color="#fff" />
           </TouchableOpacity>
           <View style={{ flex: 1, marginLeft: 12 }}>
             <Text style={styles.topTitle}>Leave Management</Text>
             <Text style={styles.topSubtitle}>Track & request your time off</Text>
           </View>
           <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerPlus}>
              <AntDesign name="plus" size={18} color="#fff" />
           </TouchableOpacity>
        </View>

        <View style={styles.mainContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >

                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Leave Balance</Text>
                    <Text style={styles.sectionSubtitle}>Your available leave types</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.applyButton}>
                    <AntDesign name="plus" size={14} color="#fff" />
                    <Text style={styles.applyButtonText}>Apply Leave</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4, paddingRight: 6 }}>
                  {
                    loadingLeaveList ? (
                      <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color="#6a8ff3" />
                      </View>
                    ) : (
                      leaveListData === null || leaveListData.length === 0 ? (
                        <View style={styles.emptyBoxSmall}>
                          <Feather name="inbox" size={22} color="#9aa0b4" />
                          <Text style={styles.emptyTextMuted}>No leave types available</Text>
                        </View>
                      ) : (
                        leaveListData.map((leave, index) => {
                          const total = leave.totalLeaves || 0;
                          const used = leave.usedLeaves || 0;
                          const available = leave.availableLeaves || 0;
                          const pctUsed = Math.min(100, Math.round((used / (total || 1)) * 100));
                          const palette = BALANCE_PALETTES[index % BALANCE_PALETTES.length];
                          return (
                            <View key={index} style={[styles.balanceCard, { borderTopColor: palette.accent }]}>
                              <View style={styles.balanceHeader}>
                                <View style={[styles.balanceIcon, { backgroundColor: palette.bg }]}>
                                  <Feather name="calendar" size={18} color={palette.accent} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <Text numberOfLines={1} style={styles.balanceType}>{leave.leaveTypeData?.name}</Text>
                                  <Text style={[styles.balancePaid, { color: palette.accent }]}>
                                    {leave.leaveTypeData?.isPaid === true ? 'Paid' : 'Unpaid'}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.balanceMain}>
                                <Text style={styles.balanceMainValue}>{available}</Text>
                                <Text style={styles.balanceMainLabel}>Available</Text>
                              </View>

                              <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${pctUsed}%`, backgroundColor: palette.accent }]} />
                              </View>

                              <View style={styles.balanceFoot}>
                                <View style={styles.balanceFootItem}>
                                  <Text style={styles.balanceFootLabel}>Used</Text>
                                  <Text style={styles.balanceFootValue}>{used}</Text>
                                </View>
                                <View style={styles.sep} />
                                <View style={[styles.balanceFootItem, { alignItems: 'flex-end' }]}>
                                  <Text style={styles.balanceFootLabel}>Total</Text>
                                  <Text style={styles.balanceFootValue}>{total}</Text>
                                </View>
                              </View>
                            </View>
                          );
                        })
                      )
                    )
                  }
                </ScrollView>

                <View style={[styles.sectionHead, { marginTop: 22 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>My Requests</Text>
                    <Text style={styles.sectionSubtitle}>
                      {loadingLeaveRequest ? 'Loading…' : `${combinedData.length} total`}
                    </Text>
                  </View>
                </View>

                {
                  loadingLeaveRequest ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#6a8ff3" />
                    </View>
                  ) : currentData.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <View style={styles.emptyImageWrap}>
                        <Image
                          source={require('../../../assets/Images/notFound.png')}
                          style={styles.emptyImage}
                        />
                      </View>
                      <Text style={styles.emptyTitle}>No Requests</Text>
                      <Text style={styles.emptySubtitle}>You haven't submitted any leave requests yet</Text>
                      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.emptyCta}>
                        <AntDesign name="plus" size={13} color="#6a8ff3" />
                        <Text style={styles.emptyCtaText}>Create one</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ gap: 12, marginTop: 4 }}>
                      {currentData.map((item, index) => {
                        const statusInfo = getStatusInfo(item.status);
                        const fromType = item.type === 'Single' ? item.subType : item.startDateBreakDown;
                        const toType = item.type === 'Single' ? item.subType : item.endDateBreakDown;
                        return (
                          <View key={item._id?.toString() || index} style={styles.requestCard}>
                            <View style={styles.requestHead}>
                              <View style={styles.typeBadge}>
                                <Feather name="briefcase" size={11} color="#6a8ff3" />
                                <Text style={styles.typeBadgeText} numberOfLines={1}>
                                  {item.leaveTypeData?.name || 'Leave'}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                  {statusInfo.label}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.datesRow}>
                              <View style={styles.dateBlock}>
                                <Text style={styles.dateLabel}>From</Text>
                                <Text style={styles.dateValue}>
                                  {moment(item.startDate).format('DD MMM YYYY')}
                                </Text>
                                {!!fromType && (
                                  <Text style={styles.dateSub}>{formatDayType(fromType)}</Text>
                                )}
                              </View>
                              <View style={styles.arrowBox}>
                                <AntDesign name="arrowright" size={14} color="#9aa0b4" />
                              </View>
                              <View style={styles.dateBlock}>
                                <Text style={styles.dateLabel}>To</Text>
                                <Text style={styles.dateValue}>
                                  {moment(item.endDate).format('DD MMM YYYY')}
                                </Text>
                                {!!toType && (
                                  <Text style={styles.dateSub}>{formatDayType(toType)}</Text>
                                )}
                              </View>
                              <View style={styles.daysPill}>
                                <Text style={styles.daysPillValue}>{item.requestDays}</Text>
                                <Text style={styles.daysPillLabel}>Days</Text>
                              </View>
                            </View>

                            <View style={styles.reasonRow}>
                              <Feather name="message-circle" size={12} color="#7c84a3" style={{ marginTop: 2 }} />
                              <Text style={styles.reasonText} numberOfLines={3}>{item.reason}</Text>
                            </View>

                            {!!item.remark && (
                              <View style={styles.remarkRow}>
                                <Feather name="flag" size={12} color="#e94e4e" style={{ marginTop: 2 }} />
                                <Text style={styles.remarkText} numberOfLines={3}>
                                  <Text style={{ fontFamily: 'Lato-SemiBold' }}>Remark: </Text>
                                  {item.remark}
                                </Text>
                              </View>
                            )}

                            <View style={styles.requestFoot}>
                              <View style={styles.metaRow}>
                                <Feather name="clock" size={11} color="#9aa0b4" />
                                <Text style={styles.metaText} numberOfLines={1}>
                                  {moment(item.updatedAt).format('DD MMM YYYY · hh:mm A')}
                                </Text>
                              </View>
                              {item.status === 'Pending' ? (
                                <TouchableOpacity activeOpacity={0.8} onPress={() => openEditModal(item)} style={styles.editBtn}>
                                  <Feather name="edit-2" size={12} color="#6a8ff3" />
                                  <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.lockedBtn}>
                                  <Feather name="lock" size={11} color="#9aa0b4" />
                                  <Text style={styles.lockedBtnText}>Locked</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}

                      {isLoadingMore && (
                        <View style={styles.loadMoreRow}>
                          <ActivityIndicator size="small" color="#6a8ff3" />
                          <Text style={styles.loadMoreText}>Loading more…</Text>
                        </View>
                      )}

                      {!isLoadingMore && !hasMoreData && combinedData.length > PAGE_SIZE && (
                        <View style={styles.endOfListRow}>
                          <View style={styles.endOfListDivider} />
                          <Text style={styles.endOfListText}>You're all caught up</Text>
                          <View style={styles.endOfListDivider} />
                        </View>
                      )}
                    </View>
                  )
                }
            </ScrollView>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
            resetFormFields();
          }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {isEditMode ? 'Edit Leave Request' : 'Apply Leave'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {isEditMode ? 'Update your request details' : 'Fill out the details below'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setModalVisible(false); resetFormFields(); }}
                  style={styles.modalClose}>
                  <AntDesign name="close" size={16} color="#1f2440" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.62 }}>
                {!isEditMode && leaveListData.length > 0 && (
                  <>
                    <Text style={styles.formSectionLabel}>Available Balance</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {leaveListData.map((leave, index) => (
                          <View key={index} style={styles.balancePill}>
                            <View style={styles.balancePillDot} />
                            <Text style={styles.balancePillText}>
                              {leave.leaveTypeData.name}: <Text style={{ fontFamily: 'Lato-SemiBold' }}>{leave.availableLeaves}</Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                <Text style={styles.formLabel}>Duration</Text>
                <View style={{ marginBottom: 12 }}>
                  <SelectList
                    setSelected={(val) => {
                      setSelectedDays(val);
                      setErrors(prev => ({ ...prev, selectedDays: null }));
                    }}
                    data={['Single', 'Multiple']}
                    save="value"
                    placeholder='Select duration'
                    boxStyles={styles.selectBox}
                    inputStyles={styles.selectInput}
                    dropdownStyles={styles.selectDropdown}
                    dropdownTextStyles={styles.selectInput}
                  />
                  {errors.selectedDays && (
                    <Text style={styles.errorText}>{errors.selectedDays}</Text>
                  )}
                </View>

                <Text style={styles.formLabel}>Leave Type</Text>
                <View style={{ marginBottom: 14 }}>
                  <SelectList
                    setSelected={(val) => {
                      setLeaveType(val);
                      setErrors(prev => ({ ...prev, leaveType: null }));
                    }}
                    data={leaveTypeOptions}
                    save="key"
                    placeholder='Select leave type'
                    boxStyles={styles.selectBox}
                    inputStyles={styles.selectInput}
                    dropdownStyles={styles.selectDropdown}
                    dropdownTextStyles={styles.selectInput}
                  />
                  {errors.leaveType && (
                    <Text style={styles.errorText}>{errors.leaveType}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  {
                    selectedDays === 'Single' ? (
                      <View>
                        <Text style={styles.formLabel}>Select Date</Text>
                        <TouchableOpacity onPress={() => setSelectedDateVisible(true)} style={styles.dateInput}>
                          <Feather name="calendar" size={16} color="#6a8ff3" />
                          <Text style={[styles.dateInputText, selectDate ? { color: '#1f2440' } : null]}>
                            {selectDate ? selectDate : 'Pick a date'}
                          </Text>
                          <AntDesign name="down" size={12} color="#9aa0b4" />
                        </TouchableOpacity>
                        <DateTimePickerModal
                          isVisible={selectedDateVisible}
                          mode="date"
                          onConfirm={(date) => {
                            const formattedDate = moment(date).format('DD/MM/YYYY');
                            const today = moment().format('DD/MM/YYYY');
                            const currentTime = moment();
                            const cutoffTime = moment('14:00', 'HH:mm');
                            if (formattedDate === today && currentTime.isAfter(cutoffTime)) {
                              setIsFirstHalfDisabled(true);
                              if (selDayType === 'firstHalf') {
                                setSelDayType(null);
                                showToast("First Half is not available for today");
                              }
                            } else {
                              setIsFirstHalfDisabled(false);
                            }
                            setSelectDate(formattedDate);
                            setErrors(prev => ({ ...prev, selectDate: null }));
                            setSelectedDateVisible(false);
                          }}
                          onCancel={() => setSelectedDateVisible(false)}
                          minimumDate={new Date()}
                          is24Hour={false}
                        />
                        {errors.selectDate && (
                          <Text style={styles.errorText}>{errors.selectDate}</Text>
                        )}

                        <Text style={[styles.formLabel, { marginTop: 14 }]}>Day Type</Text>
                        <SelectList
                          setSelected={(val) => {
                            setSelDayType(val);
                            setErrors(prev => ({ ...prev, selDayType: null }));
                          }}
                          data={isFirstHalfDisabled ? ['secondHalf', 'fullDay'] : ['firstHalf', 'secondHalf', 'fullDay']}
                          save="value"
                          placeholder='Select day type'
                          boxStyles={styles.selectBox}
                          inputStyles={styles.selectInput}
                          dropdownStyles={styles.selectDropdown}
                          dropdownTextStyles={styles.selectInput}
                        />
                        {errors.selDayType && (
                          <Text style={styles.errorText}>{errors.selDayType}</Text>
                        )}
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.formLabel}>From Date</Text>
                        <TouchableOpacity onPress={() => setFromDateVisible(true)} style={styles.dateInput}>
                          <Feather name="calendar" size={16} color="#6a8ff3" />
                          <Text style={[styles.dateInputText, fromDate ? { color: '#1f2440' } : null]}>
                            {fromDate ? fromDate : 'Pick start date'}
                          </Text>
                          <AntDesign name="down" size={12} color="#9aa0b4" />
                        </TouchableOpacity>
                        <DateTimePickerModal
                          isVisible={fromDateVisible}
                          mode="date"
                          onConfirm={(date) => {
                            const formattedDate = moment(date).format('DD/MM/YYYY');
                            setFromDate(formattedDate);
                            setFromDateVisible(false);
                            setErrors(prev => ({ ...prev, fromDate: null }));
                          }}
                          onCancel={() => setFromDateVisible(false)}
                          minimumDate={new Date()}
                          is24Hour={false}
                        />
                        {errors.fromDate && (
                          <Text style={styles.errorText}>{errors.fromDate}</Text>
                        )}

                        <Text style={[styles.formLabel, { marginTop: 14 }]}>From Day Type</Text>
                        <SelectList
                          setSelected={(val) => {
                            setFromDateType(val);
                            setErrors(prev => ({ ...prev, fromDateType: null }));
                          }}
                          data={multipleLeaveDefaultDayTypes}
                          save="value"
                          placeholder='Select day type'
                          boxStyles={styles.selectBox}
                          inputStyles={styles.selectInput}
                          dropdownStyles={styles.selectDropdown}
                          dropdownTextStyles={styles.selectInput}
                        />
                        {errors.fromDateType && (
                          <Text style={styles.errorText}>{errors.fromDateType}</Text>
                        )}

                        <Text style={[styles.formLabel, { marginTop: 14 }]}>To Date</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (!fromDate) {
                              showToast("Please select From Date first");
                              return;
                            }
                            setToDateVisible(true);
                          }}
                          style={styles.dateInput}>
                          <Feather name="calendar" size={16} color="#6a8ff3" />
                          <Text style={[styles.dateInputText, toDate ? { color: '#1f2440' } : null]}>
                            {toDate ? toDate : 'Pick end date'}
                          </Text>
                          <AntDesign name="down" size={12} color="#9aa0b4" />
                        </TouchableOpacity>
                        <DateTimePickerModal
                          isVisible={toDateVisible}
                          mode="date"
                          onConfirm={(date) => {
                            const formattedToDate = moment(date).format('DD/MM/YYYY');
                            const fromDateMoment = moment(fromDate, 'DD/MM/YYYY');
                            const toDateMoment = moment(formattedToDate, 'DD/MM/YYYY');

                            if (toDateMoment.isSameOrBefore(fromDateMoment, 'day')) {
                              showToast("To Date must be after From Date");
                              return;
                            }

                            setToDate(formattedToDate);
                            setErrors(prev => ({ ...prev, toDate: null }));
                            setToDateVisible(false);
                          }}
                          onCancel={() => setToDateVisible(false)}
                          minimumDate={fromDate ? moment(fromDate, 'DD/MM/YYYY').add(1, 'day').toDate() : new Date()}
                          is24Hour={false}
                        />
                        {errors.toDate && (
                          <Text style={styles.errorText}>{errors.toDate}</Text>
                        )}

                        <Text style={[styles.formLabel, { marginTop: 14 }]}>To Day Type</Text>
                        <SelectList
                          setSelected={(val) => {
                            setToDateType(val);
                            setErrors(prev => ({ ...prev, toDateType: null }));
                          }}
                          data={multipleLeaveDefaultDayTypes}
                          save="value"
                          placeholder='Select day type'
                          boxStyles={styles.selectBox}
                          inputStyles={styles.selectInput}
                          dropdownStyles={styles.selectDropdown}
                          dropdownTextStyles={styles.selectInput}
                        />
                        {errors.toDateType && (
                          <Text style={styles.errorText}>{errors.toDateType}</Text>
                        )}
                      </View>
                    )
                  }
                </View>

                <Text style={styles.formLabel}>Reason</Text>
                <View style={styles.textAreaWrap}>
                  <TextInput
                    value={reason}
                    onChangeText={(value) => {
                      setReason(value);
                      setErrors(prev => ({ ...prev, reason: null }));
                    }}
                    placeholder="Briefly describe the reason for leave…"
                    placeholderTextColor="#9aa0b4"
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                  />
                </View>
                {errors.reason && (
                  <Text style={styles.errorText}>{errors.reason}</Text>
                )}

                <View style={{ height: 10 }} />
              </ScrollView>

              <View style={styles.modalFoot}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(!modalVisible);
                    resetFormFields();
                  }}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isEditMode ? updateleaveRequest : applyleaveRequest}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <AntDesign name="check" size={14} color="#fff" />
                      <Text style={styles.submitBtnText}>
                        {isEditMode ? 'Update' : 'Submit'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  topSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    marginTop: 2,
  },
  headerPlus: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 2,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6a8ff3',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    // shadowColor: '#6a8ff3',
    // shadowOpacity: 0.3,
    // shadowOffset: { width: 0, height: 4 },
    // shadowRadius: 8,
    // elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  balanceCard: {
    width: 210,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderTopWidth: 3,
    borderTopColor: '#6a8ff3',
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: '#1f2440',
    // shadowOpacity: 0.05,
    // shadowOffset: { width: 0, height: 4 },
    // shadowRadius: 10,
    // elevation: 1,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceType: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
  },
  balancePaid: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceMain: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceMainValue: {
    fontSize: 26,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    lineHeight: 30,
  },
  balanceMainLabel: {
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f4fb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  balanceFoot: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  balanceFootItem: {
    flex: 1,
  },
  balanceFootLabel: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    color: '#9aa0b4',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balanceFootValue: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    marginTop: 2,
  },
  sep: {
    width: 1,
    height: 26,
    backgroundColor: '#eef0fa',
    marginHorizontal: 6,
  },
  loaderBox: {
    height: 160,
    width: Dimensions.get('window').width - 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBoxSmall: {
    height: 140,
    width: Dimensions.get('window').width - 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTextMuted: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#9aa0b4',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyImageWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#dbe1f5',
  },
  emptyCtaText: {
    color: '#6a8ff3',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: '#1f2440',
    // shadowOpacity: 0.04,
    // shadowOffset: { width: 0, height: 3 },
    // shadowRadius: 8,
    // elevation: 1,
  },
  requestHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: '58%',
  },
  typeBadgeText: {
    color: '#6a8ff3',
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eef0fa',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    color: '#9aa0b4',
    fontFamily: 'Lato-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 12,
    color: '#1f2440',
    fontFamily: 'Lato-SemiBold',
    marginTop: 3,
  },
  dateSub: {
    fontSize: 10,
    color: '#7c84a3',
    fontFamily: 'Lato-Medium',
    marginTop: 2,
  },
  arrowBox: {
    paddingHorizontal: 6,
  },
  daysPill: {
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 54,
  },
  daysPillValue: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#6a8ff3',
    lineHeight: 16,
  },
  daysPillLabel: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    color: '#6a8ff3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#3a4a7a',
    lineHeight: 18,
  },
  remarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fdecec40',
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#e94e4e',
  },
  remarkText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#8a3a3a',
    lineHeight: 18,
  },
  requestFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f4fb',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#9aa0b4',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  editBtnText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: '#6a8ff3',
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f4fb',
  },
  lockedBtnText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#9aa0b4',
  },
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadMoreText: {
    color: '#6a8ff3',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  endOfListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  endOfListDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#eef0fa',
  },
  endOfListText: {
    color: '#9aa0b4',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000070',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: '92%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0fa',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f4fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSectionLabel: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: '#7c84a3',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    marginBottom: 6,
  },
  formGroup: {
    backgroundColor: '#fafbff',
    borderWidth: 1,
    borderColor: '#eef0fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  balancePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6a8ff3',
  },
  balancePillText: {
    color: '#3a4a7a',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
  },
  selectBox: {
    borderRadius: 10,
    borderColor: '#dbe1f5',
    backgroundColor: '#fff',
    height: 46,
    alignItems: 'center',
  },
  selectInput: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#1f2440',
  },
  selectDropdown: {
    borderRadius: 10,
    borderColor: '#dbe1f5',
    backgroundColor: '#fff',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe1f5',
    backgroundColor: '#fff',
  },
  dateInputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#9aa0b4',
  },
  textAreaWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe1f5',
    backgroundColor: '#fff',
    padding: 10,
    minHeight: 90,
  },
  textArea: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#1f2440',
    minHeight: 70,
    padding: 0,
  },
  errorText: {
    color: '#e94e4e',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    marginTop: 4,
  },
  modalFoot: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eef0fa',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f1f4fb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef0fa',
  },
  cancelBtnText: {
    color: '#3a4a7a',
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
  },
  submitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#6a8ff3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6a8ff3',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
  },
});
