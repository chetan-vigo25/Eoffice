import React, { useState, useEffect, } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, RefreshControl, ScrollView, Modal, StyleSheet, LayoutAnimation, UIManager, Platform, StatusBar, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown'
import moment from "moment";
import DatePicker from 'react-native-modern-datepicker';
import dayjs from 'dayjs';
// import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AntDesign, Feather, Entypo, Ionicons, Fontisto } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from '../../../Urls/DomainUrl';

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function TransactionList({ navigation }) {
 
  const [scale] = useState(new Animated.Value(0)); 
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  // const [deparement, setDepartment] = useState('');
  // const [expanded, setExpanded] = useState(false);
  // const [modalHeight, setModalHeight] = useState(250);
  
  const [statusD, setStatusD] = useState('');
  const [startDate, setStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [transHistory, setTransHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const statusData = ['Paid', 'PendingPayment']

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const getTransList = async () => {
    setLoading(true)
     let token = await AsyncStorage.getItem("token");
     const myHeaders = new Headers();
     myHeaders.append("Authorization", "Bearer " + token);
     myHeaders.append("Content-Type", "application/json");

     const raw = JSON.stringify({
       "text": "",
       "sort": true,
       "status": statusD || "",
       "departmentId": "",
       "isPagination": false,
       "date": startDate || "",
     });

     const requestOptions = {
       method: "POST",
       headers: myHeaders,
       body: raw,
       redirect: "follow"
     };
     
     fetch(`${BASE_URL}/client/invoice/payment/history`, requestOptions)
      .then((response) => response.json())
       .then((result) => {
        if(result.statusCode === 200){
          // console.log("Payment History", result?.data[0]?.allTransactions);
          setTransHistory(result?.data?.docs);
          setFilteredData(result?.data?.docs);
          setLoading(false);
        }else{
          showToast(result.message);
          setLoading(false);
          setTransHistory([]);
          setFilteredData([]);
        }
       })
       .catch((error) => {
        setTaskData([]);
        setFilteredData([]);
        console.error(error)})
       .finally(() => setLoading(false));
  }

  const showDefault = async () => {
      setLoading(true)
      setStartDate('');
      setStatusD('');
       let token = await AsyncStorage.getItem("token");
       const myHeaders = new Headers();
       myHeaders.append("Authorization", "Bearer " + token);
       myHeaders.append("Content-Type", "application/json");
  
       const raw = JSON.stringify({
         "text": "",
         "sort": true,
         "status": "",
         "departmentId": "",
         "isPagination": false,
         "date": "",
       });
  
       const requestOptions = {
         method: "POST",
         headers: myHeaders,
         body: raw,
         redirect: "follow"
       };
       
       fetch(`${BASE_URL}/client/invoice/payment/history`, requestOptions)
        .then((response) => response.json())
         .then((result) => {
          if(result.statusCode === 200){
            // console.log("Invoice List", result.data.docs);
            setTransHistory(result?.data?.docs);
            setFilteredData(result?.data?.docs);
            setLoading(false);
          }else{
            showToast(result.message);
            setLoading(false);
            setTransHistory([]);
            setFilteredData([]);
          }
         })
         .catch((error) => {
          setTransHistory([]);
          setFilteredData([]);
          console.error(error)})
         .finally(() => setLoading(false));
    }

   const handleSearch = (text) => {
    setSearchQuery(text); 
 
    if (text.trim() === '') {
      setFilteredData(transHistory);
    } else {
      const results = transHistory.filter(item => {
        const invoiceMatch = String(item.invoiceNumber || '').toLowerCase().includes(text.toLowerCase());
        const receiptMatch = String(item.receiptNumber || '').toLowerCase().includes(text.toLowerCase());
        return invoiceMatch || receiptMatch;
      }); 
 
      setFilteredData(results);
    }
  };

  useEffect(()=>{
    getTransList();
  },[])

  const onChange = (event, selectedDate) => {
    setDatePickerVisibility(Platform.OS === 'ios'); // keep showing on iOS if needed
    if (selectedDate) {
      setStartDate(selectedDate);
      setDatePickerVisibility(false);
      setModalVisible1(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getTransList();
    },[])
  );

  const onRefresh = () => {
      setRefresh(true);
      getTransList();
      setTimeout(() => {
          setRefresh(false);
      }, 2000);
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
             setModalVisible(false)
           }}>
         <TouchableOpacity onPress={()=> setModalVisible(false)} style={{ flex:1, backgroundColor:'#00000080', justifyContent:'flex-end'}}>
            <View style={{ width:'100%', backgroundColor:'#eee', height:400,  borderTopStartRadius:30, borderTopEndRadius:30, padding:15 }} >
            <View style={{ width:60, height:4, backgroundColor:'#b3b3b3', alignSelf:'center', marginTop:20, borderRadius:5 }} ></View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 }} >
            <Text style={{ fontSize:16, fontWeight:"600", color:'#074173', }}>Filters</Text>
             <TouchableOpacity onPress={()=> {showDefault();setModalVisible(false)}} style={{ width:110, paddingHorizontal:10, height:40, backgroundColor:'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:Style.headerBgColor }} >
               <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Style.primaryTextColor }} >Reset</Text>
             </TouchableOpacity>
            </View>
              <View style={{ width:'100%', flexDirection:'row', gap:10 }} >
                <View style={{ flex:1, height:50, flexDirection:'row', borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                   <SelectDropdown
                      data={statusData.length === 0 ? ['No data found'] : statusData}
                      onSelect={(statusData, index) => {
                        setStatusD(statusData);
                      }}
                      renderButton={(statusData, isOpened) => {
                        return (
                          <View  style={styles.dropdownButtonStyle}>
                             <Text style={styles.dropdownButtonTxtStyle}>
                               {(statusData && statusData) || 'Select Status'}
                             </Text>
                             <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                          </View>
                        );
                      }}
                      renderItem={(statusData, index, isSelected) => {
                        return (
                          <View style={{...styles.dropdownItemStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
                            <Text style={styles.dropdownItemTxtStyle}>{statusData}</Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                   />
                 </View>
                 <View style={{ flex:1, height:50, flexDirection:'row', backgroundColor:Style.basicbgColor, borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                  <View style={{ width:'100%', height:50, borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:0, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                    <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                      <Text style={{ color:Style.headerBgColor, fontWeight:'600', fontSize:12 }}>{startDate ? moment(startDate).format('DD/MM/YYYY') : 'Select Date'}</Text>
                    </View>
                    <TouchableOpacity onPress={()=> {setModalVisible1(true),setDatePickerVisibility(true)}} style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                       <Feather name="calendar" size={20} color={Style.basicTextColor} />
                     </TouchableOpacity>
                  </View>
               </View>
              </View>
              <TouchableOpacity disabled={!startDate && !statusD} onPress={()=> {setModalVisible(false);getTransList();setStartDate('')}} style={{ width:'50%', height:40, backgroundColor: (!startDate && !statusD) ? '#cccccc40' : '#658eff', borderRadius:5, justifyContent:'center', alignItems:'center', alignSelf:'center', elevation:0, marginTop:0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, marginBottom:10 }} >
                  <Text style={{ fontWeight:600, fontSize:14, color:(!startDate && !statusD)?'#999':'#fff' }} >Apply</Text>
              </TouchableOpacity>
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible1}
            onRequestClose={() => setModalVisible1(!modalVisible1)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setModalVisible1(!modalVisible1)} style={styles.closeButton}>
                    <Ionicons name="close-sharp" size={32} color='#fff' />
                  </TouchableOpacity>
                </View>
                {isDatePickerVisible && (
                   <DateTimePicker
                    value={startDate ? new Date(startDate) : new Date()}
                     mode="date"
                     display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                     onChange={onChange}
                   />
                 )}
              </View>
            </View>
          </Modal>
         </TouchableOpacity>
        </Modal>
        
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Transaction History</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor, borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={handleSearch} style={{flex: 9, fontSize: 18,padding: 10,paddingLeft: 20,}} />
             <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
               <Image source={require('../../../assets/oui_search.png')} resizeMode='contain'style={{ width: 20, height: 20,}} />
             </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center', alignItems:"flex-end" }}>
             <Feather name="bell" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
           <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
              <Text style={{ flex:1, fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor }}>All Transaction</Text>
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
               <View>
                  {
                    loading ? (
                       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                          <ActivityIndicator size="large" color="#0000ff" />
                       </View>
                    ):(
                      filteredData && filteredData.length > 0 ? (
                        filteredData.map((item, index) => {
                              return (
                                <View key={index} onPress={() => {navigation.navigate('TransDetail', { _id: item._id })}} style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, marginBottom:10, padding:10 }} >
                                  <View style={{ width:"100%", flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center' }} >
                                    <Text style={{ flex:8, fontSize:16, fontWeight:"500", color:Style.headerBgColor }}>{item.type ==="Advance"?`Advance: ${item.invoiceNumber}`:`Inv: ${item.invoiceNumber}`}</Text>
                                      <TouchableOpacity onPress={()=> {navigation.navigate('TransDetail', {_id:item._id})}} style={{ flex:2, width:100, backgroundColor:item.status ==='Paid'? '#85BD2A':'#E51E1E', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                          <Text style={{ fontSize:14, fontWeight:"600", color:Style.basicbgColor }}>{item.status==='Paid'? 'Paid':'Unpaid'}</Text>
                                      </TouchableOpacity>
                                  </View>
                                   <View style={{ flexDirection:'row', paddingVertical:5, alignItems:'center' }}>
                                      <Text style={{ fontSize:16, fontWeight:"600", color:Style.secondryTextColor }}>Rs : </Text>
                                      <Text style={{ fontSize:14, fontWeight:"500", color:Style.secondryTextColor }}>{item.grandTotal}/-</Text>
                                   </View>
                                   <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                     <View style={{ flexDirection:'row', alignItems:'center' }}>
                                        <Text style={{ fontSize:14, fontWeight:"600", color:Style.secondryTextColor }}>Date : </Text>
                                        <Text style={{ fontSize:12, fontWeight:"500", color:Style.secondryTextColor }}>{moment(item.updatedAt).format('DD/MM/YYYY')}</Text>
                                     </View>
                                     <View style={{ width:30, height:30, justifyContent:'center', alignItems:'center' }} >
                                         <Image source={require('../../../assets/shareIcon.png')} resizeMode="contain" style={{ width:25, height:25 }} />
                                     </View>
                                   </View>
                                </View>
                              );
                          })
                      ) : (
                          <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                              {startDate || statusD ? 'No tasks match your filters.' : 'No Transactions Available.'}
                          </Text>
                      )
                    )
                  }
               </View>
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
   modalBackground: {
    flex: 1,
    backgroundColor: '#00000095',
    justifyContent: "center",
    padding: 10,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Style.primaryBgColor,
    padding: 0,
    borderRadius: 5,
  },
  modalHeader: {
    width: '100%',
    height: 50,
    backgroundColor: Style.headerBgColor,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    padding: 10,
  },
  modalTitle: {
    fontFamily: 'Roboto-Bold',
    color: "#fff",
    fontSize: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});