import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, Image, TouchableOpacity, Alert, ActivityIndicator, ToastAndroid, Dimensions, LayoutAnimation, UIManager, Platform } from "react-native";
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment';
import { Entypo } from '@expo/vector-icons';
import CustomCalendar from './EmployeComponent/CustomCalendar';
import EmployeeLeaveCard from './EmployeComponent/EmployeeLeaveCard';
import DashboardCards from './EmployeComponent/QuickAccessCard';
import EmployeHeader from './EmployeComponent/EmployeHeader';

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
  const { userData } = route.params || {};

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
    
    // Only get location if opening the panel (newExpandedState === true)
    if (newExpandedState) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(true);
      
      // Only get location if permission granted
      if (permissionGranted === true) {
        await fetchLocation();
      } else if (permissionGranted === null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setPermissionGranted(true);
          await fetchLocation();
        } else {
          console.log('Permission denied');
          setPermissionGranted(false);
          showToast("Location permission denied");
        }
      } else {
        console.log('Location permission was already denied');
        showToast("Location permission denied");
      }
    } else {
      // Just close without fetching location
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
  
    // ================= CHECK-IN =================
    if (!isCheckedIn) {
      if (!location || !address) {
        showToast("Location not available!");
        return;
      }
  
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
  
      employeCheckIn(data);
      startWorkingHoursTimer(now);
  
      showToast("Checked in successfully!");
      setExpanded(false);
      // Reset location after check-in
      setLocation(null);
      setAddress(null);
      return;
    }
  
    // ================= CHECK-OUT =================
    if (!location || !address) {
      showToast("Location not available for check-out!");
      return;
    }

    // Prevent double submission
    if (isCheckingOut) {
      showToast("Check-out already in progress...");
      return;
    }

    setIsCheckingOut(true);

    try {
      // Get latest status before checkout
      const latestStatus = await confirmCheckInOut();
      
      // If already checked out, prevent duplicate checkout
      if (latestStatus?.isCheckOut === true) {
        showToast("Already checked out!");
        setExpanded(false);
        setIsCheckingOut(false);
        return;
      }
    
      if (!checkInData) {
        showToast("Check-in data not found!");
        setIsCheckingOut(false);
        return;
      }

      if (!attendanceRecordId) {
        showToast("Attendance record not found! Please check-in again.");
        setIsCheckingOut(false);
        return;
      }
    
      const diffMs = now - new Date(checkInData.checkInDateTime);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
      const workingHoursStr = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    
      const updatedData = {
        ...checkInData,
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
    
      await employeCheckOut(updatedData);
    
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

      const checkInDateTime = moment(data.checkInDateTime).format('YYYY-MM-DD HH:mm:ss');

      const raw = JSON.stringify({
        "id": userData?._id,
        "companyId": userData?.companyId || "",
        "directorId": "",
        "branchId": userData?.branchId || "",
        "employeId": userData?._id,
        "shift": "",
        "attendanceDate": currentDate,
        "checkInTime": checkInDateTime,
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
      // console.log("Check-In API Request Data:", raw);
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

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
            "id": userData?._id
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };

          fetch(`${BASE_URL}/admin/employe/attendance/isCheckin`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
              if (result.statusCode === 200) {
                // console.log("confirmCheckInOut API success:", result);
                const checkedIn = result.data;
                setConfirmAttendance(checkedIn);
                resolve(checkedIn);
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

  const employeCheckOut = async (data) => {
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

      const checkInDateTime = moment(data.checkInDateTime).format('YYYY-MM-DD HH:mm:ss');
      const checkOutDateTime = moment(data.checkOutDateTime).format('YYYY-MM-DD HH:mm:ss');

      const raw = JSON.stringify({
        "_id": attendanceRecordId, // Use the stored attendance record ID
        "companyId": userData?.companyId || "",
        "directorId": "",
        "branchId": userData?.branchId || "",
        "employeId": userData?._id,
        "shift": "",
        "attendanceDate": currentDate,
        "checkInTime": checkInDateTime,
        "checkOutTime": checkOutDateTime,
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
      } else {
        showToast("Check-Out API failed:", result);
        console.error(result.message || "Check-out failed");
      }
    } catch (error) {
      showToast("Check-Out API error:", error);
      showToast("Error during check-out");
    }
  };
// useEffect(() => {
//     confirmCheckInOut();
// },[])
// console.log("xzxzxzxzx",confirmAttendance);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar background='#fff' barStyle='dark-content' />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, }} >
        <EmployeHeader navigation={navigation} userData={userData} />
        <View style={{ width: '100%', backgroundColor: '#f1f1f1', borderRadius: 6, marginBottom:10 }}>
          <View style={{ padding: 10, }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold" }}>{time}</Text>
              <View style={{ backgroundColor: '#fff', paddingHorizontal:10, paddingVertical:4, borderRadius: 5 }} >
                <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold" }}>On Leave: 100</Text>
              </View>
            </View>
            {
              confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true ? (
                <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: 10, marginTop:10 }} >
                  <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:10 }} >
                   <Entypo name="login" size={12} color="#4c72d9" />
                   <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: 'Poppins-Medium' }}>{moment(confirmAttendance?.checkInTime).format('hh:mm:ss A') || confirmAttendance?.checkInTime}</Text>
                  </View>
                  <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:10, justifyContent:'flex-end' }} >
                   <Entypo name="login" size={12} color="#4c72d9" />
                   <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: 'Poppins-Medium' }}>{moment(confirmAttendance?.checkOutTime).format('hh:mm:ss A') || confirmAttendance?.checkOutTime}</Text>
                  </View>
                </View>
              ):(
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                 <Entypo name="login" size={12} color="#868686" />
                  {checkInData && (
                    <View style={{ marginLeft: 5 }}>
                      {!checkInData.checkOutDateTime ? (
                        // Show only Check-In time before check-out
                        <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Poppins-Medium' }}>
                          {moment(checkInData.checkInDateTime).format('hh:mm:ss A')}
                        </Text>
                      ) : (
                        // Show only Check-Out time after check-out
                        <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Poppins-Medium' }}>
                          {moment(checkInData.checkOutDateTime).format('hh:mm:ss A')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )
            }
          </View>
          <View style={{ flexDirection: 'row', alignItems:'center', gap: 5, justifyContent: 'center' }}>
            <Entypo name="clock" size={24} color="#4c72d9" />
            {
              confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true?(
                <Text style={{ textAlign: 'center', color: '#4c72d9', fontSize: 30, fontFamily: 'Poppins-SemiBold', paddingTop: 0 }}>
                  {confirmAttendance?.checkInTime && confirmAttendance?.checkOutTime
                   ? moment
                       .utc(
                         moment(confirmAttendance.checkOutTime).diff(
                           moment(confirmAttendance.checkInTime)
                         )
                       )
                       .format('HH:mm:ss')
                   : '-'
                  }
                </Text>
              ):(
                <Text style={{ textAlign: 'center', color: '#4c72d9', fontSize: 30, fontFamily: 'Poppins-SemiBold', paddingTop: 0 }}>{(checkInData && checkInData.workingHours) ? checkInData.workingHours : workingHours}</Text>
              )
            }
          </View>
          {confirmAttendance?.isCheckIn === true && confirmAttendance?.isCheckOut === true? (
           <Text style={{ color: '#868686', fontSize: 14, fontFamily: 'Poppins-SemiBold', paddingLeft: 10 }} >You've already checked out today</Text>
          ):(
            <TouchableOpacity
            onPress={toggleExpand}
            style={{ marginTop: 10, height: 40, flexDirection: 'row', backgroundColor: '#4c72d9', justifyContent: 'center', alignItems: 'center', borderBottomRightRadius: 6, borderBottomLeftRadius: 6 }}
          >
            <Entypo name="location-pin" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins-SemiBold' }}>{isCheckedIn ? "Check-Out" : "Check-In"} </Text>
          </TouchableOpacity>
          )
          }
          {expanded && (
            <View style={{ width: '100%', marginTop: 10, backgroundColor: '#fff', padding: 10, borderRadius: 10, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }}>
                <View style={{ flexDirection:'row', paddingVertical:5 }} >
                  <Entypo name="location-pin" size={24} color="#6a8ff3" style={{ flex:.6 }} />
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color="#6a8ff3" style={{ flex:8.4 }} />
                  ) : (
                    <Text style={{ flex:9, color: "#444", fontSize: 14, fontFamily: 'Poppins-Medium' }}>{address ? address[0].formattedAddress : 'Location not available'}</Text>
                  )}
                </View>
                <View style={{ flexDirection:'row', paddingVertical:5 }} >
                  <View style={{ flex:.6 }} ></View>
                  {loadingLocation ? (
                    <></>
                  ) : (
                    location && (
                      <Text style={{ flex:9, color: '#444', fontSize: 14, fontFamily: 'Poppins-Medium', marginBottom: 10 }}>
                        Latitude: {location.coords.latitude},
                        Longitude: {location.coords.longitude}
                      </Text>
                    )
                  )}
                </View>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity onPress={toggleExpand} style={{ flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6a8ff320', borderWidth: 1, borderColor: '#6a8ff3', borderRadius: 6 }}>
                  <Text style={{ color: '#6a8ff3', fontSize: 16, fontFamily: "Poppins-SemiBold" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} disabled={loadingLocation || (!location || !address) || isCheckingOut} style={{  flex: 1, backgroundColor: (!location || !address || loadingLocation || isCheckingOut) ? '#6a8ff380' : '#6a8ff3', height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6a8ff3', borderRadius: 6 }} >
                  {loadingLocation || isCheckingOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: "Poppins-SemiBold" }}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <DashboardCards navigation={navigation} />
        <EmployeeLeaveCard navigation={navigation} />
        <CustomCalendar navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
}
