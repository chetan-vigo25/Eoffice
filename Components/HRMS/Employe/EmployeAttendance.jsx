import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Pressable,
} from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import BASE_URL from '../../../Urls/DomainUrl';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

const PRIMARY = '#6a8ff3';
const PRIMARY_DARK = '#4c72d9';
const PRIMARY_TINT = '#eef2ff';
const TEXT_DARK = '#1f2440';
const TEXT_MUTED = '#7c84a3';
const BORDER = '#e6eaf5';

const STATUS_COLORS = {
  present: '#4CAF50',
  firstHalf: '#FFB020',
  secondHalf: '#9C27B0',
  absent: '#F54927',
  off: '#808080',
  leave: PRIMARY,
  holiday: '#00B8A9',
};

const STATUS_LABELS = {
  present: 'Present',
  firstHalf: 'First Half',
  secondHalf: 'Second Half',
  absent: 'Absent',
  off: 'Off',
  leave: 'Leave',
  holiday: 'Holiday',
};

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) setTimeout(onOk, 2000);
  } else {
    Alert.alert('', message, [{ text: 'OK', onPress: () => { if (onOk); } }], { cancelable: false });
  }
}

export default function EmployeAttendance({ navigation }) {
  const { logout } = useContext(UserContext);
  const insets = useSafeAreaInsets();
  const [startDateVisible, setStartDateVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDateVisible, setEndDateVisible] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [selectLeave, setSelectLeave] = useState('');
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [isCheckoutPickerVisible, setCheckoutDatePickerVisibility] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [shift, setShift] = useState('');
  const [shiftOptions, setShiftOptions] = useState([]);
  const [shiftMap, setShiftMap] = useState({});
  const [reason, setReason] = useState('');
  const [manualRecords, setManualRecords] = useState([]);
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);

  const rowsPerPage = 10;

  const leaveTypeMap = {
    Present: 'present',
    'First Half': 'firstHalf',
    'Second Half': 'secondHalf',
    Leave: 'leave',
    Absent: 'absent',
    OFF: 'off',
    Holiday: 'holiday',
  };

  const addType = Object.keys(leaveTypeMap);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          await attendanceList(parsedData);
        }
      } catch (err) {
        console.error('Failed to load userData:', err);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) shiftList();
  }, [userData]);

  const attendanceList = async (userDataParam) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication failed');
        setLoading(false);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      let allData = [];
      let currentPage = 1;
      let hasNextPage = true;
      const limit = 50;

      while (hasNextPage) {
        const raw = JSON.stringify({
          branchId: userDataParam?.branchId,
          companyId: userDataParam?.companyId,
          employeId: userDataParam?._id,
          endDate: null,
          isPagination: true,
          isPresentDay: [],
          page: currentPage,
          limit,
          shift: '',
          sort: true,
          startDate: null,
          status: '',
          text: '',
          workType: '',
        });

        const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
        const response = await fetch(
          `${BASE_URL}/admin/employe/attendance/list?page=${currentPage}&limit=${limit}`,
          requestOptions
        );
        const result = await response.json();

        if (result.statusCode === 200) {
          const pageData = result.data.docs || result.data || []; 
          if (pageData.length === 0) {
            hasNextPage = false;
          } else {
            allData = [...allData, ...pageData];
            if (result.data?.totalPages !== undefined && result.data.totalPages !== null) {
              hasNextPage = currentPage < result.data.totalPages;
            } else if (result.data?.hasNextPage !== undefined && result.data.hasNextPage !== null) {
              hasNextPage = result.data.hasNextPage === true;
            } else {
              hasNextPage = pageData.length >= limit;
            }
            currentPage++;
            if (currentPage > 1000) hasNextPage = false;
          }
        } else if (isUnauthorized(result)) {
          await handleEmployeUnauthorized(navigation, logout);
          hasNextPage = false;
          break;
        } else {
          if (currentPage === 1) {
            const rawAll = JSON.stringify({
              branchId: userDataParam?.branchId,
              companyId: userDataParam?.companyId,
              employeId: userDataParam?._id,
              endDate: null,
              isPagination: false,
              isPresentDay: [],
              shift: '',
              sort: true,
              startDate: null,
              status: '',
              text: '',
              workType: '',
            });

            const requestOptionsAll = { method: 'POST', headers: myHeaders, body: rawAll, redirect: 'follow' };
            const responseAll = await fetch(`${BASE_URL}/admin/employe/attendance/list`, requestOptionsAll);
            const resultAll = await responseAll.json();
            if (resultAll.statusCode === 200) {
              allData = resultAll.data.docs || resultAll.data || [];
            } else if (isUnauthorized(resultAll)) {
              await handleEmployeUnauthorized(navigation, logout);
            } else {
              showToast(resultAll.message || 'Failed to fetch attendance');
            }
          }
          hasNextPage = false;
        }
      }

      // Dedupe by _id
      const uniqueAllData = allData.filter(
        (item, index, self) => self.findIndex((i) => i._id === item._id) === index
      );

      // Filter to only show the logged-in user's attendance.
      // The /admin endpoint returns all employees' records even when employeId is sent in the body,
      // so we filter client-side against the logged-in user's _id.
      const myEmployeId = userDataParam?._id;
      const myAttendance = myEmployeId
        ? uniqueAllData.filter((item) => {
            const itemEmployeId =
              item?.employeId ||
              item?.employeData?._id ||
              item?.employeData?.employeId;
            return String(itemEmployeId) === String(myEmployeId);
          })
        : [];

      setAllAttendanceData(myAttendance);
      filterAttendanceData(myAttendance, startDate, endDate, selectLeave);
    } catch (err) {
      console.error('Network Error:', err);
      showToast('Network request failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendanceData = (data, start, end, leaveType) => {
    if (!start && !end && !leaveType) {
      setAttendanceData(data);
      return;
    }
    const filtered = data.filter((item) => {
      const itemMoment = moment(item.attendanceDate);
      const itemStatus = item.isPresentDay?.toLowerCase()?.trim();
      const selectedStatus = leaveTypeMap[leaveType]?.toLowerCase()?.trim();

      let dateMatch = true;
      if (start) {
        const startMoment = moment(start, 'DD/MM/YYYY');
        if (end) {
          const endMoment = moment(end, 'DD/MM/YYYY');
          dateMatch = itemMoment.isBetween(startMoment, endMoment, 'day', '[]');
        } else {
          dateMatch = itemMoment.isSame(startMoment, 'day');
        }
      }
      let leaveTypeMatch = true;
      if (leaveType) leaveTypeMatch = itemStatus === selectedStatus;
      return dateMatch && leaveTypeMatch;
    });

    const uniqueFiltered = filtered.filter(
      (item, index, self) => self.findIndex((i) => i._id === item._id) === index
    );
    setAttendanceData(uniqueFiltered);
    setPage(0);
  };

  useEffect(() => {
    if (userData && (startDate || endDate || selectLeave)) {
      filterAttendanceData(allAttendanceData, startDate, endDate, selectLeave);
    }
  }, [startDate, endDate, selectLeave]);

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectLeave('');
    filterAttendanceData(allAttendanceData, null, null, '');
    showToast('Filters cleared');
  };

  const combinedData = [...manualRecords, ...attendanceData];
  const totalPages = Math.max(1, Math.ceil(combinedData.length / rowsPerPage));
  const currentData = combinedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const headers = [
    'S.No',
    'Date',
    'Check-In',
    'Check-Out',
    'Worked',
    'Pending',
    'Overtime',
    'WFH',
    'Status',
    'Verified',
  ];

  const handleCheckInConfirm = (date) => {
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    setCheckInDate(formattedDate);
    setCheckInTime(formattedTime);
    setDatePickerVisibility(false);
  };

  const handleCheckOutConfirm = (date) => {
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    setCheckOutDate(formattedDate);
    setCheckOutTime(formattedTime);
    setCheckoutDatePickerVisibility(false);
  };

  const resetManualForm = () => {
    setCheckInDate(null);
    setCheckInTime(null);
    setCheckOutDate(null);
    setCheckOutTime(null);
    setReason('');
    setShift('');
  };

  const handleManualConfirm = async () => {
    if (!checkInDate || !checkInTime) {
      Alert.alert('Validation Error', 'Please pick a date and time for manual check-in.');
      return;
    }
    if (!reason || reason.trim() === '') {
      Alert.alert('Validation Error', 'Please provide a reason for manual attendance.');
      return;
    }
    if (!shift) {
      Alert.alert('Validation Error', 'Please select a shift.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication failed');
        setSubmitting(false);
        return;
      }

      const checkInMoment = moment(`${checkInDate} ${checkInTime}`, 'DD MMM YYYY hh:mm:ss A');
      const checkOutMoment =
        checkOutTime && checkOutDate
          ? moment(`${checkOutDate} ${checkOutTime}`, 'DD MMM YYYY hh:mm:ss A')
          : null;

      if (!checkInMoment.isValid()) {
        Alert.alert('Error', 'Invalid check-in date/time format');
        setSubmitting(false);
        return;
      }
      if (checkOutMoment && !checkOutMoment.isValid()) {
        Alert.alert('Error', 'Invalid check-out date/time format');
        setSubmitting(false);
        return;
      }
      if (checkOutMoment && checkOutMoment.isBefore(checkInMoment)) {
        Alert.alert('Error', 'Check-out time must be after check-in time');
        setSubmitting(false);
        return;
      }

      const checkInDateTime = checkInMoment.toISOString();
      const checkOutDateTime = checkOutMoment ? checkOutMoment.toISOString() : null;
      const attendanceDate = checkInMoment.format('YYYY-MM-DD');

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        attendanceDate,
        branchId: userData?.branchId,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        companyId: userData?.companyId,
        directorId: null,
        employeId: userData?._id,
        employeeName: userData?.fullName,
        method: 'employeReq',
        reason,
        shift,
      });

      const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
      const response = await fetch(`${BASE_URL}/admin/employe/attendance/create`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200 || response.ok) {
        setAttendanceModal(false);
        resetManualForm();
        showToast(result.message || 'Attendance added successfully');
        await attendanceList(userData);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        Alert.alert('Error', result.message || 'Failed to add attendance');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const shiftList = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        branchId: userData?.branchId,
        companyId: userData?.companyId,
        isActive: true,
        isPagination: true,
        text: '',
      });

      const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
      const response = await fetch(`${BASE_URL}/admin/master/others/timeslot/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        const shifts = result.data.docs;
        const options = shifts.map((s) => ({ key: s._id, value: s.shiftName }));
        setShiftOptions(options);
        const mapping = shifts.reduce((acc, s) => {
          acc[s.shiftName] = s._id;
          return acc;
        }, {});
        setShiftMap(mapping);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      }
    } catch (err) {
      // swallow
    }
  };

  const selectListBox = {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  };
  const selectListDropdown = {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 4,
  };
  const selectListInput = { color: TEXT_DARK, fontSize: 13, fontFamily: 'Lato-SemiBold' };

  const summary = React.useMemo(() => {
    const base = { present: 0, firstHalf: 0, secondHalf: 0, absent: 0, leave: 0, off: 0, holiday: 0 };
    attendanceData.forEach((item) => {
      const k = item.isPresentDay;
      if (k && base[k] !== undefined) base[k] += 1;
    });
    return base;
  }, [attendanceData]);

  const renderStatusPill = (status) => {
    const color = STATUS_COLORS[status] || '#999';
    const label = STATUS_LABELS[status] || '-';
    return (
      <View style={[styles.statusPill, { backgroundColor: `${color}18`, borderColor: color }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusPillText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
     
          {/* Filters */}
          <Text style={styles.sectionLabel}>Filters</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setStartDateVisible(true)}
              style={styles.dateField}
              activeOpacity={0.8}
            >
              <Feather name="calendar" size={14} color={TEXT_MUTED} />
              <Text style={[styles.dateFieldText, !startDate && { color: TEXT_MUTED }]} numberOfLines={1}>
                {startDate ? startDate : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEndDateVisible(true)}
              style={styles.dateField}
              activeOpacity={0.8}
            >
              <Feather name="calendar" size={14} color={TEXT_MUTED} />
              <Text style={[styles.dateFieldText, !endDate && { color: TEXT_MUTED }]} numberOfLines={1}>
                {endDate ? endDate : 'End Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResetFilters} style={styles.resetBtn} activeOpacity={0.85}>
              <Feather name="refresh-ccw" size={12} color="#fff" />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <DateTimePickerModal
            isVisible={startDateVisible}
            mode="date"
            onConfirm={(date) => {
              setStartDate(moment(date).format('DD/MM/YYYY'));
              setStartDateVisible(false);
            }}
            onCancel={() => setStartDateVisible(false)}
            is24Hour={false}
          />
          <DateTimePickerModal
            isVisible={endDateVisible}
            mode="date"
            onConfirm={(date) => {
              setEndDate(moment(date).format('DD/MM/YYYY'));
              setEndDateVisible(false);
            }}
            onCancel={() => setEndDateVisible(false)}
            is24Hour={false}
          />

          <View style={{ marginTop: 10 }}>
            <SelectList
              setSelected={(val) => setSelectLeave(val)}
              data={addType}
              save="value"
              placeholder="Select Status Type"
              search={false}
              boxStyles={selectListBox}
              dropdownStyles={selectListDropdown}
              inputStyles={selectListInput}
              dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
              arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
            />
          </View>

          {/* Table / Empty / Loading */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading your attendance…</Text>
            </View>
          ) : currentData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={{ width: 96, height: 96 }}>
                <Image
                  source={require('../../../assets/Images/notFound.png')}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>
              <Text style={styles.emptyTitle}>Oops !</Text>
              <Text style={styles.emptySubtitle}>Records not found</Text>
            </View>
          ) : (
            <View style={styles.tableCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.row}>
                    {headers.map((header, index) => (
                      <Text key={index} style={[styles.cell, styles.headerCell]}>
                        {header}
                      </Text>
                    ))}
                  </View>
                  <FlatList
                    data={currentData}
                    keyExtractor={(item, index) => `${item._id}-${index}`}
                    renderItem={({ item, index }) => {
                      const worked =
                        item?.checkInTime && item?.checkOutTime
                          ? moment
                              .utc(moment(item.checkOutTime).diff(moment(item.checkInTime)))
                              .format('HH:mm:ss')
                          : '-';
                      const pending =
                        !item.pendingHRS || item.pendingHRS === 0
                          ? '-'
                          : `${Math.floor(item.pendingHRS / 60)}:${(item.pendingHRS % 60)
                              .toString()
                              .padStart(2, '0')}`;
                        const workeddd = Number(item.workedHRS || 0);
                        const min = Number(item.minHRS || 0);
                        const overtimeMinutes = workeddd > min ? workeddd - min : 0;
                        const overtime =
                        overtimeMinutes <= 0
                          ? '-'
                          : `${Math.floor(overtimeMinutes / 60)}:${(overtimeMinutes % 60)
                              .toString()
                               .padStart(2, '0')}`;
                      return (
                        <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                          <Text style={styles.cell}>{page * rowsPerPage + index + 1}</Text>
                          <Text style={styles.cell}>
                            {moment(item.attendanceDate).format('DD-MM-YYYY')}
                          </Text>
                          <Text style={styles.cell}>
                            {item?.checkInTime ? moment(item.checkInTime).format('hh:mm A') : '-'}
                          </Text>
                          <Text style={styles.cell}>
                            {item?.checkOutTime ? moment(item.checkOutTime).format('hh:mm A') : '-'}
                          </Text>
                          <Text style={styles.cell}>{worked}</Text>
                          <Text style={styles.cell}>{pending}</Text>
                          <Text style={styles.cell}>{overtime}</Text>
                          <View style={[styles.cell, { justifyContent: 'center', alignItems: 'center' }]}>
                            <View
                              style={[
                                styles.wfhChip,
                                {
                                  backgroundColor:
                                    item.workType === 'work_from_office' ? '#f1f3fb' : '#e6f7ee',
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color:
                                    item.workType === 'work_from_office' ? TEXT_MUTED : '#2e7d32',
                                  fontSize: 11,
                                  fontFamily: 'Lato-SemiBold',
                                }}
                              >
                                {item.workType === 'work_from_office' ? 'Office' : 'WFH'}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.cell, { justifyContent: 'center', alignItems: 'center' }]}>
                            {renderStatusPill(item.isPresentDay)}
                          </View>
                          <View style={[styles.cell, { justifyContent: 'center', alignItems: 'center' }]}>
                            <View style={styles.verifiedChip}>
                              <Ionicons
                                name={item.status === false ? 'close-circle' : 'checkmark-circle'}
                                size={14}
                                color={item.status === false ? '#F54927' : '#4CAF50'}
                              />
                              <Text
                                style={{
                                  marginLeft: 4,
                                  fontSize: 11,
                                  fontFamily: 'Lato-SemiBold',
                                  color: item.status === false ? '#F54927' : '#4CAF50',
                                }}
                              >
                                {item.status === false ? 'No' : 'Yes'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
                </View>
              </ScrollView>

              {/* Pagination */}
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage((prev) => Math.max(prev - 1, 0))}
                  style={[styles.pageButton, page === 0 && styles.disabledButton]}
                  disabled={page === 0}
                >
                  <AntDesign name="left" size={12} color="#fff" />
                  <Text style={styles.pageText}>Prev</Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  Page {page + 1} of {totalPages}
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  style={[styles.pageButton, page >= totalPages - 1 && styles.disabledButton]}
                  disabled={page >= totalPages - 1}
                >
                  <Text style={styles.pageText}>Next</Text>
                  <AntDesign name="right" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <Pressable
          onPress={() => setAttendanceModal(true)}
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        >
          <AntDesign name="plus" size={14} color="#fff" />
          <Text style={styles.ctaBtnText}>Manual Attendance</Text>
        </Pressable>
      </View>

      {/* Manual Attendance Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={attendanceModal}
        onRequestClose={() => setAttendanceModal(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.formCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Manual Attendance</Text>
                <TouchableOpacity
                  onPress={() => { setAttendanceModal(false); resetManualForm(); }}
                  style={styles.modalClose}
                >
                  <AntDesign name="close" size={16} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Check-In Date &amp; Time</Text>
              <TouchableOpacity
                onPress={() => setDatePickerVisibility(true)}
                style={styles.dateInput}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !checkInDate && { color: TEXT_MUTED },
                  ]}
                  numberOfLines={1}
                >
                  {checkInDate
                    ? `${checkInDate}${checkInTime ? ` · ${checkInTime}` : ''}`
                    : 'Select Check-In Date & Time'}
                </Text>
                <Feather name="calendar" size={16} color={PRIMARY_DARK} />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={handleCheckInConfirm}
                onCancel={() => setDatePickerVisibility(false)}
                is24Hour={false}
                minimumDate={new Date()}
              />

              <Text style={styles.formLabel}>Check-Out Date &amp; Time</Text>
              <TouchableOpacity
                onPress={() => setCheckoutDatePickerVisibility(true)}
                style={styles.dateInput}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !checkOutDate && { color: TEXT_MUTED },
                  ]}
                  numberOfLines={1}
                >
                  {checkOutDate
                    ? `${checkOutDate}${checkOutTime ? ` · ${checkOutTime}` : ''}`
                    : 'Select Check-Out Date & Time (optional)'}
                </Text>
                <Feather name="calendar" size={16} color={PRIMARY_DARK} />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isCheckoutPickerVisible}
                mode="datetime"
                onConfirm={handleCheckOutConfirm}
                onCancel={() => setCheckoutDatePickerVisibility(false)}
                is24Hour={false}
                minimumDate={new Date()}
              />

              <Text style={styles.formLabel}>Reason</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Why do you need manual attendance?"
                placeholderTextColor="#a0a6bd"
                style={styles.textInput}
              />

              <Text style={styles.formLabel}>Shift</Text>
              <SelectList
                setSelected={(val) => setShift(shiftMap[val])}
                data={shiftOptions}
                save="value"
                placeholder="Select Shift"
                search={false}
                boxStyles={selectListBox}
                dropdownStyles={selectListDropdown}
                inputStyles={selectListInput}
                dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
                arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => { setAttendanceModal(false); resetManualForm(); }}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Pressable
                  disabled={submitting}
                  onPress={handleManualConfirm}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    submitting && { backgroundColor: '#b8c5ee' },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryChip({ label, value, color, icon }) {
  return (
    <View style={[styles.summaryChip, { borderColor: `${color}40` }]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
      </View>
      <View>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  sectionLabel: {
    color: TEXT_DARK,
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    paddingTop: 14,
    paddingBottom: 8,
  },

  /* Summary chips */
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 110,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    color: TEXT_DARK,
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },
  summaryLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    marginTop: 1,
  },

  /* Filters */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dateFieldText: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    flex: 1,
  },
  resetBtn: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
    fontSize: 12,
  },

  /* Loading / empty */
  loadingText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    marginTop: 10,
  },
  emptyWrap: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 2,
  },

  /* Table */
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
  },
  cell: {
    width: 150,
    paddingHorizontal: 6,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: TEXT_DARK,
  },
  headerCell: {
    backgroundColor: PRIMARY,
    color: '#fff',
    paddingVertical: 12,
    fontFamily: 'Lato-SemiBold',
    fontSize: 12,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#fafbff',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  wfhChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Pagination */
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#b8c5ee',
  },
  pageText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
    fontSize: 12,
  },
  pageIndicator: {
    color: TEXT_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },

  /* CTA */
  ctaBtn: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },

  /* Modal */
  modalBackdropCenter: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(31,36,64,0.45)',
    padding: 14,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f3fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formLabel: {
    color: TEXT_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    marginTop: 10,
    marginBottom: 6,
  },
  dateInput: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: TEXT_DARK,
    backgroundColor: '#fafbff',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },
});
