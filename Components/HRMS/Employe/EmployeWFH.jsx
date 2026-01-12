import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, Button, ScrollView, FlatList, Modal, TextInput, Alert, Platform, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelectList } from 'react-native-dropdown-select-list';
import CalendarPicker from "react-native-calendar-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import BASE_URL from '../../../Urls/DomainUrl';
import { useEmployeeDashboard } from '../../../Context/EmployeeDashboardContext';

import { AntDesign, FontAwesome, FontAwesome5, Octicons, Entypo, MaterialIcons, SimpleLineIcons, Ionicons } from "@expo/vector-icons";

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

export default function EmployeWFH({ navigation }) {

    const { dashboardData, error } = useEmployeeDashboard();

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
    const [wfhRequest, setWfhRequest] = useState([]);
    const [wfhRequestListData, setWfhRequestListData] = useState([]);
    const [errors, setErrors] = useState({});
    const [filteredWfhData, setFilteredWfhData] = useState([]);
    const [wfhData, setWfhData] = useState([]);
    const [viewModal, setViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingLeaveId, setEditingLeaveId] = useState(null);

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

      const rowsPerPage = 10;
      const [page, setPage] = useState(0);
      const combinedData = [...manualRecords, ...wfhRequestListData];
      const totalPages = Math.ceil(combinedData.length / rowsPerPage);
      const currentData = combinedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
      const headers = [
        'S.No',
        'Reason',
        'WFH Type',
        'Requested Days',
        'Date',
        'Requested At',
        'Approved By',
        'Approved Date',
        'Status',
        'Action',
      ];

      const wfhRequestList = async () => {
        try{
          setLoading(true);
          let token = await AsyncStorage.getItem("authToken");
         if (!token) {
           showToast("Authentication token not found");
           return;
        }
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        const raw = JSON.stringify({
          "branchId": userData?.branchId,
          "companyId": userData?.companyId,
          "employeId": userData?._id,
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
       
        const response = await fetch(`${BASE_URL}/admin/master/others/wfhManager/list`, requestOptions);
        const result = await response.json();
        if(result.statusCode === 200){
          // console.log("WFH List---:", result?.data?.docs);
          const wfhReqOptions = result.data.docs.map(wfhReq => ({
            key: wfhReq._id,
            value: wfhReq.name
          }))
          setWfhRequest(wfhReqOptions);
          const wfhMapping = result.data.docs.reduce((acc, wfh) => {
            acc[wfh.name] = wfh._id;
            return acc;
          }, {});
          setWfhType(wfhMapping);
          setLoading(false);
        }else{
          console.log("WFH List Error---:", result.message);
          setLoading(false);
        }
        }catch(error){
          console.log("WFH List Error---:", error);
          setLoading(false);
        }finally {
          setLoading(false);
        }
      }

      const validateLeaveForm = () => {
        let newErrors = {};
        if (!wfhType) {newErrors.wfhType = "WFH type is required";}
        if (!wfhDate) {newErrors.wfhDate = "Date is required";}
        if (!wfhReason || !wfhReason.trim()) { newErrors.wfhReason = "Reason is required"; }
        if (!workToDo || !workToDo.trim()) {newErrors.workToDo = "Work to do is required";}
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const createWFHRequest = async () => {
        try{
          setLoading(true);
            let token = await AsyncStorage.getItem("authToken");
           if (!token) {
             showToast("Authentication token not found");
             return;
          }
          if (!validateLeaveForm()) {
            return;
          }
          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          myHeaders.append("Authorization", "Bearer " + token);

          const raw = JSON.stringify({
            "branchId": userData?.branchId,
            "companyId": userData?.companyId,
            "directorId": "",
            "employeId": userData?._id,
            "endDate": wfhDate,
            "reason": wfhReason,
            "startDate": wfhDate,
            "status": "pending",
            "wfhManagerId": wfhType,
            "worktodo": workToDo
          });
          
          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };
          console.log("WFH List---:", raw);
          // return;
          
          const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/create`, requestOptions);
          const result = await response.json();
          if(result.statusCode === 200){
            setWfhType('');
            setWfhDate('');
            setWfhReason('');
            setWorkToDo('');
            setEditingLeaveId('');
            showToast(result.message);
            setLoading(false);
            wfhEmployeeList();
            setWfhModal(false);
          }else{
            showToast(result.message);
            setLoading(false);
          }
        }catch(error){
          console.log(error);
          setLoading(false);
        }finally{
          setLoading(false);
        }
      }

      const updateWfhRequest = async () => {
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

        const raw = JSON.stringify({
          "_id": editingLeaveId,
          "branchId": userData?.branchId,
          "companyId": userData?.companyId,
          "directorId": "",
          "employeId": userData?._id,
          "endDate": moment(wfhDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          "reason": wfhReason,
          "startDate":  moment(wfhDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          "status": "pending",
          "wfhManagerId": wfhType,
          "worktodo": workToDo
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        // console.log("WFH RAW DATA---", raw);
        // return;

        const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/update`, requestOptions);
        const result = await response.json();
        if (result.statusCode === 200) {
          
          // Reset form
          setWfhModal(false);
          resetFormFields();
          wfhEmployeeList()
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

      const wfhEmployeeList = async ()=>{
        try{
          setLoading(true);
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
              "branchId": userData?.branchId,
              "companyId": userData?.companyId,
              "directorId": "",
              "employeId": userData?._id,
              "endDate": "",
              "isPagination": true,
              "page": currentPage,
              "limit": limit,
              "sort": true,
              "startDate": "",
              "status": "",
              "text": ""
            });

            const requestOptions = {
              method: "POST",
              headers: myHeaders,
              body: raw,
              redirect: "follow"
            };
            
            const response = await fetch(`${BASE_URL}/admin/employe/wfhRequest/list`, requestOptions);
            const result = await response.json();
            
            if(result.statusCode === 200){
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
              console.log("WFH List Error---:", result.message);
              // If first page fails, try without pagination parameters
              if (currentPage === 1) {
                // Try fetching all data at once
                const rawAll = JSON.stringify({
                  "branchId": userData?.branchId,
                  "companyId": userData?.companyId,
                  "directorId": "",
                  "employeId": userData?._id,
                  "endDate": "",
                  "isPagination": false,
                  "sort": true,
                  "startDate": "",
                  "status": "",
                  "text": ""
                });

                const requestOptionsAll = {
                  method: "POST",
                  headers: myHeaders,
                  body: rawAll,
                  redirect: "follow"
                };
                
                const responseAll = await fetch(`${BASE_URL}/admin/employe/wfhRequest/list`, requestOptionsAll);
                const resultAll = await responseAll.json();
                
                if (resultAll.statusCode === 200) {
                  allData = resultAll.data.docs || resultAll.data || [];
                  hasNextPage = false;
                } else {
                  showToast(resultAll.message || "Failed to fetch WFH requests");
                  hasNextPage = false;
                }
              } else {
                hasNextPage = false;
              }
            }
          }
          
          // console.log("✅ All WFH Request Data loaded:", allData.length, "records");
          setWfhRequestListData(allData);
          setFilteredWfhData(allData);
          setLoading(false);
        }catch(error){
          console.error("Failed to load WFH request data:", error);
          showToast("Error loading WFH requests: " + error.message);
          setLoading(false);
        }
      }

      const filterWfhEmployeeData = (data, start, end, status) => {
        if (!start && !end && !status) {
          setWfhRequestListData(data);
          return;
        }
      
        const filtered = data.filter(item => {
          const itemDate = moment(item.startDate);
      
          // 📅 Date filter
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
      
          // 📌 Status filter
          let statusMatch = true;
          if (status) {
            statusMatch =
              item.status?.toLowerCase() === status.toLowerCase();
          }
      
          return dateMatch && statusMatch;
        });
      
        setWfhRequestListData(filtered);
        setPage(0);
      };
      
      useEffect(() => {
        if (userData) {
          wfhEmployeeList();
        }
      }, [userData]);
      
      useEffect(() => {
        if (userData && (startDate || endDate || selectStatus)) {
          filterWfhEmployeeData(filteredWfhData, startDate, endDate, selectStatus);
        }
      }, [startDate, endDate, selectStatus]);
          
          // Reset all filters
      const handleResetFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectStatus(null);
        setWfhRequestListData(filteredWfhData);
        setPage(0);
      };

        const openEditModal = (item) => {
          // Populate form with existing data
          setEditingLeaveId(item._id);
          setIsEditMode(true);
          setWfhType(item.wfhManagerId?._id);
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
          setWfhType(null);
          setIsEditMode(false);
        };
        
        useEffect(() => {
          wfhRequestList();
          wfhEmployeeList();
        }, [])

      // useEffect(() => {
      //   if (!dashboardData) return;
      
      //   console.log(
      //     'Dashboard Data loaded:',
      //     dashboardData.todayWFHEmployes
      //   );
      // }, [dashboardData]);

      const todayWFHEmployees = dashboardData?.todayWFHEmployes || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>WFH Management</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 }} >
            <EmployeHeader navigation={navigation} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
              <View style={styles.cardContainer}>
                {/* Card Header */}
                <View style={styles.header}>
                  <Text style={styles.headerText}>Employees on WFH</Text>
                  <TouchableOpacity onPress={() => setWfhModal(true)} style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>+ Apply WFH</Text>
                  </TouchableOpacity>
                </View>
                <Modal
                 animationType="slide"
                 transparent={true}
                 visible={wfhModal}
                 onRequestClose={() => {
                   setWfhModal(!wfhModal);
                   resetFormFields();
                 }}>
                 <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#ffffff80', padding:10 }} >
                   <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                      <View>
                        <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginBottom:10 }} >{isEditMode?'Update WFH':'Apply WFH'}</Text>
                      </View>
                      <View>
                      <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >WFH Type</Text>
                       <View style={{ width:'100%', marginBottom:10,}} >
                        <SelectList 
                            setSelected={(val) => {setWfhType(val)
                            setErrors(prev => ({ ...prev, wfhType: null }));
                            }}
                            data={wfhRequest}
                            save="key"
                            placeholder='Select WFH Type'
                        />
                        {errors.wfhType && <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>{errors.wfhType}</Text>}
                       </View>
                      </View>
                      <View>
                      <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', marginBottom:5 }} >WFH Date</Text>
                        <View style={{ width:'100%', marginBottom:0, height:45, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.8, borderRadius:8, borderColor: '#444', }} >
                          <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', color:'#868686', paddingTop:5 }} >{wfhDate? wfhDate : 'Select Date'}</Text>
                          <TouchableOpacity onPress={()=> setWfhDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                            <Text style={{ fontSize:20,}} >📅</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePickerModal
                          isVisible={wfhDateVisible}
                          mode="date"
                          onConfirm={(date) => {
                            const formattedDate = moment(date).format('YYYY-MM-DD');
                            setWfhDate(formattedDate);
                            setErrors(prev => ({ ...prev, wfhDate: null }));
                            setWfhDateVisible(false);
                          }}
                          onCancel={() => setWfhDateVisible(false)}
                          minimumDate={new Date()}
                          is24Hour={false}
                        />
                        {errors.wfhDate && <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>{errors.wfhDate}</Text>}
                      </View>
                      <View style={{ marginTop:5 }} >
                       <Text style={{ paddingLeft:0, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5, color:'#444' }} >WFH Reason</Text>
                       <View style={{ width:'100%', height:45, backgroundColor:'#fff', borderWidth:.8, borderColor: '#444', borderRadius:8, padding:5,  }}>
                          <TextInput value={wfhReason} onChangeText={value=> {setWfhReason(value), setErrors(prev => ({ ...prev, wfhReason: null }))}} placeholder="Reason" placeholderTextColor="#999" style={{ flex:1, backgroundColor:'#fff', borderRadius:5, padding:5, color:"#074173", fontFamily:'Poppins-Mediumkk' }} />
                       </View>
                       {errors.wfhReason && <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>{errors.wfhReason}</Text>}
                      </View>
                      <View style={{ marginTop:5, marginBottom:20 }} >
                       <Text style={{ paddingLeft:0, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5, color:'#444' }} >Work To Do</Text>
                       <View style={{ width:'100%', height:45, backgroundColor:'#fff', borderWidth:.8, borderColor: '#444', borderRadius:8, padding:5,  }}>
                          <TextInput value={workToDo} onChangeText={value=> {setWorkToDo(value), setErrors(prev => ({ ...prev, workToDo: null }))}} placeholder="Work To Do" placeholderTextColor="#999" style={{ flex:1, backgroundColor:'#fff', borderRadius:5, padding:5, color:"#074173", fontFamily:'Poppins-Mediumkk' }} />
                       </View>
                       {errors.workToDo && <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>{errors.workToDo}</Text>}
                      </View>
                      <View style={{ flexDirection:'row', gap:20 }} >
                        <TouchableOpacity onPress={() => {setWfhModal(!wfhModal),resetFormFields()}} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff320', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                          <Text style={{ color:'#6a8ff3', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {isEditMode? updateWfhRequest() : createWFHRequest()}} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff3', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                          <Text style={{ color:'#fff', fontSize:16, fontFamily:"Poppins-SemiBold" }} >{isEditMode? 'Update' : 'Submit'}</Text>
                        </TouchableOpacity>
                      </View>
                   </View>
                 </View>
                </Modal>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  {todayWFHEmployees.length === 0 ? (
                    <Text style={styles.noEmployeesText}>No employees on WFH today</Text>
                  ) : (
                    todayWFHEmployees.map((emp) => (
                      <View key={emp.id} style={styles.employeeContainer}>
                        <View style={styles.avatarContainer}>
                          {
                              emp.profileImage ? (
                                <Image source={{ uri: `https://api.vieasyoffice.com/public/${emp.profileImage}` }} style={{ height: 42, width: 42, borderRadius: 21 }} />
                              ) : (
                                <Text style={styles.avatarText}>{emp.fullName.charAt(0)}</Text>
                              )
                          }
                        </View>
                        <View style={styles.employeeInfo}>
                          <Text style={styles.employeeName}>{emp.fullName}</Text>
                          <Text style={styles.employeeRole}>{emp.email}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
              <View style={{ width:'100%', flexDirection:'row', gap:10, marginBottom:10 }} >
                <View style={{ flex:1, height:40, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:.5, borderRadius:5, borderColor: '#E0E0E0' }} >
                  <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >{startDate?startDate: 'Start Date'}</Text>
                  <TouchableOpacity onPress={() => setStartDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                    <Text style={{ fontSize:25,}} >📅</Text>
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
                  <Text style={{ paddingLeft:5, fontSize:14, fontFamily:'Poppins-Medium', paddingTop:5 }} >{endDate ? endDate: 'End Date'}</Text>
                  <TouchableOpacity onPress={() => setEndDateVisible(true)} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', }} >
                    <Text style={{ fontSize:25,}} >📅</Text>
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
               <View>
                <View style={{ width:'100%', marginBottom:0,}} >
                 <SelectList 
                     setSelected={(val) => setSelectStatus(val)}
                     data={['pending', 'approved', 'rejected']}
                     save="value"
                     placeholder='Select Status'
                 />
                </View>
               </View>
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
                      {
                        loading ? (
                          <View style={{ flex: 1, alignItems: 'center',}}>
                            <ActivityIndicator size="large" color="#007BFF" />
                          </View>
                        ):
                          currentData.length === 0 ? (
                            <View style={{}}>
                              <Text style={{fontSize: 14, fontFamily:'Poppins-SemiBold', color: '#868686',}}>Records not found</Text>
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
                                   <Text style={{width: 140, flexDirection: 'row', justifyContent: 'center',}}>{item.reason}</Text>
                                   <Text style={styles.cell}>{item.wfhManagerData.name}</Text>
                                   <Text style={styles.cell}>{item.wfhManagerData.allowedDays}</Text>
                                   <Text style={styles.cell}>{moment(item.startDate).format('DD-MM-YYYY')}</Text>
                                   <Text style={styles.cell}>{moment(item.createdAt).format('DD-MM-YYYY')}</Text>
                                   <Text style={styles.cell}>{item.updatedBy === null? '-': item.updatedBy}</Text>
                                   <Text style={styles.cell}>{moment(item.updatedAt).format('DD-MM-YYYY')}</Text>
                                   <Text style={{width:140, textAlign: 'center', fontSize: 14, fontFamily: 'Poppins-Medium', color:item.status === 'pending' ? '#FFD230' : item.status === 'approved' ? '#4CAF50' : '#F54927'}}>{item.status === 'pending' ? 'Pending' : item.status === 'approved' ? 'Approved' : 'Rejected'}</Text>
                                   {/* <Text style={styles.cell}>{item.action}</Text> */}
                                   <View style={{ width: 140, flexDirection: 'row', justifyContent: 'center', gap:10 }} >
                                    <TouchableOpacity onPress={()=> {setViewModal(true),setSelectedItem(item);}} style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center', }} >
                                      <FontAwesome name="eye" size={24} color={'#6a8ff3'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={item.status === 'pending' ? () => openEditModal(item) : ()=> showToast('No Action')} style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center', }} >
                                      <FontAwesome5 name="edit" size={20} color={'#6a8ff3'} />
                                    </TouchableOpacity>
                                   </View>
                                   <Modal
                                     animationType="slide"
                                     transparent={true}
                                     visible={viewModal}
                                     onRequestClose={() => {
                                       setViewModal(!viewModal);
                                     }}>
                                     <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#ffffff80', padding:10 }} >
                                       <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                                          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }} >
                                            <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginBottom:10 }} >WFH Request Details</Text>
                                            <TouchableOpacity onPress={() => setViewModal(false)} style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center', }} >
                                              <Ionicons name="close-circle" size={24} color="#6a8ff3" />
                                            </TouchableOpacity>
                                          </View>
                                          {
                                            selectedItem && (
                                              <View>
                                                <View style={{ flexDirection:'row', alignItems:'center'}} >
                                                   <Octicons name="person" size={20} color="black" />
                                                   <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginLeft:10 }} >Employee Information</Text>
                                                </View>
                                                <View style={{ marginTop:10, flexDirection:'row', borderWidth:.5, borderColor:'#e0e0e0', borderRadius:5 }} >
                                                  <View style={{ flex:3 }} >
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Full Name</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Email</Text>
                                                    </View>
                                                  </View>
                                                  <View style={{ flex:7 }} >
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{userData?.fullName}</Text>
                                                   </View>
                                                   <View style={{ padding:8, justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{userData?.email}</Text>
                                                   </View>
                                                  </View>
                                                </View>
                                                <View style={{ flexDirection:'row', alignItems:'center', marginVertical:10 }} >
                                                   <Entypo name="calendar" size={20} color="black" />
                                                   <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginLeft:10 }} >Request Detail</Text>
                                                </View>
                                                <View style={{ flexDirection:'row', borderWidth:.5, borderColor:'#e0e0e0', borderRadius:5 }} >
                                                  <View style={{ flex:5 }} >
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Request Type</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Status</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Date</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Duration</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Reason</Text>
                                                    </View>
                                                  </View>
                                                  <View style={{ flex:5 }} >
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.wfhManagerData?.name}</Text>
                                                   </View>
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:selectedItem?.status === 'pending' ? '#FFD230' : selectedItem?.status === 'approved' ? '#4CAF50' : '#F54927', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.status === 'pending' ? 'Pending' : selectedItem?.status === 'approved' ? 'Approved' : 'Rejected'}</Text>
                                                   </View>
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{moment(selectedItem?.startDate).format('DD-MM-YYYY')}</Text>
                                                   </View>
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.wfhManagerData?.allowedDays}</Text>
                                                   </View>
                                                   <View style={{ padding:3 }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.reason}</Text>
                                                   </View>
                                                  </View>
                                                </View>
                                                <View style={{ flexDirection:'row', alignItems:'center', marginVertical:10 }} >
                                                   <MaterialIcons name="computer" size={20} color="black" />
                                                   <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginLeft:10 }} >WFH Type Information</Text>
                                                </View>
                                                <View style={{ flexDirection:'row', borderWidth:.5, borderColor:'#e0e0e0', borderRadius:5 }} >
                                                  <View style={{ flex:3 }} >
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >WFH Type</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', }} >
                                                      <Text style={{ color:'#888', fontSize:14, fontFamily:'Poppins-SemiBold' }} >Salary %</Text>
                                                    </View>
                                                  </View>
                                                  <View style={{ flex:7 }} >
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.wfhManagerData?.name}</Text>
                                                   </View>
                                                   <View style={{ padding:8, justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:14, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{selectedItem?.wfhManagerData?.perdaySalaryPercent}%</Text>
                                                   </View>
                                                  </View>
                                                </View>
                                                <View style={{ flexDirection:'row', alignItems:'center', marginVertical:10 }} >
                                                   <SimpleLineIcons name="exclamation" size={20} color="black" />
                                                   <Text style={{ color:'#444', fontSize:16, fontFamily:'Poppins-SemiBold', marginLeft:10 }} >System Information</Text>
                                                </View>
                                                <View style={{ flexDirection:'row', borderWidth:.5, borderColor:'#e0e0e0', borderRadius:5 }} >
                                                  <View style={{ flex:3 }} >
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', alignItems:'center' }} >
                                                      <Text style={{ color:'#888', fontSize:12, fontFamily:'Poppins-SemiBold' }} >Created At</Text>
                                                    </View>
                                                    <View style={{ padding:8, borderRightWidth:.5, borderBottomWidth:.5, borderColor:'#e0e0e0', backgroundColor:'#f1f1f160', justifyContent:'center', alignItems:'center' }} >
                                                      <Text style={{ color:'#888', fontSize:12, fontFamily:'Poppins-SemiBold' }} >Last Update</Text>
                                                    </View>
                                                  </View>
                                                  <View style={{ flex:7 }} >
                                                   <View style={{ padding:8, borderBottomWidth:.5, borderColor:"#e0e0e0", justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:12, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{moment(selectedItem?.wfhManagerData?.createdAt).format('MMMM DD, YYYY')}</Text>
                                                   </View>
                                                   <View style={{ padding:8, justifyContent:'center', }} >
                                                     <Text style={{ color:'#444', fontSize:12, fontFamily:'Poppins-Medium', paddingLeft:5 }} >{moment(selectedItem?.wfhManagerData?.updatedAt).format('MMMM DD, YYYY')}</Text>
                                                   </View>
                                                  </View>
                                                </View>
                                              </View>
                                            )
                                          }
                                       </View>
                                     </View>
                                   </Modal>
                                 </View>
                              )}
                            />
                          )
                      }
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
            </ScrollView>
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 16,
      marginTop: 0,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 1,
      borderWidth: 0.5,
      borderColor: '#E0E0E0',
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerText: {
      fontSize: 14,
      color: '#333',
      fontFamily: 'Poppins-SemiBold',
    },
    applyButton: {
      backgroundColor: '#4A90E2',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    applyButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    employeeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      marginRight: 10,
      borderWidth: 0.5,
      borderColor: '#E0E0E0',
      borderRadius: 10,
      padding: 8,
    },
    avatarContainer: {
      height: 42,
      width: 42,
      borderRadius: 21,
      backgroundColor: '#E8F1FD',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontWeight: '700',
      color: '#4A90E2',
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 12,
      color: '#222',
      fontFamily: 'Poppins-SemiBold',
    },
    employeeRole: {
      fontSize: 10,
      color: '#888',
      fontFamily: 'Poppins-Medium',
    },
    leaveDate: {
      fontSize: 12,
      color: '#4A90E2',
      fontWeight: '600',
    },
    noEmployeesText: {
      textAlign: 'center',
      fontSize: 14,
      color: '#888',
      marginTop: 0,
      fontFamily: 'Poppins-Medium',
    },
    container: {
      padding: 0,
      // height:520,
      backgroundColor: '#f2f2f2',
      borderRadius: 10,
      marginBottom: 20,
      marginTop:10,
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