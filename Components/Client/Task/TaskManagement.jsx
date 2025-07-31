import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, RefreshControl, Alert, ScrollView, Modal, StyleSheet, LayoutAnimation, UIManager, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";

import { AntDesign, Feather, Entypo, Fontisto } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function TaskManagement({ navigation }) {

  const [scale] = useState(new Animated.Value(0)); 

  const [modalVisible, setModalVisible] = useState(false);
  const [deparement, setDepartment] = useState('');
  const [statusD, setStatusD] = useState('');
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

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

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getTaskData = async () => {
    setLoading(true);
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      text: "",
      sort: true,
      status: statusD || "",
      departmentId: deparement || "", 
      isPagination: false
    });
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
  
    fetch(`${BASE_URL}/client/task/list`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          console.log(result.data.docs);
          setTaskData(result.data.docs);
          setFilteredData(result.data.docs);
        } else {
          showToast(result.message);
          setTaskData([]);
          setFilteredData([]);
        }
      })
      .catch((error) => {
        console.error(error);
        setTaskData([]);
        setFilteredData([]);
      })
      .finally(() => {setLoading(false);setInitialLoad(false);});
  };

  const showDefault = async () => {
    setDepartment('');
    setStatusD('');
    setLoading(true);

    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      text: "",
      sort: true,
      status: "",
      departmentId: "",
      isPagination: false
    });
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
  
    fetch(`${BASE_URL}/client/task/list`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
          setTaskData(result.data.docs);
          setFilteredData(result.data.docs);
        } else {
          showToast(result.message);
          setTaskData([]);
          setFilteredData([]);
        }
      })
      .catch((error) => {
        console.error(error);
        setTaskData([]);
        setFilteredData([]);
      })
      .finally(() => setLoading(false));
  };

  const getDepartment = async () => {

    setLoading(true)
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
          // console.log("departmentData....", result.data.docs);
          setDepartmentData(result.data);
          // showToast(result.message);
          setLoading(false);
        }else{
          showToast(result.message);
          setLoading(false);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false))
  }

  // const getStatus = async ()=>{
  //   setLoading(true)
  //   let token = await AsyncStorage.getItem("token");
  //   const myHeaders = new Headers();
  //   myHeaders.append("Authorization", "Bearer " + token);
  //   myHeaders.append("Content-Type", "application/json");
    
  //   const requestOptions = {
  //     method: "POST",
  //     headers: myHeaders,
  //     redirect: "follow"
  //   };
    
  //   fetch(`${BASE_URL}/client/task/statusList`, requestOptions)
  //    .then((response) => response.json())
  //     .then((result) => {
  //       if(result.statusCode === 200){
  //         console.log("Task Status--",result.data);
  //         setStatusData(result.data);
  //         // showToast(result.message);
  //         setLoading(false);
  //       }else{
  //         showToast(result.message);
  //         setLoading(false);
  //       }
  //     })
  //     .catch((error) => console.error(error));
  // }

  useEffect(()=>{
    getTaskData();
    getDepartment();
    // getStatus();
  },[])
  
  // useEffect(() => {
  //   setTimeout(() => {
  //     setLoading(false); 
  //   }, 1000);
  // }, [taskData]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(taskData); 
    } else {
      const results = taskData.filter(item =>
        item.taskName.toLowerCase().includes(text.toLowerCase()) || 
        item.departmentData.name.toLowerCase().includes(text.toLowerCase()) 
      );
      setFilteredData(results);
    }
  };

  const onRefresh = ()=>{
    setRefresh(true)
    getTaskData();
    setTimeout(()=>{
      setRefresh(false);
    },2000)
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Modal
           animationType="slide"
           transparent={true}
           visible={modalVisible}
           onRequestClose={() => {
             // Alert.alert('Modal has been closed.');
             setModalVisible(false);
           }}>
         <TouchableOpacity onPress={()=> setModalVisible(false)} style={{ flex:1, backgroundColor:'#00000090', justifyContent:'flex-end'}}>
            <View style={{ width:'100%', backgroundColor:'#eee', height:500,  borderTopStartRadius:30, borderTopEndRadius:30, padding:15 }} >
            <View style={{ width:60, height:4, backgroundColor:'#b3b3b3', alignSelf:'center', marginTop:20, borderRadius:5 }} ></View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10  }}>
              <Text style={{ fontSize:16, fontWeight:"600", color:'#074173', }}>Filters</Text>
              <TouchableOpacity onPress={() => {setDepartment(''); setStatusD('');showDefault();setModalVisible(false);}} style={{ width:110, paddingHorizontal:10, height:40, backgroundColor:'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:Style.headerBgColor }} >
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Style.primaryTextColor }} >Reset</Text>
              </TouchableOpacity>
            </View>
              <View style={{ width:'100%', flexDirection:'row', gap:10 }} >
              <TouchableOpacity style={{ flex:1, height:50, flexDirection:'row', backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                <SelectDropdown
                  data={departmentData.length === 0 ? [{ name: 'No Departments...' }] : departmentData}
                  onSelect={(selectedDepartment, index) => {
                    setDepartment(selectedDepartment._id); 
                    showToast(`Selected: ${selectedDepartment.name}`);
                  }}
                  renderButton={(selectedDepartment, isOpened) => {
                    return (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>
                          {selectedDepartment ? selectedDepartment.name : 'Select Department'}
                        </Text>
                        <Entypo
                          name={isOpened ? 'chevron-up' : 'chevron-down'}
                          style={styles.dropdownButtonArrowStyle}
                        />
                      </View>
                    );
                  }}
                  renderItem={(departmentData, index, isSelected) => {
                    return (
                      <View
                        style={{
                          ...styles.dropdownItemStyle,
                          ...(isSelected && { backgroundColor: '#D2D9DF' }),
                        }}
                      >
                        <Text style={styles.dropdownItemTxtStyle}>
                          {departmentData.name}
                        </Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </TouchableOpacity>
              <View style={{ flex:1, height:50, flexDirection:'row', backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                <SelectDropdown
                   data={CLIENT_TASK_STATUS_ARR.length === 0 ? ['No data found'] : CLIENT_TASK_STATUS_ARR}
                   onSelect={(CLIENT_TASK_STATUS_ARR, index) => {
                     setStatusD(CLIENT_TASK_STATUS_ARR);
                     showToast(`Selected: ${CLIENT_TASK_STATUS_ARR}`);
                   }}
                   renderButton={(CLIENT_TASK_STATUS_ARR, isOpened) => {
                     return (
                       <View style={styles.dropdownButtonStyle}>
                         <Text style={styles.dropdownButtonTxtStyle}>
                           {(CLIENT_TASK_STATUS_ARR && CLIENT_TASK_STATUS_ARR) || 'Select Status'}
                         </Text>
                         <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                       </View>
                     );
                   }}
                   renderItem={(CLIENT_TASK_STATUS_ARR, index, isSelected) => {
                     return (
                       <View style={{...styles.dropdownItemStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
                         <Text style={styles.dropdownItemTxtStyle}>{CLIENT_TASK_STATUS_ARR?.replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, char => char.toUpperCase())}</Text>
                       </View>
                     );
                   }}
                   showsVerticalScrollIndicator={false}
                   dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>
           </View>
             <TouchableOpacity disabled={!deparement && !statusD} onPress={()=>{setModalVisible(!true);getTaskData()}} style={{ position:'absolute', bottom:80, width:'50%', height:40, backgroundColor: (!deparement && !statusD) ? '#cccccc40' : '#658eff', borderRadius:5, justifyContent:'center', alignItems:'center', alignSelf:'center', elevation:0, marginTop:0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, marginBottom:10 }} >
                <Text style={{ fontWeight:600, fontSize:14, color:(!deparement && !statusD)?'#999':'#fff' }} >Apply</Text>
            </TouchableOpacity>
          </View>
         </TouchableOpacity>
        </Modal>

      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff',fontSize: 14, fontFamily:"Poppins-SemiBold", flex: 1, }}>Task Management</Text>
        </View>
        <View style={{flexDirection: 'row',alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={handleSearch} style={{flex: 9,fontSize: 18,padding: 10,paddingLeft: 20,}} />
            <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={require('../../../assets/oui_search.png')} resizeMode='contain'style={{ width: 20, height: 20,}} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center',alignItems:"flex-end" }}>
             <Feather name="bell" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
             <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
               <Text style={{ flex:1, fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor }}>All Tasks</Text>
                 <View style={{ flexDirection:"row", flex:1, justifyContent:"flex-end" }} >
                   <TouchableOpacity onPress={()=> showDefault()} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                       <Fontisto name="spinner-refresh" size={24} color="gray" />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=> setModalVisible(true)} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                       <Image source={require('../../../assets/menuIcon.png')} resizeMode="contain" style={{ width:30, height:30 }} />
                   </TouchableOpacity>
                 </View>
             </View>
             <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
               {/* Loader shown if data is loading */}
               {loading ? (
                 <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                   <ActivityIndicator size="large" color="#0000ff" />
                 </View>
               ) : (
                    filteredData.length > 0 ?(
                      filteredData.map((item, index) => (
                        <TouchableOpacity
                          onPress={() => { navigation.navigate('TaskSummary', { _id: item._id }) }}
                          key={index}
                          style={{ width: '100%', backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, padding: 10 }}
                        >
                           <View style={{ flex:4, width:'100%' }}>
                             <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 16, fontFamily:'Poppins-SemiBold', color: Style.headerBgColor }}>{item.taskName}</Text>
                           </View>
                    
                          <Text style={{ fontSize: 14, fontWeight: "600", color: Style.secondryTextColor }}>
                            {item.departmentData.name}
                          </Text>
                    
                          <View>
                            <View style={{ flexDirection: 'row', paddingBottom: 10 }}>
                              <Text style={{ fontSize: 16, fontWeight: "600", color: Style.secondryTextColor }}>Code: </Text>
                              <Text style={{ fontSize: 14, fontWeight: "500", color: Style.secondryTextColor }}>{item.code}</Text>
                            </View>
                    
                            {item.assignedEmployeData.map((employee, empIndex) => (
                              <View style={{ flexDirection: 'row' }} key={empIndex}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: Style.secondryTextColor }}>Assigned To: </Text>
                                <Text style={{ fontSize: 12, fontWeight: "500", color: Style.secondryTextColor }}>
                                  {employee.fullName}
                                </Text>
                              </View>
                            ))}
                    
                            <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: Style.secondryTextColor }}>Assigned On: </Text>
                                <Text style={{ fontSize: 12, fontWeight: "500", color: Style.secondryTextColor }}>{moment(item.updatedAt).format('DD/MM/YYYY') || "No DOB available"}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                            onPress={() => { navigation.navigate('TaskSummary', { _id: item._id }) }} 
                            style={{width: '100%', flex:6, 
                                backgroundColor: item.status === "Task_Stop" ? '#E51E1E' : item.status === "Completed" ? '#85BD2A' : item.status === "Assigned" ? '#1AA4FF' : '#eb984e',
                                height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 5, marginTop:10,}} >
                              <Text style={{ fontSize: 14, fontWeight: "600", color: Style.basicbgColor, }}>
                                {/* {item.status === 'Task_Stop' ? 'Stopped' : item.status === 'Completed' ? 'Completed' : item.status === 'Assigned' ? 'In-Progress' : 'Cancelled'} */}
                                {item.status ?.replace(/_/g, ' ')
                                .toLowerCase()
                                .replace(/\b\w/g, char => char.toUpperCase())}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))
                    ):(
                      !initialLoad && (
                        <Text style={{ fontSize: 18, fontFamily:'Poppins-SemiBold', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                          {deparement || statusD ? 'No tasks match your filters.' : 'No task Available.'}
                        </Text>
                      )
                    )
               )}
             </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: Style.basicbgColor,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation:0
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Style.headerBgColor,
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    height:300,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Style.headerBgColor,
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});