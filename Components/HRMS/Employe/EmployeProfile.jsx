import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, Text, StatusBar, Button, ScrollView, Modal, FlatList, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions, LayoutAnimation, UIManager, Platform } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import moment from "moment";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { IMAGE_FILEPATH_URL } from '../../../Urls/DomainUrl';
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { UserContext } from '../../../Context/UserProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Entypo, Ionicons, FontAwesome, FontAwesome6, Octicons, MaterialIcons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

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

export default function EmployeProfile({ navigation, route }) {
    const { userData, pickAndUploadImage, isLoading } = useContext(UserContext);
     const [activeTab, setActiveTab] = useState(1);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [onBoardingData, setOnBoardingData] = useState([]);
    const [onBoardingId, setOnBoardingId] = useState(null);
    const [images, setImages] = useState(null);
    const [empData, setEmpData] = useState(null);
    const [localUserData, setLocalUserData] = useState(null);

    const displayUserData = userData || localUserData;

    useEffect(() => {
      const loadUserData = async () => {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
    
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            // console.log("User Data------:", parsedData);
            setOnBoardingId(parsedData?.onboardingId);
            if (!userData) {
              setLocalUserData(parsedData);
            }
          }
        } catch (error) {
          console.error("Failed to load userData:", error);
        }
      };
    
      loadUserData();
    }, [userData]);

    const tabs = [
      { id: 1, label: 'Primary Detail' },
      { id: 2, label: 'Assign Leave' },
      { id: 3, label: 'Salary' },
      { id: 4, label: 'Education' },
      { id: 5, label: 'Past employment' },
      { id: 6, label: 'Family Details' },
      { id: 7, label: 'Emergency Contacts' },
      { id: 8, label: 'Social Links' },
      { id: 9, label: 'Documents' },
      { id: 10, label: 'Bank' },
    ];

    const employeeDetail = async () => {
      try{
        setLoading(true);
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
          "_id": onBoardingId,
        });

        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
          redirect: 'follow'
        };

        const responce = await fetch(`${BASE_URL}/admin/employe/onboarding/detail`, requestOptions);
        const result = await responce.json();
        if(result.statusCode === 200){
          // console.log(result.data);
          setOnBoardingData(result?.data || []);
          setLoading(false);
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

    useEffect(() => {
      if(onBoardingId){
        employeeDetail(onBoardingId);
      }
    },[onBoardingId]);

   const logout = async () => {
     try {
       await AsyncStorage.multiRemove([
         'authToken',
         'userData',
       ]);
   
       navigation.reset({
         index: 0,
         routes: [{ name: 'Splash' }],
       });
     } catch (error) {
       console.log('Logout error:', error);
     }
   };
    
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Employe Profile</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, }} >
            {/* <View style={{ width:'100%', flexDirection:'row', justifyContent:'space-between', padding:10, marginTop:20,}} >
                <Text style={{ color:'#444', fontSize:18, fontFamily:"Lato-SemiBold",}} >Profile</Text>
                <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', gap:5,}} >
                  <Text style={{ color:'#DD3231', fontSize:18, fontFamily:"Lato-SemiBold", }} >Log out</Text>
                  <AntDesign name="logout" size={16} color="#DD3231" />
                </TouchableOpacity>
            </View> */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:20 }} >
            <View style={{ width:'100%', backgroundColor:'#f1f1f190', padding:5, borderRadius:10,  }} >
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', justifyContent:'center', alignItems:'center', marginBottom:0 }} >
                    <View style={{flex:9, flexDirection:'row', alignItems:'center', gap:10, }} >
                      <View style={{ width: 70, height: 70, borderRadius: 6, overflow: 'hidden', borderWidth:.5, borderColor:'#658eff', }} >
                        <Image
                          key={displayUserData?.profileImage}
                          source={
                            displayUserData?.profileImage
                              ? { uri: `${IMAGE_FILEPATH_URL}/${displayUserData.profileImage}` }
                              : require('../../../assets/userIcon.jpeg')
                          }
                          style={{ width: '100%', height: '100%' }}
                        />
                      <TouchableOpacity onPress={pickAndUploadImage} style={{ width:20, height:20, backgroundColor:'#00000060', justifyContent:'center', alignItems:'center', position:'absolute', top:0, right:0, borderRadius:50 }} >
                        <Feather name="edit" size={16} color="#fff" />
                      </TouchableOpacity>
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: '#6a8ff3' }}>{displayUserData?.fullName || 'Name'}</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: '#868686' }}> {displayUserData?.userName || 'User Name'}</Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: '#868686' }}> {displayUserData?.email || 'Email'}</Text>
                      </View>
                    </View>
                    {/* <TouchableOpacity onPress={toggleExpand} style={{flex:.5, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', }} >
                      <Entypo name="chevron-down" size={24} color="#6a8ff3" />
                    </TouchableOpacity> */}
                </View>
            </View>
            <View>
             <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center', marginTop:10, marginBottom:10 }} >
               <TouchableOpacity onPress={() => {navigation.navigate('EmployeIcard')}} style={{ flex:1, borderRadius:6, backgroundColor:'#f1f1f190', justifyContent:'center', alignItems:'center', padding:20 }} >
                 <Ionicons name="id-card" size={25} color="#6a8ff3" />
                 <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: '#6a8ff3', textAlign:'center', paddingTop:8 }}>I-Card</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => navigation.navigate('EmployeChangePass')} style={{ flex:1, borderRadius:6, backgroundColor:'#f1f1f190', justifyContent:'center', alignItems:'center', padding:10 }} >
                 <Ionicons name="lock-closed" size={25} color="#6a8ff3" />
                 <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: '#6a8ff3', textAlign:'center', paddingTop:8 }}>Change Password</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={{ flex:1, borderRadius:6, backgroundColor:'#f1f1f190', justifyContent:'center', alignItems:'center', padding:20 }} >
                 <AntDesign name="logout" size={25} color="#6a8ff3" />
                 <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: '#6a8ff3', textAlign:'center', paddingTop:8 }}>Log out</Text>
                 <Modal
                   animationType="slide"
                   transparent={true}
                   visible={logoutModalVisible}
                   onRequestClose={() => {
                    setLogoutModalVisible(!logoutModalVisible);
                   }}>
                   <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#00000060', padding:10 }} >
                     <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                        <View style={{ padding:20 }} >
                          <Text style={{ color:'#444', fontSize:16, fontFamily:'Lato-SemiBold', textAlign:'center', marginBottom:10 }} >Are you sure you want to log out?</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:20 }} >
                          <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff320', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                            <Text style={{ color:'#6a8ff3', fontSize:16, fontFamily:"Lato-SemiBold" }} >Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {setLogoutModalVisible(false), logout()}} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff3', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                            <Text style={{ color:'#fff', fontSize:16, fontFamily:"Lato-SemiBold" }} >Confirm</Text>
                          </TouchableOpacity>
                        </View>
                     </View>
                   </View>
                 </Modal>
               </TouchableOpacity>
             </View>
            </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:0 }} >
              <View style={{ flexDirection:'row', gap:5, justifyContent:'space-between', marginBottom:0, padding:10 }} >
               {tabs.map(tab => {
                 const isActive = activeTab === tab.id;
                 return (
                   <TouchableOpacity key={tab.id}
                     onPress={() => setActiveTab(tab.id)} style={{
                       backgroundColor: isActive ? '#6a8ff3' : '#6a8ff320',
                       paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5,
                       borderWidth: isActive ? 0 : 1,
                       borderColor: '#6a8ff3',}}>
                     <Text style={{ color: isActive ? '#fff' : '#6a8ff3', fontSize: 14,fontFamily: 'Lato-SemiBold', paddingTop:0,}}> {tab.label} </Text>
                   </TouchableOpacity>
                 );
               })}
              </View>
             </ScrollView>
              {/* Tab Content */}
              <View style={{  }} > 
                {activeTab === 1 && 
                    <View>
                      <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Primary Details</Text>
                      <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                      <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Personal Information</Text>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginTop:10, marginBottom:6 }} >
                          <Ionicons name="person" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Full Name</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.fullName === null? 'N/A' : onBoardingData?.fullName}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10 }} >
                          <Ionicons name="person" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Department</Text>
                          <Text style={{ flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.departmentData?.name === null? 'N/A' : onBoardingData?.departmentData?.name}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10 }} >
                          <FontAwesome name="building" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Designation</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.designationData?.name === null? 'N/A' : onBoardingData?.designationData?.name}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="mail" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Email</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.email === null? 'N/A' : onBoardingData?.email}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="mail" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Office Email</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.officeEmail === null? 'N/A' : onBoardingData?.officeEmail}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="call" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Mobile</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >+91 {onBoardingData?.mobile?.number === null? 'N/A' : onBoardingData?.mobile?.number}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="mail" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Reporting Person</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.reportingPersonName === null? 'N/A' : onBoardingData?.reportingPersonName}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <FontAwesome name="birthday-cake" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Date of Birth</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.dateOfBirth == null? 'N/A' : moment(onBoardingData?.generalInfo?.dateOfBirth).format('DD-MM-YYYY')}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <FontAwesome6 name="life-ring" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Marital Status</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.maritalStatus === null? 'N/A' : onBoardingData?.generalInfo?.maritalStatus}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="calendar" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Date of Joining</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.dateOfJoining == null? 'N/A' : moment(onBoardingData?.generalInfo?.dateOfJoining).format('DD-MM-YYYY')}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="transgender-sharp" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Gender</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.gender === null? 'N/A' : onBoardingData?.generalInfo?.gender}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Ionicons name="transgender-sharp" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Blood Group</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.bloodGroup === null? 'N/A' : onBoardingData?.generalInfo?.bloodGroup}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Entypo name="v-card" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Select Probation</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.generalInfo?.probationPeriod === null? 'N/A' : onBoardingData?.generalInfo?.probationPeriod}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, alignItems:'center',  marginBottom:10 }} >
                          <Entypo name="v-card" size={16} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Work Type</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.workType === null? 'N/A' : onBoardingData?.workType}</Text>
                        </View>
                        <View style={{ flexDirection:'row', gap:5,  marginBottom:10 }} >
                          <FontAwesome name="address-card" size={14} color="#6a8ff3" />
                          <Text style={{ width:'35%', fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Primary Address</Text>
                          <Text style={{flex:1, fontSize:12, fontFamily:"Lato-Medium", color:'#444' }} >{onBoardingData?.addresses?.primary?.street === null? 'N/A' : onBoardingData?.addresses?.primary?.street}</Text>
                        </View>
                        <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:10, borderWidth:.5, borderColor:'#e0e0e0' }} >
                        <View style={{ flexDirection:'row', gap:5, justifyContent:'space-between', marginBottom:10 }} >
                        <View style={{flex:1, flexDirection:'row', gap:5,}} >
                            <Ionicons name="location-sharp" size={12} color="#6a8ff3" />
                            <View>
                              <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Country</Text>
                              <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', }} >{onBoardingData?.addresses?.primary?.country === null? 'N/A' : onBoardingData?.addresses?.primary?.country}</Text>
                            </View>
                          </View>
                        <View style={{flex:1, flexDirection:'row', gap:5,}} >
                        <Ionicons name="location-sharp" size={12} color="#6a8ff3" />
                            <View style={{ alignItems:'flex-start' }} >
                              <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >State</Text>
                              <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', }} >{onBoardingData?.addresses?.primary?.state === null? 'N/A' : onBoardingData?.addresses?.primary?.state}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={{ flexDirection:'row', gap:5, justifyContent:'space-between', marginBottom:10 }} >
                          <View style={{flex:1, flexDirection:'row', gap:5,}} >
                          <Ionicons name="location-sharp" size={12} color="#6a8ff3" />
                              <View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >City</Text>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', }} >{onBoardingData?.addresses?.primary?.city === null? 'N/A' : onBoardingData?.addresses?.primary?.city}</Text>
                              </View>
                            </View>
                          <View style={{flex:1, flexDirection:'row', gap:5,}} >
                          <Ionicons name="location-sharp" size={12} color="#6a8ff3" />
                              <View style={{ alignItems:'flex-start' }} >
                                <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Pincode</Text>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', }} >{onBoardingData?.addresses?.primary?.pinCode === null? 'N/A' : onBoardingData?.addresses?.primary?.pinCode}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                }
                {activeTab === 2 && 
                <>
                <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Assign Leave</Text>
                {
                  onBoardingData.assignLeaves.map((item, index)=>{
                    return(
                      <View key={index} >
                       <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                         <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Leave Details {index + 1}</Text>
                         <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                         <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                           <View style={{ flex:1 }} >
                             <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                               <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                               <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Financial Start Date</Text>
                             </View>
                             <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.financStartDate === null? 'N/A' : moment(item.financStartDate).format('DD-MM-YYYY')}</Text>
                           </View>
                           <View style={{ flex:1 }} >
                             <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                               <FontAwesome name="building" size={12} color="#6a8ff3" />
                               <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Financial End Date</Text>
                             </View>
                             <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.financEndDate === null? 'N/A' : moment(item.financEndDate).format('DD-MM-YYYY')}</Text>
                           </View>
                         </View>
                         <View style={{ flexDirection:'row', gap:5, alignItems:'center',}} >
                           <View style={{ flex:1 }} >
                             <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                               <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                               <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Selected leave Policy</Text>
                             </View>
                             <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.leavePolicy === null? 'N/A' : item.leavePolicy}</Text>
                           </View>
                           <View style={{ flex:1 }} >
                             <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                               <FontAwesome name="building" size={12} color="#6a8ff3" />
                               <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Selected leave Name</Text>
                             </View>
                             <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.leaveTypeName === null? 'N/A' : item.leaveTypeName}</Text>
                           </View>
                         </View>
                         </View>
                       </View>
                     </View>
                    )
                  })
                }
                </>
                }
                {activeTab === 3 &&
                <View>
                  <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Salary</Text>
                  <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                    <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Salary Details</Text>
                    <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                    <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                      <View style={{ flex:1 }} >
                        <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                          <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                          <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Current CTC</Text>
                        </View>
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{onBoardingData?.salaryData?.currentPackage === null? 'N/A' : onBoardingData?.salaryData?.currentPackage}</Text>
                      </View>
                      <View style={{ flex:1 }} >
                        <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                          <FontAwesome name="building" size={12} color="#6a8ff3" />
                          <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Last Increment Date</Text>
                        </View>
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{onBoardingData?.salaryData?.lastIncrementDate === null? 'N/A' : moment(onBoardingData?.salaryData?.lastIncrementDate).format('DD-MM-YYYY')}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection:'row', gap:5, justifyContent:'space-between', alignItems:'center',}} >
                      <View style={{ flex:1 }} >
                        <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                          <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                          <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Next Increment</Text>
                        </View>
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{onBoardingData?.salaryData?.nextIncrementDate === null? 'N/A' : moment(onBoardingData?.salaryData?.nextIncrementDate).format('DD-MM-YYYY')}</Text>
                      </View>
                      <View style={{ flex:.5 }} >
                        <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                          <FontAwesome name="building" size={12} color="#6a8ff3" />
                          <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Is ESIC</Text>
                        </View>
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{onBoardingData?.salaryData?.isESIC === true? 'True' : 'False'}</Text>
                      </View>
                      <View style={{ flex:.5 }} >
                        <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                          <FontAwesome name="building" size={12} color="#6a8ff3" />
                          <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Is PF</Text>
                        </View>
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{onBoardingData?.salaryData?.isPF === true? 'True' : 'False'}</Text>
                      </View>
                    </View>
                    </View>
                  </View>
                </View>
                }
                {activeTab === 4 &&
                <View>
                  <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Education</Text>
                  {
                    onBoardingData?.educationDetails.length === 0 ?
                    (
                      <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Data Found</Text>
                      </View> 
                    ):(
                      onBoardingData.educationDetails.map((item, index) => {
                        return (
                          <View key={index} style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                            <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Education Details {index +1}</Text>
                            <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                            <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Ionicons name="document" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Degree</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.degree === null? 'N/A' : item.degree}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Entypo name="graduation-cap" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >University</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.university === null? 'N/A' : item.university}</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Ionicons name="calendar" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >From</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.from === null? 'N/A' : moment(item.from).format('DD-MM-YYYY')}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Ionicons name="calendar" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >To</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.to === null? 'N/A' : moment(item.to).format('DD-MM-YYYY')}</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection:'row', gap:5, alignItems:'center',}} >
                              <View style={{ flex:.9 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <FontAwesome name="percent" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Percentage/Grade</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.number === null? 'N/A' : item.number}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Entypo name="graduation-cap" size={14} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Specification</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.specification === null? 'N/A' : item.specification}</Text>
                              </View>
                            </View>
                            </View>
                          </View>
                        )
                      })
                    )                      
                  }
                </View>
                }
                {activeTab === 5 &&
                <View>
                  <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Past Employment</Text>
                  {
                    onBoardingData?.employementDetails.length === 0 ?
                    (
                      <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                        <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Data Found</Text>
                      </View> 
                    ):(
                      onBoardingData.employementDetails.map((item, index)=>{
                        return(
                          <View key={index} style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                            <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Employment Details</Text>
                            <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                            <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Octicons name="organization" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Organization Name</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.organizationName === null? 'N/A' : item.organizationName}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Entypo name="graduation-cap" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Designation</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.designationName === null? 'N/A' : item.designationName}</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:0}} >
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Ionicons name="calendar" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >From</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.from === null? 'N/A' : moment(item.from).format('DD-MM-YYYY')}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <Ionicons name="calendar" size={12} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >To</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.to === null? 'N/A' : moment(item.to).format('DD-MM-YYYY')}</Text>
                              </View>
                              <View style={{ flex:1 }} >
                                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                  <MaterialIcons name="attach-money" size={14} color="#6a8ff3" />
                                  <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Annual CTC</Text>
                                </View>
                                <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.annualCTC === null? 'N/A' : item.annualCTC}</Text>
                              </View>
                            </View>
                            </View>
                          </View>
                        )
                      })
                    )
                  }
                </View>
                }
                {activeTab === 6 && 
                 <>
                 <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Family Details</Text>
                 {
                   onBoardingData.familyDetails.length === 0?(
                     <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                      <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Records found</Text>
                     </View>
                   ):(
                    onBoardingData.familyDetails.map((item, index)=>{
                      return(
                        <View key={index} >
                         <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                           <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Family Details {index + 1}</Text>
                           <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Relationship Type</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.relation === null? 'N/A' : item.relation}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Name</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.name === null? 'N/A' : item.name}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center',}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Age</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.age === null? 'N/A' : item.age}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="call" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Mobile</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >+91 {item.contactNumber.number === null? 'N/A' : item.contactNumber.number}</Text>
                             </View>
                           </View>
                           </View>
                         </View>
                       </View>
                      )
                    })
                   )
                 }
                 </>
                }
                {activeTab === 7 && 
                 <>
                 <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Emergency Contacts</Text>
                 {
                   onBoardingData.emergencyContact.length === 0?(
                     <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                      <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Records found</Text>
                     </View>
                   ):(
                    onBoardingData.emergencyContact.map((item, index)=>{
                      return(
                        <View key={index} >
                         <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                           <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Emergency Contacts {index + 1}</Text>
                           <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Name</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.name === null? 'N/A' : item.name}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Relationship</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.relationship === null? 'N/A' : item.relationship}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center',}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person-outline" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Email</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.email === null? 'N/A' : item.email}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="call" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Mobile</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >+91 {item.mobile.number === null? 'N/A' : item.mobile.number}</Text>
                             </View>
                           </View>
                           </View>
                         </View>
                       </View>
                      )
                    })
                   )
                 }
                 </>
                }
                {activeTab === 8 && 
                 <>
                 <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Social Links</Text>
                 {
                   onBoardingData.socialLinks.length === 0?(
                     <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                      <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Records found</Text>
                     </View>
                   ):(
                    onBoardingData.socialLinks.map((item, index)=>{
                      return(
                        <View key={index} >
                         <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                           <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Social Links {index + 1}</Text>
                           <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Entypo name="link" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >{item.name === null? 'N/A' : item.name}</Text>
                               </View>
                               <Text style={{ fontSize:10, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.link === null? 'N/A' : item.link}</Text>
                             </View>
                           </View>
                           </View>
                         </View>
                       </View>
                      )
                    })
                   )
                 }
                 </>
                }
                {activeTab === 9 && 
                 <>
                 <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Documents</Text>
                 {
                   onBoardingData.documentData.length === 0?(
                     <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                      <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Records found</Text>
                     </View>
                   ):(
                    onBoardingData.documentData.map((item, index)=>{
                      return(
                        <View key={index} >
                         <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                           <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Documents {index + 1}</Text>
                           <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Entypo name="link" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Document Type</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.name === null? 'N/A' : item.name}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Entypo name="link" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >documents Number</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.number === null? 'N/A' : item.number}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Entypo name="link" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Uploaded  Document</Text>
                               </View>
                               <TouchableOpacity style={{ marginLeft:20, width: 50, height: 50, borderRadius: 5, overflow: 'hidden' }}>
                                 <Image
                                   source={
                                     item?.filePath
                                       ? { uri: `${IMAGE_FILEPATH_URL}/${item.filePath}` }
                                       : require('../../../assets/user.png')
                                   }
                                   style={{ width: '100%', height: '100%' }}
                                 />
                               </TouchableOpacity>
                             </View>
                           </View>
                           </View>
                         </View>
                       </View>
                      )
                    })
                   )
                 }
                 </>
                }
                {activeTab === 10 && 
                 <>
                 <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', paddingVertical:10 }} >Bank</Text>
                 {
                   onBoardingData.bankData.length === 0?(
                     <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                      <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', textAlign:'center' }} >No Records found</Text>
                     </View>
                   ):(
                    onBoardingData.bankData.map((item, index)=>{
                      return(
                        <View key={index} >
                         <View style={{ width:'100%', padding:10,backgroundColor:'#f1f1f190', borderRadius:6, marginVertical:0 }} >
                           <Text style={{ fontSize:16, fontFamily:"Lato-SemiBold", color:'#6a8ff3', }} >Bank {index + 1}</Text>
                           <View style={{ width:'100%', padding:10, backgroundColor:'#fff', borderRadius:6, borderWidth:.5, borderColor:'#e0e0e0', marginVertical:10 }} >
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <Ionicons name="person" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Bank Holder Name</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.bankholderName === null? 'N/A' : item.bankholderName}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <FontAwesome name="building" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Bank Name</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.bankName === null? 'N/A' : item.bankName}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <FontAwesome name="building" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Branch Name</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.branchName === null? 'N/A' : item.branchName}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <FontAwesome name="building" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Account Number</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.accountNumber === null? 'N/A' : item.accountNumber}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                               <FontAwesome name="building" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >IFSC Code</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.ifscCode === null? 'N/A' : item.ifscCode}</Text>
                             </View>
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <FontAwesome name="building" size={12} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Account Type</Text>
                               </View>
                               <Text style={{ fontSize:12, fontFamily:"Lato-Medium", color:'#444', paddingLeft:20 }} >{item.accountType === null? 'N/A' : item.accountType}</Text>
                             </View>
                           </View>
                           <View style={{ flexDirection:'row', gap:5, alignItems:'center', marginBottom:10}} >
                             <View style={{ flex:1 }} >
                               <View style={{ flexDirection:'row', alignItems:'center', gap:5 }} >
                                 <MaterialCommunityIcons name="file-plus" size={14} color="#6a8ff3" />
                                 <Text style={{ fontSize:12, fontFamily:"Lato-SemiBold", color:'#444' }} >Uploaded Document</Text>
                               </View>
                               <TouchableOpacity style={{ marginLeft:20, width: 50, height: 50, borderRadius: 5, overflow: 'hidden' }}>
                                 {
                                   !item.filePath || item.filePath.length === 0 ? (
                                     <MaterialCommunityIcons name="file-plus" size={55} color="#6a8ff3" />
                                   ) : (
                                     <Image
                                       source={{
                                         uri: `${IMAGE_FILEPATH_URL}/${item.filePath}`,
                                       }}
                                       style={{ width: '100%', height: '100%' }}
                                     />
                                   )
                                 }
                               </TouchableOpacity>
                             </View>
                           </View>
                           </View>
                         </View>
                       </View>
                      )
                    })
                   )
                 }
                 </>
                }
              </View>
            </ScrollView>
          {/* <View style={{ width:'100%', height:60, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', padding:20 }} >
            <TouchableOpacity style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', }} >
                <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Lato-SemiBold" }} ></Text>
            </TouchableOpacity>
          </View> */}
        </View>
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
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
});