import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Text, StatusBar, Button, ScrollView, Modal, FlatList, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Platform, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import BASE_URL from '../../../Urls/DomainUrl';
// import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";

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

export default function EmployeAttendance({ navigation, route }) {

  const [startDateVisible, setStartDateVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDateVisible, setEndDateVisible] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [selectLeave, setSelectLeave] = useState("");
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null); // "10 Sep 2025"
  const [checkInTime, setCheckInTime] = useState(null); // "09:45 AM"
  // Checkout picker state
  const [isCheckoutPickerVisible, setCheckoutDatePickerVisibility] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [shift, setShift] = useState("");
  const [shiftOptions, setShiftOptions] = useState([]);
  const [shiftMap, setShiftMap] = useState({});
  const [reason, setReason] = useState("");
  // store manual attendance entries added via modal
  const [manualRecords, setManualRecords] = useState([]);
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const rowsPerPage = 10;

  // Leave type mapping
  const leaveTypeMap = {
    'Present': 'present',
    'First Half': 'firstHalf',
    'Second Half': 'secondHalf',
    'Leave': 'leave',
    'Absent': 'absent',
    'OFF': 'off',
    'Holiday': 'holiday'
  };

  // Create array of leave types for dropdown
  const addType = Object.keys(leaveTypeMap);

    useEffect(() => {
      const loadUserData = async () => {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
    
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            // console.log("User Data---:", parsedData);
          }
        } catch (error) {
          console.error("Failed to load userData:", error);
        }
      };
    
      loadUserData();
    }, []);
    const attendanceList = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          console.error("❌ No auth token found");
          ToastAndroid.show("Authentication failed", ToastAndroid.SHORT);
          return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);
        
        let allData = [];
        let currentPage = 1;
        let hasNextPage = true;
        const limit = 50; // Fetch more items per API call for efficiency
        
        // Fetch all pages until no more data
        while (hasNextPage) {
          const raw = JSON.stringify({
            "branchId": userData?.branchId,
            "companyId": userData?.companyId,
            "employeId": userData?._id,
            "endDate": null,
            "isPagination": true,
            "isPresentDay": [],
            "page": currentPage,
            "limit": limit,
            "shift": "",
            "sort": true,
            "startDate": null,
            "status": "",
            "text": "",
            "workType": ""
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };
          
          const response = await fetch(`${BASE_URL}/admin/employe/attendance/list`, requestOptions);
          const result = await response.json();

          if (result.statusCode === 200) {
            const pageData = result.data.docs || result.data || [];
            
            if (pageData.length === 0) {
              hasNextPage = false;
            } else {
              allData = [...allData, ...pageData];
              
              // Check if there are more pages using API response
              hasNextPage = result.data?.hasNextPage !== false;
              
              // If we got less data than limit, it's likely the last page
              if (pageData.length < limit) {
                hasNextPage = false;
              }
              
              // If totalPages is available, use it to determine if more pages exist
              if (result.data?.totalPages) {
                hasNextPage = currentPage < result.data.totalPages;
              }
              
              currentPage++;
            }
          } else {
            console.error("❌ API Error:", result.message);
            // If first page fails, try without pagination parameters
            if (currentPage === 1) {
              // Try fetching all data at once
              const rawAll = JSON.stringify({
                "branchId": userData?.branchId,
                "companyId": userData?.companyId,
                "employeId": userData?._id,
                "endDate": null,
                "isPagination": false,
                "isPresentDay": [],
                "shift": "",
                "sort": true,
                "startDate": null,
                "status": "",
                "text": "",
                "workType": ""
              });

              const requestOptionsAll = {
                method: "POST",
                headers: myHeaders,
                body: rawAll,
                redirect: "follow"
              };
              
              const responseAll = await fetch(`${BASE_URL}/admin/employe/attendance/list`, requestOptionsAll);
              const resultAll = await responseAll.json();
              
              if (resultAll.statusCode === 200) {
                allData = resultAll.data.docs || resultAll.data || [];
                hasNextPage = false;
              } else {
                ToastAndroid.show(resultAll.message || "Failed to fetch attendance", ToastAndroid.SHORT);
                hasNextPage = false;
              }
            } else {
              hasNextPage = false;
            }
          }
        }
        
        // console.log("✅ All Attendance Data loaded:", allData.length, "records");
        setAllAttendanceData(allData);
        filterAttendanceData(allData, startDate, endDate);
      } catch (error) {
        console.error("❌ Network Error:", error);
        ToastAndroid.show("Network request failed: " + error.message, ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
    }
    // Client-side filtering function with dates and leave type
    const filterAttendanceData = (data, start, end, leaveType) => {
      if (!start && !end && !leaveType) {
        setAttendanceData(data);
        // console.log("📊 Showing all records:", data.length);
        return;
      }

      const filtered = data.filter(item => {
        const itemDate = moment(item.attendanceDate).format('DD/MM/YYYY');
        
        // Debug: Log actual API values
        // if (leaveType) {
        //   console.log("🔍 Item isPresentDay:", item.isPresentDay, "Selected:", leaveType, "Mapped:", leaveTypeMap[leaveType]);
        // }

        const itemStatus = item.isPresentDay?.toLowerCase()?.trim();
        const selectedStatus = leaveTypeMap[leaveType]?.toLowerCase()?.trim();
        let dateMatch = true;
        if (start && end) {
          dateMatch = moment(itemDate, 'DD/MM/YYYY').isBetween(
            moment(start, 'DD/MM/YYYY'),
            moment(end, 'DD/MM/YYYY'),
            null,
            '[]'
          );
        } else if (start && !end) {
          dateMatch = moment(itemDate, 'DD/MM/YYYY').isSame(moment(start, 'DD/MM/YYYY'), 'day');
        } else if (end && !start) {
          dateMatch = moment(itemDate, 'DD/MM/YYYY').isSame(moment(end, 'DD/MM/YYYY'), 'day');
        }
        let leaveTypeMatch = true;
        if (leaveType) {
          leaveTypeMatch = itemStatus === selectedStatus;
          // console.log("✅ Match Check - Item:", itemStatus, "Selected:", selectedStatus, "Result:", leaveTypeMatch);
        }

        return dateMatch && leaveTypeMatch;
      });

      // console.log("🔍 Filtered records:", filtered.length, "(Start:", start, "End:", end, "LeaveType:", leaveType, ")");
      // console.log("📊 Items found with status:", data.map(item => item.isPresentDay));
      setAttendanceData(filtered);
      setPage(0);
    };

    useEffect(() => {
      if (userData) {
        attendanceList();
      }
    }, [userData]);

    // Auto-filter when dates change
    useEffect(() => {
      if (userData && (startDate || endDate || selectLeave)) {
        filterAttendanceData(allAttendanceData, startDate, endDate, selectLeave);
      }
    }, [startDate, endDate, selectLeave]);
    
    // Reset all filters
    const handleResetFilters = () => {
      setStartDate(null);
      setEndDate(null);
      setSelectLeave("");
      filterAttendanceData(allAttendanceData, null, null, "");
      ToastAndroid.show("Filters cleared", ToastAndroid.SHORT);
    };

  
    // combine manual records with static data (manual ones first)
    const combinedData = [...manualRecords, ...attendanceData];
    const totalPages = Math.ceil(combinedData.length / rowsPerPage);
    const currentData = combinedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  
    const headers = [
      'S.No',
      'Attendance Date',
      'Check-In Time',
      'Check-Out Time',
      'Worked Hrs (HH:MM)',
      'Pending Hrs (HH:MM)',
      'Overtime Hrs  (HH:MM)',
      'Is WFH',
      'Status',
      'Is Verified',
    ];

    const showDatePicker = () => {
      setDatePickerVisibility(true);
    };
  
    const showCheckoutPicker = () => {
      setCheckoutDatePickerVisibility(true);
    };

    const handleCheckInConfirm = (date) => {
      // Format date
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    
      // Format time
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    
      setCheckInDate(formattedDate);
      setCheckInTime(formattedTime);
    
      setDatePickerVisibility(false);
    };

    const handleCheckOutConfirm = (date) => {
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    
      console.log('✅ Checkout Date Set:', formattedDate);
      console.log('✅ Checkout Time Set:', formattedTime);
    
      setCheckOutDate(formattedDate);
      setCheckOutTime(formattedTime);
      setCheckoutDatePickerVisibility(false);
    };

    const handleManualConfirm = async () => {
      // Validate check-in is required
      if (!checkInDate || !checkInTime) {
        Alert.alert('Validation Error', 'Please pick a date and time for manual check-in.');
        return;
      }

      // Validate reason is required
      if (!reason || reason.trim() === '') {
        Alert.alert('Validation Error', 'Please provide a reason for manual attendance.');
        return;
      }

      // Validate shift is selected
      if (!shift) {
        Alert.alert('Validation Error', 'Please select a shift.');
        return;
      }
    
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          showToast("Authentication failed");
          return;
        }

        // Parse check-in date and time
        const checkInMoment = moment(`${checkInDate} ${checkInTime}`, 'DD MMM YYYY hh:mm:ss A');
        
        // Parse check-out date and time (optional)
        const checkOutMoment = (checkOutTime && checkOutDate) 
          ? moment(`${checkOutDate} ${checkOutTime}`, 'DD MMM YYYY hh:mm:ss A')
          : null;

        // Validate date parsing
        if (!checkInMoment.isValid()) {
          Alert.alert('Error', 'Invalid check-in date/time format');
          console.log('❌ Check-in format error:', checkInDate, checkInTime);
          return;
        }

        if (checkOutMoment && !checkOutMoment.isValid()) {
          Alert.alert('Error', 'Invalid check-out date/time format');
          console.log('❌ Check-out format error:', checkOutDate, checkOutTime);
          return;
        }

        // Validate check-out is after check-in (if provided)
        if (checkOutMoment && checkOutMoment.isBefore(checkInMoment)) {
          Alert.alert('Error', 'Check-out time must be after check-in time');
          return;
        }

        const checkInDateTime = checkInMoment.toISOString();
        const checkOutDateTime = checkOutMoment ? checkOutMoment.toISOString() : null;
        const attendanceDate = checkInMoment.format('YYYY-MM-DD');

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);
        
        const raw = JSON.stringify({
          "attendanceDate": attendanceDate,
          "branchId": userData?.branchId,
          "checkInTime": checkInDateTime,
          "checkOutTime": checkOutDateTime,
          "companyId": userData?.companyId,
          "directorId": null,
          "employeId": userData?._id,
          "employeeName": userData?.fullName,
          "method": "employeReq",
          "reason": reason,
          "shift": shift
        });

        // console.log('📤 Creating Attendance Request:', raw);
        
        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        
        const response = await fetch(`${BASE_URL}/admin/employe/attendance/create`, requestOptions);
        const result = await response.json();

        console.log('📥 API Response:', result);

        if (result.statusCode === 200 || response.ok) {
          // Reset form
          setAttendanceModal(false);
          setCheckInDate(null);
          setCheckInTime(null);
          setCheckOutDate(null);
          setCheckOutTime(null);
          setReason("");
          setShift("");
          
          showToast(result.message || "✅ Attendance added successfully");
          
          // Refresh attendance list
          await attendanceList();
        } else {
          console.error("❌ API Error:", result.message);
          Alert.alert('Error', result.message || "Failed to add attendance");
        }
      } catch (error) {
        console.error("❌ Network Error:", error);
        Alert.alert('Error', "Network error: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    const shiftList = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          console.error("No auth token found for shift list");
          return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);
        
        const raw = JSON.stringify({
          "branchId": userData?.branchId,
          "companyId": userData?.companyId,
          "isActive": true,
          "isPagination": true,
          "text": ""
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };
        
        const response = await fetch(`${BASE_URL}/admin/master/others/timeslot/list`, requestOptions);
        const result = await response.json();

        if (result.statusCode === 200) {
          const shifts = result.data.docs;
          const shiftOptions = shifts.map(shift => ({
            key: shift._id,
            value: shift.shiftName
          }));
          setShiftOptions(shiftOptions);
          const shiftMapping = shifts.reduce((acc, shift) => {
            acc[shift.shiftName] = shift._id;
            return acc;
          }, {});
          setShiftMap(shiftMapping);
        } else {
          console.error("❌ Shift API Error:", result.message);
        }          
      } catch (error) {
        console.error("❌ Shift Network Error:", error);
      }
    }
    useEffect(() => {
      if (userData) {
        shiftList();
      }
    }, [userData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Employe Attendance</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 }} >
            <EmployeHeader navigation={navigation} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, padding:0 }} >
              <View style={{ width:'100%', flexDirection:'row', gap:10, marginBottom:10 }} >
                <View style={{ flex:1, flexDirection:'row', height:40, justifyContent:'space-between', alignItems:'center', borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0' }} >
                  <Text style={{ paddingLeft:10, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:0 }} >{startDate?startDate: 'Start Date'}</Text>
                  <TouchableOpacity onPress={() => setStartDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                    <Text style={{ fontSize:20,}} >📅</Text>
                  </TouchableOpacity>
                   <DateTimePickerModal
                     isVisible={startDateVisible}
                     mode="date"
                     onConfirm={(date) => {
                       const formattedDate = moment(date).format('DD/MM/YYYY');
                       setStartDate(formattedDate);
                       setStartDateVisible(false);
                     }}
                     onCancel={() => setStartDateVisible(false)}
                     is24Hour={false}
                   />
                </View>
                <View style={{ flex:1, flexDirection:'row', height:40, justifyContent:'space-between', alignItems:'center', borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0' }} >
                  <Text style={{ paddingLeft:10, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:0 }} >{endDate ? endDate: 'End Date'}</Text>
                  <TouchableOpacity onPress={() => setEndDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                    <Text style={{ fontSize:20,}} >📅</Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                     isVisible={endDateVisible}
                     mode="date"
                     onConfirm={(date) => {
                       const formattedDate = moment(date).format('DD/MM/YYYY');
                       setEndDate(formattedDate);
                       setEndDateVisible(false);
                     }}
                     onCancel={() => setEndDateVisible(false)}
                     is24Hour={false}
                   />
                </View>
                <View style={{ height:45, justifyContent:'space-between', alignItems:'center', }} >
                <TouchableOpacity onPress={handleResetFilters} style={{ height:40, paddingHorizontal:8, justifyContent:'center', alignItems:'center', backgroundColor: '#6a8ff3', borderRadius: 5 }}>
                  <Text style={{ color: '#fff', fontFamily: 'Poppins-Medium' }}>Reset</Text>
                </TouchableOpacity>
                </View>
              </View>
              <View style={{ width:'100%', marginBottom:10 }} >
                <SelectList 
                    setSelected={(val) => setSelectLeave(val)} 
                    data={addType} 
                    save="value"
                    placeholder='Select Leave Type'
                />
              </View>
            <View style={styles.container}>
              <ScrollView horizontal style={{ marginBottom: 10 }}>
                <View>
                  <View style={styles.row}>
                    {headers.map((header, index) => (
                      <Text key={index} style={[styles.cell, styles.headerCell]}>{header}</Text>
                    ))}
                  </View>

                  {currentData.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#666', fontSize: 16 }}>No records found</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={currentData}
                      keyExtractor={(item) => item._id.toString()}
                      renderItem={({ item, index }) => (
                        <View
                          style={[
                            styles.row,
                            index % 2 === 0 ? styles.evenRow : styles.oddRow,
                          ]}
                        >
                          <Text style={styles.cell}>{page * rowsPerPage + index + 1}</Text>
                          <Text style={styles.cell}>{moment(item.attendanceDate).format('DD-MM-YYYY')}</Text>
                          <Text style={styles.cell}>{item?.checkInTime?moment(item.checkInTime).format('hh:mm A'): '-'}</Text>                   
                          <Text style={styles.cell}>{item.checkOutTime?moment(item.checkOutTime).format('hh:mm A'): '-'}</Text>
                          <Text style={styles.cell}>
                            {item?.checkInTime && item?.checkOutTime
                             ? moment
                                 .utc(
                                   moment(item.checkOutTime).diff(
                                     moment(item.checkInTime)
                                   )
                                 )
                                 .format('HH:mm:ss')
                             : '-'
                            }
                          </Text>                   
                          <Text style={styles.cell}>{!item.pendingHRS || item.pendingHRS === 0 ? "-" : `${Math.floor(item.pendingHRS / 60)}:${(item.pendingHRS % 60).toString().padStart(2, "0")}`}</Text>                  
                          <Text style={styles.cell}>{!item.overtimeHRS || item.overtimeHRS === 0 ? "-" : `${Math.floor(item.overtimeHRS / 60)}:${(item.overtimeHRS % 60).toString().padStart(2, "0")}`}</Text>
                          <Text style={styles.cell}>{item.workType === "work_from_office" ? "No" : "Yes"} </Text>                   
                          <Text style={{width: 175,backgroundColor:item.isPresentDay === "present" ? "#4CAF5040" : item.isPresentDay === "secondHalf" ? "#9C27B020" : item.isPresentDay === "absent" ? "#F5492720" : item.isPresentDay === "off" ? "#80808020" : item.isPresentDay === "firstHalf" ? "#FFD23020" : "#444", 
                            borderColor:item.isPresentDay === "present" ? "#4CAF50" : item.isPresentDay === "secondHalf" ? "#9C27B0" : item.isPresentDay === "absent" ? "#F54927" : item.isPresentDay === "off" ? "#808080" : item.isPresentDay === "firstHalf" ? "#FFD230" : "#444",
                            color:item.isPresentDay === "present" ? "#4CAF50" : item.isPresentDay === "secondHalf" ? "#9C27B0" : item.isPresentDay === "absent" ? "#F54927" : item.isPresentDay === "off" ? "#808080" : item.isPresentDay === "firstHalf" ? "#FFD230" : "#444",
                            borderWidth:1, borderRadius:5, padding: 5, textAlign:'center'}}>{item.isPresentDay === "present" ? "Present" : item.isPresentDay === "secondHalf" ? "Second Half" : item.isPresentDay === "absent" ? "Absent" : item.isPresentDay === "off" ? "Off" : item.isPresentDay === "firstHalf" ? "First Half" : "-"}
                          </Text>
                          <Text style={styles.cell}>{item.status === false ? "No" : "Yes"} </Text>                
                        </View>
                      )}
                    />
                  )}
                </View>
              </ScrollView>
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage((prev) => Math.max(prev - 1, 0))}
                  style={[styles.pageButton, page === 0 && styles.disabledButton]}
                >
                  <Text style={styles.pageText}>Previous</Text>
                </TouchableOpacity>
        
                <Text style={{ marginHorizontal: 10 }}>
                  Page {page + 1} of {totalPages}
                </Text>
        
                <TouchableOpacity
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  style={[styles.pageButton, page === totalPages - 1 && styles.disabledButton]}
                >
                  <Text style={styles.pageText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          <View style={{ width:'100%', height:60, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', padding:20 }} >
            <TouchableOpacity onPress={()=> setAttendanceModal(true)} style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', }} >
                <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >+ Manual Attendance</Text>
            </TouchableOpacity>
             <Modal
               animationType="slide"
               transparent={true}
               visible={attendanceModal}
               onRequestClose={() => {
                setAttendanceModal(!attendanceModal);
               }}>
               <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#ffffff80', padding:10 }} >
                 <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                    <View>
                      <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginBottom:10 }} >Add Manual Attendance</Text>
                    </View>
                    <View>
                    <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >Check-In Date/Time</Text>
                     <View style={{ width:'100%', marginBottom:10, height:40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0' }} >
                       <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', color:'#868686', paddingTop:5 }} >{checkInDate ? `${checkInDate} ${checkInTime ? `- ${checkInTime}` : ''}` : 'Select Check-In Date & Time'}</Text>
                       <TouchableOpacity onPress={showDatePicker} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                         <Text style={{ fontSize:20,}} >📅</Text>
                       </TouchableOpacity>
                     </View>
                    </View>
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="datetime"
                      onConfirm={handleCheckInConfirm}
                      onCancel={() => setDatePickerVisibility(false)}
                      is24Hour={false}
                      minimumDate={new Date()}
                    />
                    <View style={{ marginTop:0 }}>
                      <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >Check-Out Date/Time</Text>
                      <View style={{ width:'100%', marginBottom:0, height:40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0' }} >
                        <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', color:'#868686', paddingTop:5 }} >{checkOutDate ? `${checkOutDate} ${checkOutTime ? `- ${checkOutTime}` : ''}` : 'Select Date & Time'}</Text>
                        <TouchableOpacity onPress={showCheckoutPicker} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                          <Text style={{ fontSize:20,}} >📅</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePickerModal
                        isVisible={isCheckoutPickerVisible}
                        mode="datetime"
                        onConfirm={handleCheckOutConfirm}
                        onCancel={() => setCheckoutDatePickerVisibility(false)}
                        is24Hour={false}
                        minimumDate={new Date()}
                      />
                    </View>
                    <View>
                    <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >Reason</Text>
                    <View style={{ width:'100%', height:45, backgroundColor:'#fff', borderWidth:.5, borderColor: '#E0E0E0', borderRadius:5, marginBottom:10, padding:5,  }}>
                       <TextInput value={reason} onChangeText={value=> setReason(value)} placeholder="Reason" placeholderTextColor="#999" style={{ flex:1, backgroundColor:'#fff', borderRadius:5, padding:5, color:"#074173", fontFamily:'Poppins-Mediumkk' }} />
                    </View>
                    </View>
                    <View>
                    <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >Select Shift</Text>
                     <View style={{ width:'100%', marginBottom:20,}} >
                      <SelectList 
                          setSelected={(val) => setShift(shiftMap[val])}
                          data={shiftOptions}
                          save="value"
                          placeholder='Select Shift'
                      />
                     </View>
                    </View>
                     
                    <View style={{ flexDirection:'row', gap:20 }} >
                      <TouchableOpacity onPress={() => { setAttendanceModal(false)}} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff320', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                        <Text style={{ color:'#6a8ff3', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleManualConfirm} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff3', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                        <Text style={{ color:'#fff', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Confirm</Text>
                      </TouchableOpacity>
                    </View>
                 </View>
               </View>
             </Modal>
          </View>
        </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  modalView: {
    backgroundColor: 'white',
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5, 
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    padding: 0,
    // height:520,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    minHeight: 40,
    alignItems: 'center',
  },
  cell: {
    width: 175, // Adjust width as needed
    paddingHorizontal: 5,
    textAlign: 'center',
    fontSize: 14,
    fontFamily:'Poppins-Medium',
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: '#6a8ff3',
    color: '#fff',
    paddingVertical: 8,
    margin: 0,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#e9e9e9',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pageButton: {
    padding: 10,
    backgroundColor: '#6a8ff3',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  pageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
