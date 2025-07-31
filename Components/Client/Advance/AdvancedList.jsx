import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, ScrollView, Modal, StyleSheet, LayoutAnimation, UIManager, Platform, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import DatePicker from 'react-native-modern-datepicker';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AntDesign, Feather, Ionicons, Fontisto } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function AdvancedList({ navigation }) {
 
  const [scale] = useState(new Animated.Value(0)); 
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advanceData, setAdvanceData] = useState([]);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isDatePickerVisible2, setDatePickerVisibility2] = useState(false);

  const statusData = ['Paid', 'Unpaid']

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getAdvanceList = async () => {
    setLoading(true);
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": "",
      "isPagination": false,
      "startDate": startDate,
      "endDate": endDate
    });
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    
    try {
      const response = await fetch(`${BASE_URL}/client/advance/list`, requestOptions);
      const result = await response.json();
  
      if (result.statusCode === 200) {
        const data = result.data.docs || [];
        // console.log("advance...", data);
        setAdvanceData(data);
        setFilteredData(data);
        // Show message if no data
        if (data.length === 0) {
          showToast("No data found for the selected date range.");
        }
  
      } else {
        showToast(result.message || "Something went wrong.");
        setAdvanceData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch data.");
      setAdvanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };
  
  const showDefault = async () => {
    setLoading(true)
    setStartDate('');
    setEndDate('');
    let token = await AsyncStorage.getItem("token");
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
  
    const raw = JSON.stringify({
      "text": "",
      "sort": true,
      "status": "",
      "isPagination": false,
      "startDate": "",
      "endDate": "",
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/advance/list`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
        if (result.statusCode === 200) {
            // console.log("advance...",result.data.docs);
            setAdvanceData(result.data.docs);
            setFilteredData(result.data.docs);
            setLoading(false)
        }else{
          showToast(result.message);
          setLoading(false)
          setAdvanceData([]);
          setFilteredData([]);
        }
      })
      .catch((error) =>{
        setAdvanceData([])
        setFilteredData([])
        console.error(error)})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getAdvanceList();
  },[])

  const onChange = (event, selectedDate) => {
    setDatePickerVisibility(Platform.OS === 'ios'); // keep showing on iOS if needed
    if (selectedDate) {
      setStartDate(selectedDate);
      setDatePickerVisibility(false);
      setModalVisible1(false);
    }
  };
  const onChange2 = (event, selectedDate) => {
    setDatePickerVisibility(Platform.OS === 'ios'); // keep showing on iOS if needed
    if (selectedDate) {
      setEndDate(selectedDate);
      setDatePickerVisibility2(false);
      setModalVisible2(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(advanceData); // Show all tasks when the search is cleared
    } else {
      const results = advanceData.filter(item =>
        item.receiptNumber.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      getAdvanceList();
    },[])
  );

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
         <TouchableOpacity onPress={()=> setModalVisible(false)} style={{ flex:1, backgroundColor:'#00000080', justifyContent:'flex-end'}}>
            <View style={{ width:'100%', backgroundColor:'#eee', height:300,  borderTopStartRadius:30, borderTopEndRadius:30, padding:15 }} >
            <View style={{ width:60, height:4, backgroundColor:'#b3b3b3', alignSelf:'center', marginTop:20, borderRadius:5 }} ></View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 }} >
             <Text style={{ fontSize:16, fontWeight:"600", color:'#074173', }}>Filters</Text>
              <TouchableOpacity onPress={()=> {showDefault();setModalVisible(false)}} style={{ width:110, paddingHorizontal:10, height:40, backgroundColor:'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:Style.headerBgColor }} >
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-Medium', color: Style.primaryTextColor }} >Reset</Text>
              </TouchableOpacity>
             </View>
              <View style={{ width:'100%', flexDirection:'row', gap:10 }} >
                <View style={{ flex:1, height:50, flexDirection:'row', backgroundColor:Style.basicbgColor, borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                   <View style={{ width:'100%', height:50, borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:0, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                     <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                       <Text style={{ color:Style.headerBgColor, fontWeight:'600', fontSize:12 }}>{startDate ? moment(startDate).format('DD/MM/YYYY') : 'From'}</Text>
                     </View>
                     <TouchableOpacity onPress={() => {setModalVisible1(true),setDatePickerVisibility(true)}} style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                       <Feather name="calendar" size={20} color={Style.basicTextColor} />
                     </TouchableOpacity>
                   </View>
                   {/* From Date Modal */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible1}
                    onRequestClose={() => setModalVisible1(!modalVisible1)}
                  >
                    <View style={styles.modalBackground}>
                      <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Select From Date</Text>
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
                </View>
                <View style={{ flex:1, height:50, flexDirection:'row', backgroundColor:Style.basicbgColor, borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                   <View style={{ width:'100%', height:50, borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:0, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                     <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                       <Text style={{ color:Style.headerBgColor, fontWeight:'600', fontSize:12 }}>{endDate ? moment(endDate).format('DD/MM/YYYY') : 'From'}</Text>
                     </View>
                     <TouchableOpacity onPress={()=> {setModalVisible2(true),setDatePickerVisibility2(true)}} style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                        <Feather name="calendar" size={20} color={Style.basicTextColor} />
                      </TouchableOpacity>
                   </View>
                   <Modal
                     animationType="slide"
                     transparent={true}
                     visible={modalVisible2}
                     onRequestClose={() => setModalVisible2(!modalVisible2)}
                   >
                     <View style={styles.modalBackground}>
                       <View style={styles.modalContainer}>
                         <View style={styles.modalHeader}>
                           <Text style={styles.modalTitle}>Select To Date</Text>
                           <TouchableOpacity onPress={() => setModalVisible2(!modalVisible2)} style={styles.closeButton}>
                             <Ionicons name="close-sharp" size={32} color='#fff' />
                           </TouchableOpacity>
                         </View>
                         {isDatePickerVisible2 && (
                          <DateTimePicker
                           value={endDate ? new Date(endDate) : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                            onChange={onChange2}
                          />
                        )}
                       </View>
                     </View>
                   </Modal>
                </View>
              </View>
             <TouchableOpacity disabled={!startDate && !endDate}  onPress={() => {setModalVisible(false); getAdvanceList();}} style={{ width:'50%', height:40, backgroundColor: (!startDate && !endDate) ? '#cccccc40' : '#658eff', borderRadius:5, justifyContent:'center', alignItems:'center', alignSelf:'center', elevation:0, marginTop:0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, marginBottom:10 }} >
                <Text style={{ fontWeight:600, fontSize:14, color:(!startDate && !endDate)?'#999':'#fff' }} >Apply</Text>
            </TouchableOpacity>
          </View>
         </TouchableOpacity>
      </Modal>
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff',fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Statements</Text>
        </View>
        <View style={{flexDirection: 'row',alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={handleSearch} style={{flex: 9, fontSize: 18,padding: 10,paddingLeft: 20,}} />
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
              <Text style={{ flex:1, fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor }}>Statements</Text>
                <View style={{ flexDirection:"row", flex:1, justifyContent:"flex-end" }} >
                  <TouchableOpacity onPress={()=> showDefault()} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                      <Fontisto name="spinner-refresh" size={24} color="gray" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=> setModalVisible(true)} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                      <Image source={require('../../../assets/menuIcon.png')} resizeMode="contain" style={{ width:30, height:30 }} />
                  </TouchableOpacity>
                </View>
            </View>
             <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
               <View>
                {
                  loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                  ):(
                    filteredData.length > 0 ?(
                      filteredData.map((item, index) => {
                        return(
                            <View key={index} style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, marginBottom:10, padding:10 }} >
                              <View style={{ width:"100%", flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center' }} >
                                  <Text style={{flex:7, fontSize:16, fontWeight:"500", color:Style.headerBgColor }}>Advance {item.receiptNumber}</Text>
                                  <View style={{flex:3, width:100, backgroundColor:item.status ==='Paid'?'#85BD2A': '#E51E1E', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                      <Text style={{ fontSize:14, fontWeight:"600", color:Style.basicbgColor }}>{item.status==='Paid'?'Received': 'Adjusted'}</Text>
                                  </View>
                              </View>
                              <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                  <Text style={{flex:6, fontSize:14, fontWeight:"500", color:Style.secondryTextColor  }}>({item.naration})</Text>
                                  <View style={{ flex:4 }} >
                                  </View>
                              </View>
                               <View style={{ flexDirection:'row', paddingVertical:5 }}>
                                  <Text style={{ fontSize:16, fontWeight:"600", color:Style.secondryTextColor }}>Rs : </Text>
                                  <Text style={{ fontSize:14, fontWeight:"500", color:Style.secondryTextColor }}>{item.amount}/-</Text>
                               </View>
                               <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                 <View style={{flex:1, flexDirection:'row', alignItems:'center' }}>
                                    <Text style={{ fontSize:14, fontWeight:"600", color:Style.headerBgColor }}>Balance ?: </Text>
                                    <Text style={{ fontSize:12, fontWeight:"500", color:Style.secondryTextColor }}>{item.balance}/-</Text>
                                 </View>
                                 <View style={{flex:1, flexDirection:'row', justifyContent:'flex-end', alignItems:"center" }}>
                                    <Text style={{ fontSize:14, fontWeight:"600", color:Style.secondryTextColor }}>Date : </Text>
                                    <Text style={{ fontSize:12, fontWeight:"500", color:Style.secondryTextColor }}>{moment(item.createdAt).format('DD/MM/YYYY')}</Text>
                                 </View>
                               </View>
                            </View>
                         )
                      })
                    ):(
                      <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                          {startDate || endDate ? 'No data found for the selected date range.' : 'No statements Available.'}
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
})