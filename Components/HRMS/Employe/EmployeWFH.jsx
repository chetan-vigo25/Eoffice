import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SelectList } from 'react-native-dropdown-select-list';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import BASE_URL, { IMAGE_FILEPATH_URL } from '../../../Urls/DomainUrl';
import { useEmployeeDashboard } from '../../../Context/EmployeeDashboardContext';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AntDesign,
  FontAwesome,
  Octicons,
  Entypo,
  MaterialIcons,
  SimpleLineIcons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

const PRIMARY = '#6a8ff3';
const PRIMARY_DARK = '#4c72d9';
const PRIMARY_TINT = '#eef2ff';
const TEXT_DARK = '#1f2440';
const TEXT_MUTED = '#7c84a3';
const BORDER = '#e6eaf5';
const SUCCESS = '#4CAF50';
const WARNING = '#FFB020';
const DANGER = '#F54927';

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) setTimeout(onOk, 2000);
  } else {
    Alert.alert('', message, [{ text: 'OK', onPress: () => { if (onOk); } }], { cancelable: false });
  }
}

export default function EmployeWFH({ navigation }) {
  const { dashboardData } = useEmployeeDashboard();
  const { logout } = useContext(UserContext);
  const insets = useSafeAreaInsets();

  const [manualRecords, setManualRecords] = useState([]);
  const [startDateVisible, setStartDateVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDateVisible, setEndDateVisible] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [selectStatus, setSelectStatus] = useState(null);
  const [wfhModal, setWfhModal] = useState(false);
  const [wfhType, setWfhType] = useState(null);
  const [wfhDateVisible, setWfhDateVisible] = useState(false);
  const [wfhDate, setWfhDate] = useState(null);
  const [wfhReason, setWfhReason] = useState(null);
  const [workToDo, setWorkToDo] = useState(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wfhRequest, setWfhRequest] = useState([]);
  const [wfhRequestListData, setWfhRequestListData] = useState([]);
  const [errors, setErrors] = useState({});
  const [filteredWfhData, setFilteredWfhData] = useState([]);
  const [viewModalId, setViewModalId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const combinedData = [...manualRecords, ...wfhRequestListData];
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
          await wfhRequestList();
          await wfhEmployeeList(parsedData);
        }
      } catch (err) {
        console.error('Failed to load userData:', err);
      }
    };
    loadUserData();
  }, []);

  const wfhRequestList = async () => {
    try {
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        branchId: userData?.branchId,
        companyId: userData?.companyId,
        employeId: userData?._id,
        isPagination: false,
        leaveTypeId: '',
        sort: true,
        status: '',
        text: '',
      });

      const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
      const response = await fetch(`${BASE_URL}/admin/master/others/wfhManager/list`, requestOptions);
      const result = await response.json();
      if (result.statusCode === 200) {
        const wfhReqOptions = (result.data.docs || []).map((wfhReq) => ({
          key: wfhReq._id,
          value: wfhReq.name,
        }));
        setWfhRequest(wfhReqOptions);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        console.log('WFH List Error---:', result.message);
      }
    } catch (err) {
      console.log('WFH List Error---:', err);
    }
  };

  const validateLeaveForm = () => {
    const newErrors = {};
    if (!wfhType) newErrors.wfhType = 'WFH type is required';
    if (!wfhDate) newErrors.wfhDate = 'Date is required';
    if (!wfhReason || !wfhReason.trim()) newErrors.wfhReason = 'Reason is required';
    if (!workToDo || !workToDo.trim()) newErrors.workToDo = 'Work to do is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createWFHRequest = async () => {
    try {
      if (!validateLeaveForm()) return;
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
        setSubmitting(false);
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        branchId: userData?.branchId,
        companyId: userData?.companyId,
        directorId: '',
        employeId: userData?._id,
        endDate: wfhDate,
        reason: wfhReason,
        startDate: wfhDate,
        status: 'pending',
        wfhManagerId: wfhType,
        worktodo: workToDo,
      });

      const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
      const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/create`, requestOptions);
      const result = await response.json();
      if (result.statusCode === 200) {
        resetFormFields();
        showToast(result.message);
        setWfhModal(false);
        await wfhEmployeeList(userData);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        showToast(result.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateWfhRequest = async () => {
    try {
      if (!validateLeaveForm()) return;
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
        setSubmitting(false);
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        _id: editingLeaveId,
        branchId: userData?.branchId,
        companyId: userData?.companyId,
        directorId: '',
        employeId: userData?._id,
        endDate: moment(wfhDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        reason: wfhReason,
        startDate: moment(wfhDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        status: 'pending',
        wfhManagerId: wfhType,
        worktodo: workToDo,
      });

      const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
      const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/update`, requestOptions);
      const result = await response.json();
      if (result.statusCode === 200) {
        setWfhModal(false);
        resetFormFields();
        showToast(result.message || 'WFH request updated successfully');
        await wfhEmployeeList(userData);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        console.error('WFH Request Update API Error:', result.message);
        showToast(result.message || 'Failed to update WFH request');
      }
    } catch (err) {
      console.error('Failed to update WFH request:', err);
      showToast('Error updating WFH request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wfhEmployeeList = async (userDataParam) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
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
          directorId: '',
          employeId: userDataParam?._id,
          endDate: '',
          isPagination: true,
          page: currentPage,
          limit,
          sort: true,
          startDate: '',
          status: '',
          text: '',
        });

        const requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
        const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/list`, requestOptions);
        const result = await response.json();

        if (result.statusCode === 200) {
          const pageData = result.data.docs || [];
          if (pageData.length === 0) {
            hasNextPage = false;
          } else {
            allData = [...allData, ...pageData];
            hasNextPage = result.data?.hasNextPage !== false;
            if (pageData.length < limit) hasNextPage = false;
            if (result.data?.totalPages) hasNextPage = currentPage < result.data.totalPages;
            currentPage++;
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
              directorId: '',
              employeId: userDataParam?._id,
              endDate: '',
              isPagination: false,
              sort: true,
              startDate: '',
              status: '',
              text: '',
            });
            const requestOptionsAll = { method: 'POST', headers: myHeaders, body: rawAll, redirect: 'follow' };
            const responseAll = await fetch(`${BASE_URL}/admin/employe/wfhRequest/list`, requestOptionsAll);
            const resultAll = await responseAll.json();
            if (resultAll.statusCode === 200) {
              allData = resultAll.data.docs || resultAll.data || [];
              hasNextPage = false;
            } else if (isUnauthorized(resultAll)) {
              await handleEmployeUnauthorized(navigation, logout);
              hasNextPage = false;
            } else {
              showToast(resultAll.message || 'Failed to fetch WFH requests');
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }
        }
      }

      // Filter to only show the logged-in user's WFH requests.
      // The /admin endpoint returns all employees' requests even when employeId is sent in the body,
      // so we filter client-side against the logged-in user's _id.
      const myEmployeId = userDataParam?._id;
      const myWfh = myEmployeId
        ? allData.filter((item) => {
            const itemEmployeId =
              item?.employeId ||
              item?.employeData?._id ||
              item?.employeData?.employeId;
            return String(itemEmployeId) === String(myEmployeId);
          })
        : [];

      setWfhRequestListData(myWfh);
      setFilteredWfhData(myWfh);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      // swallow
    } finally {
      setLoading(false);
    }
  };

  const filterWfhEmployeeData = (data, start, end, status) => {
    if (!start && !end && !status) {
      setWfhRequestListData(data);
      return;
    }
    const filtered = data.filter((item) => {
      const itemDate = moment(item.startDate);
      let dateMatch = true;
      if (start && end) {
        dateMatch = itemDate.isBetween(
          moment(start, 'DD/MM/YYYY'),
          moment(end, 'DD/MM/YYYY'),
          'day',
          '[]'
        );
      } else if (start && !end) {
        dateMatch = itemDate.isSame(moment(start, 'DD/MM/YYYY'), 'day');
      } else if (!start && end) {
        dateMatch = itemDate.isSame(moment(end, 'DD/MM/YYYY'), 'day');
      }
      let statusMatch = true;
      if (status) statusMatch = item.status?.toLowerCase() === status.toLowerCase();
      return dateMatch && statusMatch;
    });
    setWfhRequestListData(filtered);
    setVisibleCount(PAGE_SIZE);
  };

  useEffect(() => {
    if (userData && (startDate || endDate || selectStatus)) {
      filterWfhEmployeeData(filteredWfhData, startDate, endDate, selectStatus);
    }
  }, [startDate, endDate, selectStatus]);

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectStatus(null);
    setWfhRequestListData(filteredWfhData);
    setVisibleCount(PAGE_SIZE);
  };

  const openEditModal = (item) => {
    setEditingLeaveId(item._id);
    setIsEditMode(true);
    setWfhType(item.wfhManagerId?._id || item.wfhManagerId);
    setWfhDate(moment(item.startDate).format('DD-MM-YYYY'));
    setWfhReason(item.reason);
    setWorkToDo(item.worktodo);
    setWfhModal(true);
  };

  const resetFormFields = () => {
    setEditingLeaveId(null);
    setWfhType(null);
    setWfhDate(null);
    setWfhReason(null);
    setWorkToDo(null);
    setIsEditMode(false);
    setErrors({});
  };

  const todayWFHEmployees = dashboardData?.todayWFHEmployes || [];

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

  const statusColor = (s) =>
    s === 'pending' ? WARNING : s === 'approved' ? SUCCESS : DANGER;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topBarTitle}>WFH Management</Text>
          <Text style={styles.topBarSubtitle}>Request & track your remote days</Text>
        </View>
        <TouchableOpacity onPress={() => setWfhModal(true)} style={styles.headerPlus}>
          <AntDesign name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Today on WFH card */}
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View style={styles.todayHeaderLeft}>
                <View style={styles.todayIconBadge}>
                  <MaterialCommunityIcons name="home-account" size={14} color="#fff" />
                </View>
                <Text style={styles.todayHeaderText}>On WFH Today</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{todayWFHEmployees.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setWfhModal(true)} style={styles.applyButton}>
                <AntDesign name="plus" size={12} color="#fff" />
                <Text style={styles.applyButtonText}>Apply WFH</Text>
              </TouchableOpacity>
            </View>

            {todayWFHEmployees.length === 0 ? (
              <View style={styles.emptyInline}>
                <View style={styles.emptyInlineIcon}>
                  <MaterialCommunityIcons name="home-outline" size={20} color="#b6c1cd" />
                </View>
                <Text style={styles.noEmployeesText}>No one is working from home today</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 6, paddingVertical: 2 }}
              >
                {todayWFHEmployees.map((emp, idx) => {
                  const name = emp.fullName || emp.employename || emp.name || '—';
                  const subtitle =
                    emp.designationName ||
                    emp.designation ||
                    emp.departmentName ||
                    emp.department ||
                    emp.email ||
                    '';
                  const profile = emp.profileImage || emp.employeProfileImage || emp.profile;
                  const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join('')
                    .toUpperCase() || '?';

                  return (
                    <View key={emp.id || emp._id || idx} style={styles.wfhEmpCard}>
                      <View style={styles.avatarRing}>
                        <View style={styles.avatarContainer}>
                          {profile ? (
                            <Image
                              source={{ uri: `${IMAGE_FILEPATH_URL}/${profile}` }}
                              style={{ height: 38, width: 38, borderRadius: 19 }}
                            />
                          ) : (
                            <Text style={styles.avatarText}>{initials}</Text>
                          )}
                        </View>
                        <View style={styles.wfhIconBadge}>
                          <MaterialCommunityIcons name="home" size={8} color="#fff" />
                        </View>
                      </View>
                      <View style={styles.wfhEmpInfo}>
                        <Text style={styles.employeeName} numberOfLines={1}>
                          {name}
                        </Text>
                        {subtitle ? (
                          <Text style={styles.employeeRole} numberOfLines={1}>
                            {subtitle}
                          </Text>
                        ) : null}
                        <View style={styles.wfhPill}>
                          <View style={styles.wfhPillDot} />
                          <Text style={styles.wfhPillText}>Working from home</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

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

            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.resetBtn}
              activeOpacity={0.85}
            >
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

          <View style={{ marginTop: 10, marginBottom: 4 }}>
            <SelectList
              setSelected={(val) => setSelectStatus(val)}
              data={['pending', 'approved', 'rejected']}
              save="value"
              placeholder="Select Status"
              search={false}
              boxStyles={selectListBox}
              dropdownStyles={selectListDropdown}
              inputStyles={selectListInput}
              dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
              arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
            />
          </View>

          {/* My Requests header */}
          <View style={styles.sectionHeadRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>My Requests</Text>
              <Text style={styles.sectionSubtitle}>
                {loading ? 'Loading…' : `${combinedData.length} total`}
              </Text>
            </View>
          </View>

          {/* List / Empty / Loading */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading your WFH requests…</Text>
            </View>
          ) : currentData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={{ width: 96, height: 96 }}>
                <Image
                  source={require('../../../assets/Images/notFound.png')}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>
              <Text style={styles.emptyTitle}>No Requests</Text>
              <Text style={styles.emptySubtitle}>You haven't submitted any WFH requests yet</Text>
              <TouchableOpacity onPress={() => setWfhModal(true)} style={styles.emptyCta}>
                <AntDesign name="plus" size={13} color={PRIMARY} />
                <Text style={styles.emptyCtaText}>Create one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12, marginTop: 4 }}>
              {currentData.map((item, index) => {
                const status = item.status;
                const color = statusColor(status);
                return (
                  <View key={item._id?.toString() || index} style={styles.requestCard}>
                    <View style={styles.requestHead}>
                      <View style={styles.typeBadge}>
                        <Feather name="home" size={11} color={PRIMARY_DARK} />
                        <Text style={styles.typeBadgeText} numberOfLines={1}>
                          {item.wfhManagerData?.name || 'WFH'}
                        </Text>
                      </View>
                      <View style={[styles.reqStatusBadge, { backgroundColor: `${color}18` }]}>
                        <View style={[styles.reqStatusDot, { backgroundColor: color }]} />
                        <Text style={[styles.reqStatusText, { color }]}>
                          {status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.datesRow}>
                      <View style={styles.dateBlock}>
                        <Text style={styles.dateLabel}>Date</Text>
                        <Text style={styles.dateValue}>
                          {moment(item.startDate).format('DD MMM YYYY')}
                        </Text>
                        <Text style={styles.dateSub}>
                          {moment(item.startDate).format('dddd')}
                        </Text>
                      </View>
                      <View style={styles.daysPill}>
                        <Text style={styles.daysPillValue}>
                          {item.wfhManagerData?.allowedDays ?? '-'}
                        </Text>
                        <Text style={styles.daysPillLabel}>Days</Text>
                      </View>
                    </View>

                    {!!item.reason && (
                      <View style={styles.reasonRow}>
                        <Feather name="message-circle" size={12} color={TEXT_MUTED} style={{ marginTop: 2 }} />
                        <Text style={styles.reasonText} numberOfLines={2}>
                          <Text style={{ fontFamily: 'Lato-SemiBold' }}>Reason: </Text>
                          {item.reason}
                        </Text>
                      </View>
                    )}

                    {!!item.worktodo && (
                      <View style={styles.reasonRow}>
                        <Feather name="edit-3" size={12} color={TEXT_MUTED} style={{ marginTop: 2 }} />
                        <Text style={styles.reasonText} numberOfLines={2}>
                          <Text style={{ fontFamily: 'Lato-SemiBold' }}>Work: </Text>
                          {item.worktodo}
                        </Text>
                      </View>
                    )}

                    <View style={styles.requestFoot}>
                      <View style={styles.metaRow}>
                        <Feather name="clock" size={11} color="#9aa0b4" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          Requested {moment(item.createdAt).format('DD MMM · hh:mm A')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => { setViewModalId(item._id); setSelectedItem(item); }}
                          style={styles.viewBtn}
                        >
                          <FontAwesome name="eye" size={11} color={PRIMARY_DARK} />
                          <Text style={styles.viewBtnText}>View</Text>
                        </TouchableOpacity>
                        {status === 'pending' ? (
                          <TouchableOpacity activeOpacity={0.8} onPress={() => openEditModal(item)} style={styles.editBtn}>
                            <Feather name="edit-2" size={12} color={PRIMARY_DARK} />
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
                  </View>
                );
              })}

              {isLoadingMore && (
                <View style={styles.loadMoreRow}>
                  <ActivityIndicator size="small" color={PRIMARY} />
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
          )}
        </ScrollView>
      </View>

      {/* Apply / Edit WFH Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={wfhModal}
        onRequestClose={() => { setWfhModal(false); resetFormFields(); }}
      >
        <View style={styles.modalBackdropCenter}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.formCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditMode ? 'Update WFH' : 'Apply WFH'}</Text>
                <TouchableOpacity
                  onPress={() => { setWfhModal(false); resetFormFields(); }}
                  style={styles.modalClose}
                >
                  <AntDesign name="close" size={16} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>WFH Type</Text>
              <SelectList
                setSelected={(val) => { setWfhType(val); setErrors((p) => ({ ...p, wfhType: null })); }}
                data={wfhRequest}
                save="key"
                placeholder="Select WFH Type"
                search={false}
                boxStyles={selectListBox}
                dropdownStyles={selectListDropdown}
                inputStyles={selectListInput}
                dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
                arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
              />
              {errors.wfhType && <Text style={styles.errorText}>{errors.wfhType}</Text>}

              <Text style={styles.formLabel}>WFH Date</Text>
              <TouchableOpacity
                onPress={() => setWfhDateVisible(true)}
                style={styles.dateInput}
                activeOpacity={0.85}
              >
                <Text style={[styles.dateInputText, !wfhDate && { color: TEXT_MUTED }]}>
                  {wfhDate ? wfhDate : 'Select Date'}
                </Text>
                <Feather name="calendar" size={16} color={PRIMARY_DARK} />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={wfhDateVisible}
                mode="date"
                onConfirm={(date) => {
                  setWfhDate(moment(date).format('YYYY-MM-DD'));
                  setErrors((p) => ({ ...p, wfhDate: null }));
                  setWfhDateVisible(false);
                }}
                onCancel={() => setWfhDateVisible(false)}
                minimumDate={new Date()}
                is24Hour={false}
              />
              {errors.wfhDate && <Text style={styles.errorText}>{errors.wfhDate}</Text>}

              <Text style={styles.formLabel}>WFH Reason</Text>
              <TextInput
                value={wfhReason}
                onChangeText={(v) => { setWfhReason(v); setErrors((p) => ({ ...p, wfhReason: null })); }}
                placeholder="Enter your reason"
                placeholderTextColor="#a0a6bd"
                style={styles.textInput}
              />
              {errors.wfhReason && <Text style={styles.errorText}>{errors.wfhReason}</Text>}

              <Text style={styles.formLabel}>Work To Do</Text>
              <TextInput
                value={workToDo}
                onChangeText={(v) => { setWorkToDo(v); setErrors((p) => ({ ...p, workToDo: null })); }}
                placeholder="Describe the work you plan to do"
                placeholderTextColor="#a0a6bd"
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                multiline
              />
              {errors.workToDo && <Text style={styles.errorText}>{errors.workToDo}</Text>}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => { setWfhModal(false); resetFormFields(); }}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Pressable
                  disabled={submitting}
                  onPress={() => (isEditMode ? updateWfhRequest() : createWFHRequest())}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    submitting && { backgroundColor: '#b8c5ee' },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{isEditMode ? 'Update' : 'Submit'}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* View detail Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={viewModalId !== null}
        onRequestClose={() => setViewModalId(null)}
      >
        <View style={styles.modalBackdropCenter}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.detailCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>WFH Request Details</Text>
                <TouchableOpacity onPress={() => setViewModalId(null)} style={styles.modalClose}>
                  <AntDesign name="close" size={16} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>

              {selectedItem && (
                <View>
                  {/* Employee Info */}
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionHeadIcon}>
                      <Octicons name="person" size={14} color={PRIMARY_DARK} />
                    </View>
                    <Text style={styles.sectionHeadText}>Employee Information</Text>
                  </View>
                  <View style={styles.infoTable}>
                    <InfoRow label="Full Name" value={userData?.fullName} />
                    <InfoRow label="Email" value={userData?.email} last />
                  </View>

                  {/* Request Detail */}
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionHeadIcon}>
                      <Entypo name="calendar" size={14} color={PRIMARY_DARK} />
                    </View>
                    <Text style={styles.sectionHeadText}>Request Detail</Text>
                  </View>
                  <View style={styles.infoTable}>
                    <InfoRow label="Request Type" value={selectedItem?.wfhManagerData?.name} />
                    <InfoRow
                      label="Status"
                      value={
                        selectedItem?.status === 'pending'
                          ? 'Pending'
                          : selectedItem?.status === 'approved'
                          ? 'Approved'
                          : 'Rejected'
                      }
                      valueColor={statusColor(selectedItem?.status)}
                    />
                    <InfoRow label="Date" value={moment(selectedItem?.startDate).format('DD-MM-YYYY')} />
                    <InfoRow label="Duration" value={String(selectedItem?.wfhManagerData?.allowedDays ?? '-')} />
                    <InfoRow label="Reason" value={selectedItem?.reason} last />
                  </View>

                  {/* WFH Type */}
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionHeadIcon}>
                      <MaterialIcons name="computer" size={14} color={PRIMARY_DARK} />
                    </View>
                    <Text style={styles.sectionHeadText}>WFH Type Information</Text>
                  </View>
                  <View style={styles.infoTable}>
                    <InfoRow label="WFH Type" value={selectedItem?.wfhManagerData?.name} />
                    <InfoRow
                      label="Salary %"
                      value={`${selectedItem?.wfhManagerData?.perdaySalaryPercent ?? 0}%`}
                      last
                    />
                  </View>

                  {/* System */}
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionHeadIcon}>
                      <SimpleLineIcons name="exclamation" size={14} color={PRIMARY_DARK} />
                    </View>
                    <Text style={styles.sectionHeadText}>System Information</Text>
                  </View>
                  <View style={styles.infoTable}>
                    <InfoRow
                      label="Created At"
                      value={moment(selectedItem?.wfhManagerData?.createdAt).format('MMMM DD, YYYY')}
                    />
                    <InfoRow
                      label="Last Update"
                      value={moment(selectedItem?.wfhManagerData?.updatedAt).format('MMMM DD, YYYY')}
                      last
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueColor, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]} numberOfLines={3}>
        {value || '-'}
      </Text>
    </View>
  );
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
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  topBarSubtitle: {
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
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  sectionLabel: {
    color: TEXT_DARK,
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    paddingTop: 14,
    paddingBottom: 8,
  },

  /* Today WFH card */
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: PRIMARY_DARK,
    // shadowOpacity: 0.06,
    // shadowRadius: 10,
    // shadowOffset: { width: 0, height: 4 },
    // elevation: 1,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayHeaderText: {
    fontSize: 14,
    color: TEXT_DARK,
    fontFamily: 'Lato-SemiBold',
  },
  countPill: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPillText: {
    color: PRIMARY_DARK,
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
    fontSize: 12,
  },
  emptyInline: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInlineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f3fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  noEmployeesText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'Lato-Medium',
  },

  employeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: '#fafbff',
    borderWidth: 1,
    borderColor: '#eef0fa',
    borderRadius: 12,
  },
  wfhEmpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: '#fafbff',
    borderWidth: 1,
    borderColor: '#eaeefc',
    borderRadius: 14,
    minWidth: 210,
    // shadowColor: PRIMARY_DARK,
    // shadowOpacity: 0.04,
    // shadowRadius: 6,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 0,
  },
  wfhEmpInfo: {
    flex: 1,
    maxWidth: 160,
  },
  wfhIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  wfhPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    backgroundColor: PRIMARY_TINT,
    borderRadius: 10,
  },
  wfhPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PRIMARY_DARK,
  },
  wfhPillText: {
    fontSize: 10,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d8e0fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  employeeInfo: {
    marginLeft: 10,
    paddingRight: 6,
    maxWidth: 140,
  },
  employeeName: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    textTransform: 'capitalize',
  },
  employeeRole: {
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 2,
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

  /* Loading / Empty */
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

  /* Section header (My Requests) */
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 2,
  },

  /* Empty state CTA */
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: '#dbe1f5',
  },
  emptyCtaText: {
    color: PRIMARY_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },

  /* Request Card */
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: TEXT_DARK,
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
    backgroundColor: PRIMARY_TINT,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: '58%',
  },
  typeBadgeText: {
    color: PRIMARY_DARK,
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  reqStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  reqStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reqStatusText: {
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
    fontSize: 13,
    color: TEXT_DARK,
    fontFamily: 'Lato-SemiBold',
    marginTop: 3,
  },
  dateSub: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontFamily: 'Lato-Medium',
    marginTop: 2,
  },
  daysPill: {
    alignItems: 'center',
    backgroundColor: PRIMARY_TINT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 56,
  },
  daysPillValue: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
    lineHeight: 18,
  },
  daysPillLabel: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#3a4a7a',
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
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: PRIMARY_TINT,
  },
  viewBtnText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: PRIMARY_TINT,
  },
  editBtnText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f4fb',
  },
  lockedBtnText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#9aa0b4',
  },

  /* Infinite scroll footer */
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadMoreText: {
    color: PRIMARY_DARK,
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


  /* Modals */
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
  detailCard: {
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
    marginBottom: 14,
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
  errorText: {
    color: DANGER,
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    marginTop: 4,
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

  /* Detail modal info rows */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeadIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeadText: {
    color: TEXT_DARK,
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
  },
  infoTable: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: {
    flex: 3,
    padding: 10,
    backgroundColor: '#fafbff',
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  infoValue: {
    flex: 5,
    padding: 10,
    color: TEXT_DARK,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
  },
});
