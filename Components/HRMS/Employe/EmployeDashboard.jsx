import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, ToastAndroid, Dimensions, LayoutAnimation, UIManager, Platform, Linking } from "react-native";
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import CustomCalendar from './EmployeComponent/CustomCalendar';
import EmployeeLeaveCard from './EmployeComponent/EmployeeLeaveCard';
import DashboardCards from './EmployeComponent/QuickAccessCard';
import EmployeBirthdayCard from './EmployeComponent/EmployeBirthdayCard';
import EmployeHeader from './EmployeComponent/EmployeHeader';
import { useEmployeeDashboard } from '../../../Context/EmployeeDashboardContext';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import BASE_URL from '../../../Urls/DomainUrl';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

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
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export default function EmployeDashboard({ navigation, route }) {
  const { userData: contextUserData, logout } = useContext(UserContext);
  const { userData: routeUserData } = route.params || {};
  const userData = contextUserData || routeUserData;
  const { dashboardData, loading, error } = useEmployeeDashboard();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [checkInData, setCheckInData] = useState(null);
  const [workingHours, setWorkingHours] = useState("00:00:00");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState(false);
  const [confirmAttendance, setConfirmAttendance] = useState('');
  const [attendanceRecordId, setAttendanceRecordId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [time, setTime] = useState(moment().format('DD MMM YYYY hh:mm:ss A'));
  const [currentDate, setCurrentDate] = useState((moment().format('YYYY-MM-DD')));
  const intervalRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(moment().format('DD MMM YYYY hh:mm:ss A'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load persisted check-in data on app startup
  useEffect(() => {
    const loadPersistedCheckInData = async () => {
      try {
        const persistedCheckInData = await AsyncStorage.getItem('checkInData');
        const persistedAttendanceId = await AsyncStorage.getItem('attendanceRecordId');
        
        if (persistedCheckInData) {
          const data = JSON.parse(persistedCheckInData);
          console.log("✅ Restored check-in data:", data);
          setCheckInData(data);
          setIsCheckedIn(true);
          
          // Resume timer from persisted check-in time
          startWorkingHoursTimer(new Date(data.checkInDateTime));
        }
        
        if (persistedAttendanceId) {
          setAttendanceRecordId(persistedAttendanceId);
        }

        // Refresh attendance status
        await confirmCheckInOut();
      } catch (error) {
        console.error("❌ Error loading persisted data:", error);
      }
    };

    loadPersistedCheckInData();
  }, []);
 
  const toggleExpand = async () => {
    const newExpandedState = !expanded;

    if (newExpandedState) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);

      // Always check the current OS permission status on every check-in/check-out
      // attempt so that a previous denial does not prevent re-prompting.
      let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (canAskAgain) {
          const res = await Location.requestForegroundPermissionsAsync();
          status = res.status;
          canAskAgain = res.canAskAgain;
        }
      }

      if (status === 'granted') {
        setPermissionGranted(true);
        await fetchLocation();
      } else {
        setPermissionGranted(false);
        if (!canAskAgain) {
          Alert.alert(
            'Location permission required',
            'Please enable location permission from settings to check-in/check-out.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          showToast("Location permission denied");
        }
      }
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
    }
  };

  const fetchLocation = async () => {
    try {
      setLoadingLocation(true);
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
  
      let addr = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
  
      const formattedAddress = addr[0]
        ? `${addr[0].name || ''} ${addr[0].street || ''}, ${addr[0].city || ''}, ${addr[0].region || ''}, ${addr[0].postalCode || ''}`
        : 'Address not found';
  
      setAddress([{ ...addr[0], formattedAddress }]);
    } catch (error) {
      console.log('Error getting location:', error);
      ToastAndroid.show("Failed to fetch location", ToastAndroid.SHORT);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = async () => {
    const now = new Date();

    if (!location || !address) {
      showToast("Location not available!");
      return;
    }

    // Prevent double submission
    if (isCheckingOut) {
      showToast("Action already in progress...");
      return;
    }

    setIsCheckingOut(true);

    // Refresh server-side attendance state so app and web stay in sync.
    let latestStatus = null;
    try {
      latestStatus = await confirmCheckInOut();
    } catch (e) {
      console.log("Failed to refresh attendance status:", e);
    }

    const serverCheckedIn = latestStatus?.isCheckIn === true && latestStatus?.isCheckOut === false;
    const serverCheckedOut = latestStatus?.isCheckIn === true && latestStatus?.isCheckOut === true;

    // ================= ALREADY CHECKED OUT =================
    if (serverCheckedOut) {
      showToast("Already checked out!");
      setExpanded(false);
      setIsCheckingOut(false);
      return;
    }

    // ================= CHECK-IN =================
    if (!serverCheckedIn) {
      const data = {
        checkInDateTime: now,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        fullAddress: address[0].formattedAddress,
        checkOutDateTime: null,
        workingHours: null
      };

      setCheckInData(data);
      setIsCheckedIn(true);
      setWorkingHours("00:00:00");

      try {
        await employeCheckIn(data);
        startWorkingHoursTimer(now);
        showToast("Checked in successfully!");
        setExpanded(false);
        setLocation(null);
        setAddress(null);
      } catch (e) {
        console.error("Check-in error:", e);
      } finally {
        setIsCheckingOut(false);
      }
      return;
    }

    // ================= CHECK-OUT =================
    try {
      // Pull check-in source data from server response if local state is missing
      // (e.g. user checked in via web, then opens app to check out).
      const effectiveCheckInData = checkInData || {
        checkInDateTime: latestStatus?.checkInTime,
        latitude: latestStatus?.checkInLocation?.latitude,
        longitude: latestStatus?.checkInLocation?.longitude,
        fullAddress: latestStatus?.checkInLocation?.address,
        checkOutDateTime: null,
        workingHours: null,
      };

      const effectiveAttendanceId = attendanceRecordId || latestStatus?._id;

      if (!effectiveCheckInData?.checkInDateTime) {
        showToast("Check-in data not found!");
        setIsCheckingOut(false);
        return;
      }

      if (!effectiveAttendanceId) {
        showToast("Attendance record not found! Please check-in again.");
        setIsCheckingOut(false);
        return;
      }

      const diffMs = now - new Date(effectiveCheckInData.checkInDateTime);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const workingHoursStr = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;

      const updatedData = {
        ...effectiveCheckInData,
        checkOutDateTime: now,
        workingHours: workingHoursStr,
        checkOutLatitude: location.coords.latitude,
        checkOutLongitude: location.coords.longitude,
        checkOutAddress: address[0].formattedAddress
      };

      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setCheckInData(updatedData);
      setWorkingHours(workingHoursStr);
      setIsCheckedIn(false);
      setCheckOutDone(true);

      await employeCheckOut(updatedData, effectiveAttendanceId);
    
      showToast("Checked out successfully!");
      setExpanded(false);
      // Reset location after successful checkout
      setLocation(null);
      setAddress(null);
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("Checkout failed! Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const startWorkingHoursTimer = (startDate) => {
    // startDate should be a Date object representing check-in time
    if (!startDate) return;

    // Clear previous interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const diffMs = now - new Date(startDate);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const workingHoursStr = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
      setWorkingHours(workingHoursStr);
    }, 1000);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const employeCheckIn = async (data) => {
    try {
      if (!userData?._id) {
        showToast("User information not available");
        return;
      }

      let token = await AsyncStorage.getItem("authToken");
      if (!token) {
        showToast("Authentication token not found");
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + token);

      const checkInDateTime = data.checkInDateTime;

      const raw = JSON.stringify({
        "id": userData?._id,
        "companyId": userData?.companyId || "",
        "directorId": "",
        "branchId": userData?.branchId || "",
        "employeId": userData?._id,
        "shift": "",
        "attendanceDate": currentDate,
        "checkInTime": new Date(checkInDateTime).toISOString(),
        "checkOutTime": null,
        "workType": "work_from_office",
        "method": "google_api",
        "checkInLocation": {
          "latitude": data.latitude,
          "longitude": data.longitude,
          "address": data.fullAddress,
          "distanceInMeter": "0",
          "isNearBy": false
        }
      });
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      // console.log("Check-In API Request Data for test:", raw);
      // return;

      const response = await fetch(`${BASE_URL}/admin/employe/attendance/create`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        // showToast("Check-In Successful!");
        // console.log("Check-In API success:", result);
        const attendanceId = result.data._id;

        // Save check-in data and attendance ID to AsyncStorage for persistence
        await AsyncStorage.setItem('checkInData', JSON.stringify(data));
        await AsyncStorage.setItem('attendanceRecordId', attendanceId);

        setAttendanceRecordId(attendanceId); // Store the attendance record ID
        await confirmCheckInOut();
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        showToast("Check-In Failed:");
        console.error(result.message || "Check-in failed");
      }
    } catch (error) {
      console.error("Check-In API error:", error);
      showToast("Error during check-in");
    }
  };

  const confirmCheckInOut = async () => {
    return new Promise((resolve, reject) => {
      try {
        AsyncStorage.getItem("authToken").then((token) => {
          if (!token) {
            console.log("Auth token not found");
            reject(new Error("Auth token not found"));
            return;
          }

          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          myHeaders.append("Authorization", "Bearer " + token);

          const raw = JSON.stringify({
            "employeId": userData?._id,
            // "id": userData?._id
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };

          // console.log("confirmCheckInOut API Request Data:", raw);

          fetch(`${BASE_URL}/admin/employe/attendance/isCheckin`, requestOptions)
            .then((response) => response.json())
            .then(async (result) => {
              if (result.statusCode === 200) {
                const checkedIn = result.data;
                setConfirmAttendance(checkedIn);

                // Keep local state in sync with server so check-in/out
                // initiated from the web is reflected in the app.
                if (checkedIn?.isCheckIn === true && checkedIn?.isCheckOut === false) {
                  setIsCheckedIn(true);

                  if (checkedIn?._id) {
                    setAttendanceRecordId(checkedIn._id);
                    try { await AsyncStorage.setItem('attendanceRecordId', checkedIn._id); } catch (_) {}
                  }

                  if (checkedIn?.checkInTime) {
                    const syncedCheckInData = {
                      checkInDateTime: checkedIn.checkInTime,
                      latitude: checkedIn?.checkInLocation?.latitude,
                      longitude: checkedIn?.checkInLocation?.longitude,
                      fullAddress: checkedIn?.checkInLocation?.address,
                      checkOutDateTime: null,
                      workingHours: null,
                    };
                    setCheckInData((prev) => prev || syncedCheckInData);
                    try { await AsyncStorage.setItem('checkInData', JSON.stringify(syncedCheckInData)); } catch (_) {}

                    if (!intervalRef.current) {
                      startWorkingHoursTimer(new Date(checkedIn.checkInTime));
                    }
                  }
                } else if (checkedIn?.isCheckIn === true && checkedIn?.isCheckOut === true) {
                  setIsCheckedIn(false);
                  setCheckOutDone(true);
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  try {
                    await AsyncStorage.removeItem('checkInData');
                    await AsyncStorage.removeItem('attendanceRecordId');
                  } catch (_) {}
                } else {
                  setIsCheckedIn(false);
                }

                resolve(checkedIn);
              } else if (isUnauthorized(result)) {
                await handleEmployeUnauthorized(navigation, logout);
                reject(new Error('Unauthorized'));
              } else {
                console.log("Check-In Status API failed----....:", result);
                reject(new Error(result.message || "Failed to get check-in status"));
              }
            })
            .catch((error) => {
              console.error("Check-In Status API error----:", error);
              reject(error);
            });
        });
      } catch (error) {
        console.error("confirmCheckInOut error:", error);
        reject(error);
      }
    });
  };

  const employeCheckOut = async (data, recordId) => {
    try {
      if (!userData?._id) {
        showToast("User information not available");
        return;
      }

      let token = await AsyncStorage.getItem("authToken");
      if (!token) {
        showToast("Authentication token not found");
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + token);

      const checkInDateTime = data.checkInDateTime;
      const checkOutDateTime = data.checkOutDateTime;

      const raw = JSON.stringify({
        "_id": recordId || attendanceRecordId, // Use passed-in id, fall back to state
        "companyId": userData?.companyId || "",
        "directorId": "",
        "branchId": userData?.branchId || "",
        "employeId": userData?._id,
        "shift": "",
        "attendanceDate": currentDate,
        "checkInTime": checkInDateTime ,
        "checkOutTime":  new Date(checkOutDateTime).toISOString(),
        "workType": "work_from_office",
        "method": "google_api",
        "checkInLocation": {
          "latitude": data.latitude,
          "longitude": data.longitude,
          "address": data.fullAddress,
          "distanceInMeter": "0",
          "isNearBy": false
        },
        "checkOutLocation": {
          "latitude": data.checkOutLatitude,
          "longitude": data.checkOutLongitude,
          "address": data.checkOutAddress,
          "distanceInMeter": "0",
          "isNearBy": false
        }
      });
      // console.log("Check-Out API Request Data:", raw);
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch(`${BASE_URL}/admin/employe/attendance/update`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        // console.log("Check-Out API success:", result);
        showToast("Check-Out Successful!");

        // Clear persisted check-in data after successful check-out
        await AsyncStorage.removeItem('checkInData');
        await AsyncStorage.removeItem('attendanceRecordId');

        await confirmCheckInOut();
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        showToast("Check-Out API failed:", result);
        console.error(result.message || "Check-out failed");
      }
    } catch (error) {
      showToast("Check-Out API error:", error);
      showToast("Error during check-out");
    }
  };

  useEffect(() => {
       if (dashboardData) {
        //  console.log('Dashboard Data eventData:', dashboardData.holidayData);
       }
   }, [dashboardData])
  const employeesOnLeave = dashboardData?.todayOnLeave || [];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <StatusBar background='#f6f7fb' barStyle='dark-content' />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 28 }} >
        <EmployeHeader navigation={navigation} userData={userData} />
        <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: '#eef0fa', shadowColor: '#4c72d9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4c72d9' }} />
                <Text style={{ color: '#3a4a7a', fontSize: 13, fontFamily: "Lato-SemiBold" }}>{time}</Text>
              </View>
              <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }} >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9800' }} />
                <Text style={{ color: '#4c72d9', fontSize: 12, fontFamily: "Lato-SemiBold" }}>On Leave · {employeesOnLeave.length}</Text>
              </View>
            </View>
            {
              confirmAttendance?.isCheckIn === false || confirmAttendance === false ? (
                <></>
              ):( 
               confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === false ? (
                 <View style={{ flexDirection:'row', alignItems:'center', marginTop: 12, backgroundColor:'#eef7ee', paddingHorizontal:10, paddingVertical:8, borderRadius:10, alignSelf:'flex-start', gap:8 }} >
                  <Entypo name="login" size={12} color="#22a06b" />
                  <Text style={{ color: '#22a06b', fontSize: 12, fontFamily: 'Lato-SemiBold' }}>Checked in</Text>
                  <Text style={{ color: '#22a06b', fontSize: 12, fontFamily: 'Lato-Medium' }}>
                    {confirmAttendance?.checkInTime
                      ? (moment(confirmAttendance.checkInTime).isValid()
                          ? moment(confirmAttendance.checkInTime).format('hh:mm A')
                          : confirmAttendance.checkInTime)
                      : '-'}
                  </Text>
                 </View>
               ):(
                 <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginTop:12, gap:10 }} >
                   <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#eef7ee', paddingHorizontal:10, paddingVertical:8, borderRadius:10 }} >
                    <Entypo name="login" size={12} color="#22a06b" />
                    <View style={{ flex:1 }} >
                      <Text style={{ color:'#7c8a82', fontSize:10, fontFamily:'Lato-SemiBold', textTransform:'uppercase', letterSpacing:0.5 }} >Check-in</Text>
                      <Text style={{ color: '#22a06b', fontSize: 13, fontFamily: 'Lato-SemiBold' }}>
                        {confirmAttendance?.checkInTime
                          ? (moment(confirmAttendance.checkInTime).isValid()
                              ? moment(confirmAttendance.checkInTime).format('hh:mm A')
                              : confirmAttendance.checkInTime)
                          : '-'}
                      </Text>
                    </View>
                   </View>
                   <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#fdecec', paddingHorizontal:10, paddingVertical:8, borderRadius:10 }} >
                    <Entypo name="log-out" size={12} color="#d9534f" />
                    <View style={{ flex:1 }} >
                      <Text style={{ color:'#8a7c7c', fontSize:10, fontFamily:'Lato-SemiBold', textTransform:'uppercase', letterSpacing:0.5 }} >Check-out</Text>
                      <Text style={{ color: '#d9534f', fontSize: 13, fontFamily: 'Lato-SemiBold' }}>
                        {confirmAttendance?.checkOutTime
                          ? (moment(confirmAttendance.checkOutTime).isValid()
                              ? moment(confirmAttendance.checkOutTime).format('hh:mm A')
                              : confirmAttendance.checkOutTime)
                          : '-'}
                      </Text>
                    </View>
                   </View>
                 </View>
               )
              )
            }
            {/* {
              confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true ? (
                <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: 10, marginTop:10 }} >
                  <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:10 }} >
                   <Entypo name="login" size={12} color="#4c72d9" />
                   <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                     {confirmAttendance?.checkInTime 
                       ? (moment(confirmAttendance.checkInTime).isValid() 
                           ? moment(confirmAttendance.checkInTime).format('hh:mm:ss A')
                           : confirmAttendance.checkInTime)
                       : '-'}
                   </Text>
                  </View>
                  <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:10, justifyContent:'flex-end' }} >
                   <Entypo name="login" size={12} color="#4c72d9" />
                   <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                     {confirmAttendance?.checkOutTime 
                       ? (moment(confirmAttendance.checkOutTime).isValid() 
                           ? moment(confirmAttendance.checkOutTime).format('hh:mm:ss A')
                           : confirmAttendance.checkOutTime)
                       : '-'}
                   </Text>
                  </View>
                </View>
              ):(
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                 <Entypo name="login" size={12} color="#868686" />
                  {checkInData && (
                    <View style={{ marginLeft: 5 }}>
                      {!checkInData.checkOutDateTime ? (
                        // Show only Check-In time before check-out
                        <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                          {moment(checkInData.checkInDateTime).format('hh:mm:ss A')}
                        </Text>
                      ) : (
                        // Show only Check-Out time after check-out
                        <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                          {moment(checkInData.checkOutDateTime).format('hh:mm:ss A')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )
            } */}
          </View>
          <View style={{ flexDirection: 'row', alignItems:'center', gap: 8, justifyContent: 'center', marginTop: 14, marginBottom: 4 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#eef2ff', justifyContent:'center', alignItems:'center' }} >
              <Entypo name="clock" size={20} color="#4c72d9" />
            </View>
            {/* {
              confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true?(
                <Text style={{ textAlign: 'center', color: '#1f2440', fontSize: 32, fontFamily: 'Lato-SemiBold', letterSpacing: 1 }}>
                  {confirmAttendance?.checkInTime && confirmAttendance?.checkOutTime
                   ? (() => {
                       const checkInMoment = moment(confirmAttendance.checkInTime);
                       const checkOutMoment = moment(confirmAttendance.checkOutTime);
                       if (checkInMoment.isValid() && checkOutMoment.isValid()) {
                         const diffMs = checkOutMoment.diff(checkInMoment);
                         const hours = Math.floor(diffMs / (1000 * 60 * 60));
                         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                         const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                         return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
                       }
                       return '-';
                     })()
                   : '-'
                  }
                </Text>
              ):(
                <Text style={{ textAlign: 'center', color: '#1f2440', fontSize: 32, fontFamily: 'Lato-SemiBold', letterSpacing: 1 }}>{(checkInData && checkInData.workingHours) ? checkInData.workingHours : workingHours}</Text>
              )
            } */}
            {
             confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true ? (
               // ✅ BOTH TRUE → TOTAL WORKING HOURS
               <Text
                 style={{
                   textAlign: 'center',
                   color: '#4c72d9',
                   fontSize: 30,
                   fontFamily: 'Lato-SemiBold',
                   paddingTop: 0,
                 }}
               >
                 {confirmAttendance?.checkInTime && confirmAttendance?.checkOutTime
                   ? (() => {
                       const checkInMoment = moment(confirmAttendance.checkInTime);
                       const checkOutMoment = moment(confirmAttendance.checkOutTime);           

                       if (checkInMoment.isValid() && checkOutMoment.isValid()) {
                         const diffMs = checkOutMoment.diff(checkInMoment);
                         const hours = Math.floor(diffMs / (1000 * 60 * 60));
                         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                         const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);           

                         return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                       }
                       return '-';
                     })()
                   : '-'}
               </Text>
             ) : confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === false ? (
               // ⏱️ CHECKED-IN ONLY → RUNNING WORKING HOURS
               <Text style={{ textAlign: 'center', color: '#1f2440', fontSize: 32, fontFamily: 'Lato-SemiBold', letterSpacing: 1 }} >
                 {confirmAttendance?.checkInTime
                   ? (() => {
                       const checkInMoment = moment(confirmAttendance.checkInTime);
                       const nowMoment = moment();           

                       if (checkInMoment.isValid()) {
                         const diffMs = nowMoment.diff(checkInMoment);
                         const hours = Math.floor(diffMs / (1000 * 60 * 60));
                         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                         const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);           

                         return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                       }
                       return '-';
                     })()
                   : '-'}
               </Text>
             ) : (
               // 🔁 FALLBACK
               <Text style={{ textAlign: 'center', color: '#1f2440', fontSize: 32, fontFamily: 'Lato-SemiBold', letterSpacing: 1 }} >
                 {(checkInData && checkInData.workingHours)
                   ? checkInData.workingHours
                   : workingHours}
               </Text>
             )
           }
          </View>
          {/* {confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true? (
           <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Lato-SemiBold', paddingLeft: 10 }} >You've already checked out today</Text>
          ):(
            <TouchableOpacity
            onPress={toggleExpand}
            style={{ marginTop: 10, height: 40, flexDirection: 'row', backgroundColor:isCheckedIn?'red':'#4c72d9', justifyContent: 'center', alignItems: 'center', borderBottomRightRadius: 6, borderBottomLeftRadius: 6 }}
          >
            <Entypo name="location-pin" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Lato-SemiBold' }}>{isCheckedIn ? "Check-Out" : "Check-In"} </Text>
          </TouchableOpacity>
          )
          } */}
          <Text style={{ textAlign:'center', color:'#9aa0b4', fontSize: 11, fontFamily:'Lato-SemiBold', textTransform:'uppercase', letterSpacing: 1, marginBottom: 10 }} >Working Hours</Text>
          {
            confirmAttendance?.isCheckIn === true &&
            confirmAttendance?.isCheckOut === true ? (
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, backgroundColor:'#f0f4ff' }} >
                <Entypo name="check" size={16} color="#22a06b" />
                <Text style={{ color: '#22a06b', fontSize: 13, fontFamily: 'Lato-SemiBold' }} >You've already checked out today</Text>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand} style={{ height: 52, flexDirection: 'row',
                    backgroundColor:
                    confirmAttendance?.isCheckIn === true &&
                    confirmAttendance?.isCheckOut === false
                      ? '#e94e4e'
                      : '#4c72d9',
                  justifyContent: 'center', alignItems: 'center', gap: 8 }} >
                <Entypo name={confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === false ? 'log-out' : 'location-pin'} size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Lato-SemiBold', letterSpacing: 0.5 }} >
                  {
                    confirmAttendance?.isCheckIn === true &&
                    confirmAttendance?.isCheckOut === false
                      ? 'Check-Out'
                      : 'Check-In'
                  }
                </Text>
              </TouchableOpacity>
            )
          }
          {expanded && (
            <View style={{ width: '100%', backgroundColor: '#fafbff', padding: 14, borderTopWidth: 1, borderTopColor: '#eef0fa' }}>
                <View style={{ flexDirection:'row', alignItems:'center', paddingVertical:6, paddingHorizontal: 10, backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:'#eef0fa', gap: 10, marginBottom: 12 }} >
                  <View style={{ width:34, height:34, borderRadius:17, backgroundColor:'#fdecec', justifyContent:'center', alignItems:'center' }} >
                    <FontAwesome name="map-pin" size={16} color="#e94e4e" />
                  </View>
                  {loadingLocation ? (
                    <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8 }} >
                      <ActivityIndicator size="small" color="#4c72d9" />
                      <Text style={{ color:'#7c84a3', fontSize:12, fontFamily:'Lato-Medium' }} >Fetching your location…</Text>
                    </View>
                  ) : (
                    <Text style={{ flex:1, color: "#3a4a7a", fontSize: 12, fontFamily: 'Lato-Medium', lineHeight: 18 }}>{address ? address[0].formattedAddress : 'Location not available'}</Text>
                  )}
                </View>
                {/* <View style={{ flexDirection:'row', paddingVertical:5 }} >
                  <View style={{ flex:.6 }} ></View>
                  {loadingLocation ? (
                    <></>
                  ) : (
                    location && (
                      <Text style={{ flex:9, color: '#444', fontSize: 14, fontFamily: 'Lato-Medium', marginBottom: 10 }}>
                        Latitude: {location.coords.latitude},
                        Longitude: {location.coords.longitude}
                      </Text>
                    )
                  )}
                </View> */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity activeOpacity={0.85} onPress={toggleExpand} style={{ flex: 1, height: 46, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.2, borderColor: '#dbe1f5', borderRadius: 12 }}>
                  <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Lato-SemiBold" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm} disabled={loadingLocation || (!location || !address) || isCheckingOut} style={{  flex: 1, backgroundColor: (!location || !address || loadingLocation || isCheckingOut) ? '#a9bcf2' : '#4c72d9', height: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 12, flexDirection:'row', gap: 6 }} >
                  {loadingLocation || isCheckingOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Entypo name="check" size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 14, fontFamily: "Lato-SemiBold" }}>Confirm</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: 6, marginBottom: 10 }} >
          <Text style={{ fontSize: 15, fontFamily:'Lato-SemiBold', color:'#1f2440' }} >Quick Access</Text>
          <View style={{ height: 4, width: 28, borderRadius: 2, backgroundColor: '#4c72d9' }} />
        </View>
        <DashboardCards navigation={navigation} />
        <EmployeeLeaveCard navigation={navigation} />
        <EmployeBirthdayCard navigation={navigation} />
        <View style={{ marginTop: 5 }} >
          <CustomCalendar navigation={navigation} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
