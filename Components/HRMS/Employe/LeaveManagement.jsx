import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Button, ScrollView, FlatList, Modal, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions, Platform } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from 'react-native-dropdown-select-list';
import CalendarPicker from "react-native-calendar-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import BASE_URL from '../../../Urls/DomainUrl';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";

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

export default function LeaveManagement({ navigation }) {

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

      const rowsPerPage = 10;
      const [page, setPage] = useState(0);
      const combinedData = [...manualRecords, ...leaveRequestListData];
      const totalPages = Math.ceil(combinedData.length / rowsPerPage);
      const currentData = combinedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
      const headers = [
        'S.No',
        'Name',
        'Request Days',
        'Reason',
        'From Date',
        'From Date Type',
        'To Date',
        'To Date Type',
        'Updated At',
        'Updated By',
        'Remark',
        'Status',
        'Action',
      ];

      // useEffect(() => {
      //   if (userData) {
      //     leaveList();
      //   }
      // }, [userData]);

      useEffect(() => {
        const loadUserData = async () => {
          try {
            const storedUserData = await AsyncStorage.getItem('userData');
      
            if (storedUserData) {
              const parsedData = JSON.parse(storedUserData);
              setUserData(parsedData);
              leaveRequestData(parsedData);
              leaveList(parsedData);
              // console.log("User Data---:", parsedData);
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
          // console.log("Leave List API Success:", result);
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
        }else{
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
        const limit = 50; // Fetch more items per API call for efficiency
        
        // Fetch all pages until no more data
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
            console.error("Leave Request API Error:", result.message);
            // If first page fails, try without pagination parameters
            if (currentPage === 1) {
              // Try fetching all data at once
              const rawAll = JSON.stringify({
                "branchId": userData?.branchId,
                "companyId": userData?.companyId,
                "employeId": userData?._id,
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
              } else {
                showToast(resultAll.message || "Failed to fetch leave requests");
                hasNextPage = false;
              }
            } else {
              hasNextPage = false;
            }
          }
        }
        
        // console.log("✅ All Leave Request Data loaded:", allData.length, "records");
        setLeaveRequestListData(allData);
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
            return;
          }

        const myHeaders = new Headers();  
        myHeaders.append("Content-Type", "application/json");  
        myHeaders.append("Authorization", "Bearer " + token);

        // Prepare dates based on single or multiple days
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

        // console.log("Apply Leave Request Payload:", raw);
        // return;

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        const response = await fetch(`${BASE_URL}/admin/employe/leaveRequest/create`, requestOptions);
        const result = await response.json();
        if (result.statusCode === 200) {
          // console.log("Leave Request Apply API Success:", result);
          
          // Reset form
          setModalVisible(false);
          setSelectDate(null);
          setSelDayType(null);
          setFromDate(null);
          setFromDateType(null);
          setToDate(null);
          setToDateType(null);
          setLeaveType(null);
          setReason('');
          setSelectedDays('Single');
          
          leaveRequestData();
          showToast(result.message || "Leave request submitted successfully");
          setLoading(false);
          leaveRequestData();
        }else{
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
            return;
          }

        const myHeaders = new Headers();  
        myHeaders.append("Content-Type", "application/json");  
        myHeaders.append("Authorization", "Bearer " + token);

        // Prepare dates based on single or multiple days
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
        // console.log("Update Leave Request Payload:", raw);
        // return;
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
          
          // Reset form
          setModalVisible(false);
          resetFormFields();
          
          leaveRequestData();
          showToast(result.message || "Leave request updated successfully");
          setLoading(false);
        }else{
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
        // Populate form with existing data
        setEditingLeaveId(item._id);
        setIsEditMode(true);
        setReason(item.reason);
        setLeaveType(item.leaveTypeId);
        
        // Determine if single or multiple day leave
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
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Leave Management</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 }} >
            {/* <EmployeHeader navigation={navigation} /> */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
                <View style={styles.cardContainer}>
                  {/* Card Header */}
                  <View style={styles.header}>
                    <Text style={{ color: '#444', fontSize: 16, fontFamily: 'Lato-SemiBold' }}>Leave Summary</Text>
                    <TouchableOpacity onPress={()=> setModalVisible(true)} style={styles.applyButton}>
                      <Text style={styles.applyButtonText}>+ Add Leave Request</Text>
                    </TouchableOpacity>
                  </View>
                   <Modal
                     animationType="slide"
                     transparent={true}
                     visible={modalVisible}
                     onRequestClose={() => {
                       setModalVisible(!modalVisible);
                       resetFormFields();
                     }}>
                     <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#00000060', padding:10 }} >
                       <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                        <Text style={{ color:'#444', fontSize:16, fontFamily:'Lato-SemiBold', marginBottom:10 }} >
                          {isEditMode ? 'Edit Leave Request' : 'Apply Leave'}
                        </Text>
                        {!isEditMode && (
                          <>
                            <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Available Leaves</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }} >
                              <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between', marginBottom:10 }} >
                                {
                                  leaveListData.map((leave, index) => (
                                    <View key={index} style={{ backgroundColor: '#6a8ff3', paddingHorizontal:10, paddingVertical:4, borderRadius: 5 }} >
                                      <Text style={{ color: '#fff', fontSize: 14, fontFamily: "Lato-SemiBold" }}>{leave.leaveTypeData.name} : {leave.availableLeaves}</Text>
                                    </View>
                                  ))
                                }
                              </View>
                            </ScrollView>
                          </>
                        )}
                        <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Single or Multiple Days</Text>
                          <View style={{ width:'100%', marginBottom:10,}} >
                            <SelectList 
                                setSelected={(val) => {setSelectedDays(val)
                                setErrors(prev => ({ ...prev, selectedDays: null }));
                                }}
                                data={['Single', 'Multiple']}
                                save="value"
                                placeholder='Select Days'
                            />
                            {errors.selectedDays && (
                              <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', marginTop: 5 }}>
                                {errors.selectedDays}
                              </Text>
                            )}
                          </View>
                          <View>
                          <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Leave Type</Text>
                           <View style={{ width:'100%', marginBottom:10,}} >
                            <SelectList 
                                setSelected={(val) => {
                                  setLeaveType(val);
                                  setErrors(prev => ({ ...prev, leaveType: null }));
                                }}
                                data={leaveTypeOptions}
                                save="key"
                                placeholder='Select Leave Type'
                            />
                            {errors.leaveType && (
                              <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', marginTop: 5 }}>
                                {errors.leaveType}
                              </Text>
                            )}
                           </View>
                          </View>
                         <View style={{ width:'100%', padding:10, borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0', marginBottom:10 }} >
                            {
                                selectedDays === 'Single' ? (
                                    <View>
                                     <View>
                                      <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Select Date</Text>
                                        <View style={{ width:'100%', marginBottom:0, height:45, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.8, borderRadius:8, borderColor: '#444', marginBottom:0 }} >
                                          <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Lato-Medium', color:'#868686', paddingTop:5 }} >{selectDate? selectDate : 'Select Date'}</Text>
                                          <TouchableOpacity onPress={()=> setSelectedDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                                            <Text style={{ fontSize:20,}} >📅</Text>
                                          </TouchableOpacity>
                                        </View>
                                        <DateTimePickerModal
                                          isVisible={selectedDateVisible}
                                          mode="date"
                                          onConfirm={(date) => {
                                            const formattedDate = moment(date).format('DD/MM/YYYY');
                                            const today = moment().format('DD/MM/YYYY');
                                            const currentTime = moment();
                                            const cutoffTime = moment('14:00', 'HH:mm');
                                            // Check if selected date is today and current time is after 1:40 PM
                                            if (formattedDate === today && currentTime.isAfter(cutoffTime)) {
                                              setIsFirstHalfDisabled(true);
                                              // Auto-reset day type if firstHalf was already selected
                                              if (selDayType === 'firstHalf') {
                                                setSelDayType(null);
                                                showToast("First Half is not available for today");
                                              }
                                            } else {
                                              setIsFirstHalfDisabled(false);
                                            }
                                            setSelectDate(formattedDate);
                                            // Clear error when date is selected
                                            setErrors(prev => ({ ...prev, selectDate: null }));
                                            setSelectedDateVisible(false);
                                          }}
                                          onCancel={() => setSelectedDateVisible(false)}
                                          minimumDate={new Date()}
                                          is24Hour={false}
                                        />
                                        {errors.selectDate && (
                                          <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', }}>
                                            {errors.selectDate}
                                          </Text>
                                        )}
                                      </View>
                                      <View style={{ marginTop:10 }} >
                                      <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Day Type</Text>
                                       <View style={{ width:'100%', marginBottom:0,}} >
                                        <SelectList 
                                            setSelected={(val) => {setSelDayType(val)
                                            setErrors(prev => ({ ...prev, selDayType: null }));
                                            }}
                                            data={isFirstHalfDisabled ? ['secondHalf', 'fullDay'] : ['firstHalf', 'secondHalf', 'fullDay']}
                                            save="value"
                                            placeholder='Select Days'
                                        />
                                        {errors.selDayType && (
                                          <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', }}>
                                            {errors.selDayType}
                                          </Text>
                                        )}
                                       </View>
                                      </View>
                                    </View>
                                ) : (
                                    <View>
                                        <View>
                                         <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >From Date</Text>
                                           <View style={{ width:'100%', marginBottom:0, height:45, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.8, borderRadius:8, borderColor: '#444', }} >
                                             <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Lato-Medium', color:'#868686', paddingTop:5 }} >{fromDate? fromDate : 'From Date'}</Text>
                                             <TouchableOpacity onPress={()=> setFromDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                                               <Text style={{ fontSize:20,}} >📅</Text>
                                             </TouchableOpacity>
                                           </View>
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
                                              <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', marginTop: 5 }}>
                                                {errors.fromDate}
                                              </Text>
                                           )}
                                         </View>
                                         <View style={{ marginTop:10 }} >
                                         <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Day Type</Text>
                                          <View style={{ width:'100%', marginBottom:10,}} >
                                           <SelectList 
                                               setSelected={(val) => {setFromDateType(val)
                                               setErrors(prev => ({ ...prev, fromDateType: null }));
                                               }}
                                               data={multipleLeaveDefaultDayTypes}
                                               save="value"
                                               placeholder='Select Days'
                                           />
                                           {errors.fromDateType && (
                                             <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', }}>
                                               {errors.fromDateType}  
                                             </Text>
                                           )}
                                          </View>
                                         </View>
                                        <View>
                                         <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >To Date</Text>
                                           <View style={{ width:'100%', marginBottom:0, height:45, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.8, borderRadius:8, borderColor: '#444', }} >
                                             <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Lato-Medium', color:'#868686', paddingTop:5 }} >{toDate? toDate : 'To Date'}</Text>
                                             <TouchableOpacity onPress={()=> {
                                               if (!fromDate) {
                                                 showToast("Please select From Date first");
                                                 return;
                                               }
                                               setToDateVisible(true);
                                             }} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                                               <Text style={{ fontSize:20,}} >📅</Text>
                                             </TouchableOpacity>
                                           </View>
                                           <DateTimePickerModal
                                             isVisible={toDateVisible}
                                             mode="date"
                                             onConfirm={(date) => {
                                               const formattedToDate = moment(date).format('DD/MM/YYYY');
                                               const fromDateMoment = moment(fromDate, 'DD/MM/YYYY');
                                               const toDateMoment = moment(formattedToDate, 'DD/MM/YYYY');
                                               
                                               // Check if toDate is same or before fromDate
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
                                              <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', marginTop: 5 }}>      
                                                {errors.toDate}       
                                              </Text> 
                                            )}
                                         </View>
                                         <View style={{ marginTop:10 }} >
                                         <Text style={{ color:'#444', fontSize:14, fontFamily:'Lato-Medium', marginBottom:5 }} >Day Type</Text>
                                          <View style={{ width:'100%', marginBottom:0,}} >
                                           <SelectList 
                                               setSelected={(val) => {setToDateType(val)
                                               setErrors(prev => ({ ...prev, toDateType: null }));
                                               }}
                                               data={multipleLeaveDefaultDayTypes}
                                               save="value"
                                               placeholder='Select Days'
                                           />
                                            {errors.toDateType && (
                                              <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', }}>      
                                                {errors.toDateType}       
                                              </Text> 
                                            )}
                                          </View>
                                         </View>
                                    </View>
                                )
                            }
                         </View>
                          <View>
                           <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Lato-Medium', paddingTop:5 }} >Reason</Text>
                           <View style={{ width:'100%', height:45, backgroundColor:'#fff', borderWidth:.8, borderColor: '#444', borderRadius:8, marginBottom:0, padding:5,  }}>
                              <TextInput value={reason} onChangeText={value=> { setReason(value),setErrors(prev => ({ ...prev, reason: null }));}} placeholder="Reason" placeholderTextColor="#999" style={{ flex:1, backgroundColor:'#fff', borderRadius:5, padding:5, color:"#074173", fontFamily:'Lato-Mediumkk' }} />
                           </View>
                           {errors.reason && (
                             <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Lato-Regular', marginTop: 5 }}>
                               {errors.reason}
                             </Text>
                           )}
                          </View>
                          <View style={{ flexDirection:'row', gap:20, marginTop:30 }} >
                            <TouchableOpacity onPress={() => {
                              setModalVisible(!modalVisible);
                              resetFormFields();
                            }} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff320', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                              <Text style={{ color:'#6a8ff3', fontSize:16, fontFamily:"Lato-SemiBold" }} >Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={isEditMode ? updateleaveRequest : applyleaveRequest} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff3', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                              <Text style={{ color:'#fff', fontSize:16, fontFamily:"Lato-SemiBold" }} >
                                {isEditMode ? 'Update' : 'Submit'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                       </View>
                     </View>
                   </Modal>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 10 }}>
                    {
                      loadingLeaveList ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',}}>
                          <ActivityIndicator size="large" color="#007BFF" />
                        </View>
                      ):(
                          leaveListData === null || leaveListData.length === 0 ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 100, width: Dimensions.get('window').width - 80 }}>
                              <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#868686' }}>No Leave Data Available</Text>
                            </View>
                          ) : (
                            leaveListData.map((leave, index) => {
                              const pctAvailable = Math.round(((leave.totalLeaves - leave.usedLeaves) / (leave.totalLeaves || 1)) * 100);
                              return (
                                <View key={index} style={styles.leaveCard}>
                                  <View style={styles.leaveCardHeader}>
                                    <View style={styles.leaveIcon}>
                                      <Text style={styles.leaveIconText}>🏖️</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                      <Text style={styles.leaveTypeText}>{leave.leaveTypeData?.name}{leave.leaveTypeData.isPaid === true ? ' PL' : ''}</Text>
                                      <Text style={styles.leaveRemaining}>{leave.totalLeaves} days available</Text>
                                    </View>
                                  </View>
        
                                  <View style={styles.leaveProgressBar}>
                                    <View style={[styles.leaveProgressFill, { width: `${pctAvailable}%` }]} />
                                  </View>
        
                                  <View style={styles.leaveStatsRow}>
                                    <View style={styles.leaveStat}>
                                      <Text style={styles.leaveStatLabel}>Total</Text>
                                      <Text style={styles.leaveStatValue}>{leave.totalLeaves}</Text>
                                    </View>
                                    <View style={styles.leaveStat}>
                                      <Text style={styles.leaveStatLabel}>Used</Text>
                                      <Text style={styles.leaveStatValue}>{leave.usedLeaves}</Text>
                                    </View>
                                    <View style={styles.leaveStat}>
                                      <Text style={styles.leaveStatLabel}>Available</Text>
                                      <Text style={styles.leaveStatValue}>{leave.availableLeaves}</Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })
                          )
                      )
                    }
                  </ScrollView>
                </View>
                {
                  loadingLeaveRequest ? (<ActivityIndicator size="large" color="#0000ff" />) : currentData.length === 0 ? (
                    <View style={{ width:'100%', justifyContent:'center', alignItems:'center', padding:20, }} >
                         <View style={{ width:100, height:100 }} >
                          <Image
                            source={require('../../../assets/Images/notFound.png')}
                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                          />
                        </View>
                        <Text style={{fontSize: 28, fontFamily:'Lato-SemiBold', color: '#868686',}}>Ooos !</Text>
                        <Text style={{fontSize: 14, fontFamily:'Lato-SemiBold', color: '#868686',}}>Records not found</Text>
                      </View>
                  ) : (
                    <View style={styles.container}>
                        <ScrollView horizontal style={{ marginBottom: 10 }}>
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
                                  keyExtractor={(item) => item._id.toString()}
                                  renderItem={({ item, index }) => (
                                    <View
                                      style={[
                                        styles.row,
                                        index % 2 === 0 ? styles.evenRow : styles.oddRow,
                                      ]}
                                    >
                                      <Text style={styles.cell}>{ page * rowsPerPage + index + 1}</Text>
                                      <Text style={styles.cell}>{ item.employeData.fullName}</Text>
                                      <Text style={styles.cell}>{ item.requestDays}</Text>
                                      <Text style={styles.cell}>{ item.reason}</Text>
                                      <Text style={styles.cell}>{ moment(item.startDate).format('YYYY-MM-DD')}</Text>
                                      <Text style={styles.cell}>{ item.type === 'Single'? item.subType : item.startDateBreakDown}</Text>
                                      <Text style={styles.cell}>{ moment(item.endDate).format('YYYY-MM-DD')}</Text>
                                      <Text style={styles.cell}>{ item.type === 'Single'? item.subType : item.endDateBreakDown}</Text>
                                      <Text style={styles.cell}>{ moment(item.updatedAt).format('YYYY-MM-DD hh:mm a')}</Text>
                                      <Text style={styles.cell}>{ item.updatedBy === null? '-': item.updatedBy}</Text>
                                      <Text style={styles.cell}>{ item.remark === null? '-': item.remark}</Text>
                                      <Text style={{width:140, textAlign: 'center', fontSize: 14, fontFamily: 'Lato-Medium', color:item.status === 'Pending' ? '#FFD230' : item.status === 'Approved' ? '#4CAF50' : '#F54927'}}>{item.status === 'Pending' ? 'Pending' : item.status === 'Approved' ? 'Approved' : 'Rejected'}</Text>
                                      <Text style={styles.cell}>
                                          <FontAwesome5 onPress={item.status === 'Pending' ? () => openEditModal(item) : ()=> showToast('No Action')} name="edit" size={18} color={item.status === 'Pending' ? '#6a8ff3' : '#444'} />
                                      </Text>
                                    </View>
                                  )}
                                />
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
                         onPress={() =>
                           setPage((prev) => Math.min(prev + 1, totalPages - 1))
                         }
                         style={[
                           styles.pageButton,
                           page === totalPages - 1 && styles.disabledButton,
                         ]}
                       >
                         <Text style={styles.pageText}>Next</Text>
                       </TouchableOpacity>
                      </View>
                    </View>
                  )
                }
            </ScrollView>
            {/* <TouchableOpacity style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', }} >
                <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Lato-SemiBold" }} >Request Leave</Text>
            </TouchableOpacity> */}
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
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        marginTop: 0,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 1,
        borderWidth: 0.5,
        borderColor: '#E0E0E0',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
      },
      applyButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
      },
      applyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
      },
      card: {
        flex:1,
        padding: 15,
        marginRight: 12,
        backgroundColor: "#f1f1f1",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 3,
      },
      cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#4c72d9",
        marginBottom: 10,
        textAlign: "center",
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        gap: 20,
      },
      label: {
        fontSize: 14,
        color: "#666",
      },
      value: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#4c72d9",
      },

      container: {
        padding: 0,
        // height:520,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        marginBottom: 20,
        marginTop:20,
      },
      row: {
        flexDirection: 'row',
        minHeight: 40,
        alignItems: 'center',
      },
      cell: {
        width: 140, // Adjust width as needed
        paddingHorizontal: 5,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Lato-Medium',
      },
      headerCell: {
        fontWeight: 'bold',
        backgroundColor: '#6a8ff3',
        color: '#fff',
        paddingVertical: 8,
        margin: 0,
        fontFamily: 'Lato-SemiBold',
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
      // New styles for modern leave cards
      leaveCard: {
        width: 220,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 1,
        borderWidth: 0.5,
        borderColor: '#f0f2f7',
      },
      leaveCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      leaveIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#f0f6ff',
        justifyContent: 'center',
        alignItems: 'center',
      },
      leaveIconText: {
        fontSize: 22,
      },
      leaveTypeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
      },
      leaveRemaining: {
        fontSize: 12,
        color: '#6a8ff3',
        marginTop: 4,
      },
      leaveProgressBar: {
        height: 8,
        backgroundColor: '#f1f4fb',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 12,
      },
      leaveProgressFill: {
        height: '100%',
        backgroundColor: '#6a8ff3',
      },
      leaveStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
      },
      leaveStat: {
        alignItems: 'center',
        flex: 1,
      },
      leaveStatLabel: {
        fontSize: 12,
        color: '#888',
      },
      leaveStatValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginTop: 4,
      },
});

