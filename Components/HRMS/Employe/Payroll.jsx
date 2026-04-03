import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Button, ScrollView, Modal, FlatList, Platform, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import BASE_URL from '../../../Urls/DomainUrl';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, FontAwesome5, FontAwesome } from "@expo/vector-icons";

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

export default function Payroll({ navigation, route }) {

  const [activeTab, setActiveTab] = useState('StandardPayroll');
  const [manualRecords, setManualRecords] = useState([]);
  const [page, setPage] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standardData, setStandardData] = useState([]);
  const [actualData, setActualData] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
  
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          // Call API functions after userData is set
          await StandardPayList(parsedData);
          await actualPayList(parsedData);
        }
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };

    loadUserData();
  }, []);
    
    const rowsPerPage = 10;
    const combinedStandardData = standardData; 
    const combinedActualData = actualData;
  
    const totalPagesStandard = Math.max(1, Math.ceil(combinedStandardData.length / rowsPerPage));
    const totalPagesActual = Math.max(1, Math.ceil(combinedActualData.length / rowsPerPage));
  
    const currentStandardData = combinedStandardData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const currentActualData = combinedActualData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
     const headersStandard = [
       'S.No',
       'Name',
       'Created By',
       'Base Salary',
       'CTC',
       'Status',
  ];
     const headersActual = [
       'S.No',
       'Employee Name',
       'Start Date',
       'End Date',
       'Basic Salary',
       'Gross Salary',
       'Net Salary',
       'Status',
       'Action',
  ];

  const StandardPayList = async(userDataParam) => {
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem("authToken");
       if (!token) {
         showToast("Authentication token not found");
         setLoading(false);
         setStandardData([]);
         return;
      }

      const myHeaders = new Headers();  
      myHeaders.append("Content-Type", "application/json");  
      myHeaders.append("Authorization", "Bearer " + token);

      const raw = JSON.stringify({
        "branchId": userDataParam?.branchId,
        "companyId": userDataParam?.companyId,
        "directorId": "",
        "employeId": userDataParam?._id,
        "isPagination": false,
        "sort": true,
        "status": "Active",
        "text": ""
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };
// console.log("standard raw data:", raw);
      const response = await fetch(`${BASE_URL}/admin/employe/payroll/standerd/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        // console.log(" fetch Standard Payroll data:", result.data.docs);
        setStandardData(result.data.docs || []);
      } else {
        showToast(result.message || "Failed to fetch Standard Payroll data");
        setStandardData([]);
      }
    } catch (error) {
      console.log("Error fetching Standard Payroll data:", error);
      setStandardData([]);
    } finally {
      setLoading(false);
    }
  }

  const actualPayList = async(userDataParam) => {
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem("authToken");
       if (!token) {
         showToast("Authentication token not found");
         setLoading(false);
         return;
      }

      const myHeaders = new Headers();  
      myHeaders.append("Content-Type", "application/json");  
      myHeaders.append("Authorization", "Bearer " + token);

      const raw = JSON.stringify({
        "branchId": userDataParam?.branchId,
        "companyId": userDataParam?.companyId,
        "directorId": "",
        "employeId": userDataParam?._id,
        "isPagination": false,
        "sort": true,
        "status": "Active",
        "text": ""
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };
// console.log("actual raw data:", raw);
      const response = await fetch(`${BASE_URL}/admin/employe/payroll/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        // console.log(" fetch Actual Payroll data:", result);
        setActualData(result.data.docs || []);
      } else {
        showToast(result.message || "Failed to fetch Actual Payroll data");
        // setLoading(false);
        setActualData([]);
      }
    } catch (error) {
      console.log("Error fetching Actual Payroll data:", error);
      setActualData([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Payroll Management</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, }} >
            {/* <View style={{ padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0', }} >
              <EmployeHeader navigation={navigation} />
            </View> */}
            <View style={{ flexDirection:'row', width:'100%', padding:20, paddingHorizontal:10, }} >
                <TouchableOpacity onPress={() => { setActiveTab('StandardPayroll'); setPage(0); }} style={{ backgroundColor:activeTab == 'StandardPayroll' ? '#6a8ff3' : '#fff', justifyContent:'center', alignItems:'center', paddingVertical:10, paddingHorizontal:20, borderTopStartRadius:6, borderBottomStartRadius:6, borderWidth:.5, borderColor:'#e0e0e0' }} >
                    <Text style={{ color:activeTab == 'StandardPayroll' ? '#FFF' : '#6a8ff3', fontSize:16, fontFamily:"Lato-Medium" }} >Standard Payroll</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setActiveTab('ActualPayroll'); setPage(0); }} style={{ backgroundColor:activeTab == 'ActualPayroll' ? '#6a8ff3' : '#fff', justifyContent:'center', alignItems:'center', paddingVertical:10, paddingHorizontal:20, borderTopEndRadius:6, borderBottomEndRadius:6, borderWidth:.5, borderColor:'#e0e0e0' }} >
                    <Text style={{ color:activeTab == 'ActualPayroll' ? '#FFF' : '#6a8ff3', fontSize:16, fontFamily:"Lato-Medium" }} >Actual Payroll</Text>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex:1, padding:10 }} >
                {
                    activeTab == 'StandardPayroll' ?
                    (<StandardTab data={currentStandardData} headers={headersStandard} page={page} setPage={setPage} totalPages={totalPagesStandard} rowsPerPage={rowsPerPage} loading={loading} />)
                    :
                    (<ActualTab data={currentActualData} navigation={navigation} headers={headersActual} page={page} setPage={setPage} totalPages={totalPagesActual} rowsPerPage={rowsPerPage} loading={loading} />)
                }
            </ScrollView>
          {/* <View style={{ width:'100%', height:60, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', padding:20 }} >
            <TouchableOpacity style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', }} >
                <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Lato-SemiBold" }} >Payroll</Text>
            </TouchableOpacity>
          </View> */}
        </View>
    </SafeAreaView>
  )
}

const StandardTab = ({data, headers, page, setPage, totalPages, rowsPerPage, loading}) => {
  const rpp = rowsPerPage || 10;
  return (
    <View>
        {
          loading ? (<ActivityIndicator size="large" color="#0000ff" />) : data.length === 0 ? (
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
                       data={data}
                       keyExtractor={(item, index) => `${page}-${index}`}
                       renderItem={({ item, index }) => (
                         <View key={`${page}-${index}`}
                           style={[
                             styles.row,
                             index % 2 === 0 ? styles.evenRow : styles.oddRow,
                           ]}
                         >
                          <Text style={styles.cell}>{page * rpp + index + 1}</Text>
                           <Text style={styles.cell}>{item.employeName}</Text>
                           <Text style={styles.cell}>{item.createdBy}</Text>
                           <Text style={styles.cell}>{item.baseSalary === null ? '0' : item.baseSalary}.00 ₹</Text>
                           <Text style={styles.cell}>{item.ctc === null ? '0' : item.ctc}.00 ₹</Text>
                           <Text style={styles.cell}>{item.status}</Text>
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
                 onPress={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                 style={[styles.pageButton, page === totalPages - 1 && styles.disabledButton]}
               >
                 <Text style={styles.pageText}>Next</Text>
               </TouchableOpacity>
             </View>
          </View>
          )
        }
    </View>
  );
}

const ActualTab = ({data, headers, page, setPage, totalPages, rowsPerPage, navigation, loading}) => {
  const rpp = rowsPerPage || 10;
  return (
    <View>
       {
        loading ? (<ActivityIndicator size="large" color="#0000ff" />) : data.length === 0 ? (
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
                      data={data}
                      keyExtractor={(item, index) => `${page}-${index}`}
                      renderItem={({ item, index }) => (
                        <View key={`${page}-${index}`}
                          style={[
                            styles.row,
                            index % 2 === 0 ? styles.evenRow : styles.oddRow,
                          ]}
                        >
                         <Text style={styles.cell}>{page * rpp + index + 1}</Text>
                          <Text style={styles.cell}>{item.employeData.fullName}</Text>
                          <Text style={styles.cell}>{moment(item.startDate).format('DD-MM-YYYY')}</Text>
                          <Text style={styles.cell}>{moment(item.endDate).format('DD-MM-YYYY')}</Text>
                          <Text style={styles.cell}>{item.basicSalary === null ? '0' : item.basicSalary}.00 ₹</Text>
                          <Text style={styles.cell}>{item.grossSalary === null ? '0' : item.grossSalary}.00 ₹</Text>
                          <Text style={styles.cell}>{item.netSalary === null ? '0' : item.netSalary}.00 ₹</Text>
                          <Text style={styles.cell}>{item.status}</Text>
                          <Text style={styles.cell}>
                          <FontAwesome onPress={() => navigation.navigate('EmployePaySlip', {item})} style={{marginRight: 10,}} icon={(item)} name="eye" size={24} color={'#6a8ff3'} />
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
                 onPress={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                 style={[styles.pageButton, page === totalPages - 1 && styles.disabledButton]}
               >
                 <Text style={styles.pageText}>Next</Text>
               </TouchableOpacity>
             </View>
          </View>
        )
       }   
    </View>
  );
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Lato-SemiBold',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  employeeRole: {
    fontSize: 13,
    color: '#888',
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
    fontFamily: 'Lato-Medium',
  },
  container: {
    padding: 0,
    // height:520,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 20,
    marginTop:0,
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


