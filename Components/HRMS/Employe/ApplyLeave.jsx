import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, StatusBar, Button, ScrollView, Modal, TextInput, Alert, Image, Animated, TouchableOpacity, ImageBackground, ActivityIndicator, ToastAndroid, Dimensions } from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import { SelectList } from 'react-native-dropdown-select-list';
import CalendarPicker from "react-native-calendar-picker";
import moment from "moment";
import EmployeHeader from './EmployeComponent/EmployeHeader';
import EmployeeLeaveCard from './EmployeComponent/EmployeeLeaveCard';

import { AntDesign, Feather, FontAwesome6 } from "@expo/vector-icons";

export default function LeaveManagement({ navigation }) {

    const [currentDate, setCurrentDate] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisible2, setModalVisible2] = useState(false);
    const [modalVisible3, setModalVisible3] = useState(false);
    const [selectLeave, setSelectLeave] = useState('');
    const [show, setShow] = useState(false);
    const [selectedStartHalf, setSelectedStartHalf] = useState(null);
    const [selectedEndHalf, setSelectedEndHalf] = useState(null);
    const [totalDay, setTotalDay] = useState(0);

    const [selectedStartDate, setSelectedStartDate] = useState(null);
    const [selectedEndDate, setSelectedEndDate] = useState(null);
    const [firstDate, setFirstDate] = useState();
    const [secondDate, setSecondDate] = useState();

    const handleTodayClick = () => {
      const today = new Date().toLocaleDateString();
      setCurrentDate(today);
      setModalVisible(true);
    };

    const addType = ['First Half', 'Second Half', 'Full Day'];

    const leaveType = [
        {key:'1', value:'Paid Leave (PL)',},
        {key:'2', value:'Casual Leave (CL)',},
        {key:'3', value:'Sick Leave (SL)',},
        {key:'4', value:'Maternity Leave',},
        {key:'5', value:'Paternity Leave',},
        {key:'6', value:'Marrige Leave',},
        {key:'7', value:'Compensatory Leave'},
    ]

      const onDateChange = (date, type) => {
        if (type === "END_DATE") {
          setSelectedEndDate(date);   // ✅ Date object
        } else {
          setSelectedStartDate(date); // ✅ Date object
          setSelectedEndDate(null);
        }
      };
    
      // Allow a wide selectable range so start/end selection works
      const minDate = new Date(2020, 0, 1); // Jan 1, 2020
      const maxDate = new Date(2026, 11, 31); // Dec 31, 2026

      const handleOkConfirm = () => {
        if (selectedStartDate && selectedEndDate) {
          setShow(true);
          setModalVisible3(true);
      
          const formattedStartDate = moment(selectedStartDate).format('DD-MM-YYYY');
          const formattedEndDate = moment(selectedEndDate).format('DD-MM-YYYY');
      
          setFirstDate(formattedStartDate);
          setSecondDate(formattedEndDate);
        } else {
          Alert.alert('Warning', 'Please select both start and end dates.');
        }
      };

    const calculateTotalDays = (startDate, endDate, selectedStartHalf, selectedEndHalf) => {
       const start = moment(startDate, 'DD-MM-YYYY');
       const end = moment(endDate, 'DD-MM-YYYY');
       let daysCount = end.diff(start, 'days') + 1; 
       if (selectedStartHalf) {
         daysCount -= 0.5; 
       }
       if (selectedEndHalf) {
         daysCount -= 0.5; 
       }
       return daysCount;
     };
     const handleConfirm = () => {
       setModalVisible3(!modalVisible3); 
       setModalVisible2(!modalVisible2);
       const totalDays = calculateTotalDays(
         firstDate,
         secondDate,
         selectedStartHalf,
         selectedEndHalf 
       );
       // console.log(`Total Days (including halves): ${totalDays}`);
       setTotalDay(totalDays);
     };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#6a8ff3' }}>
       <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', paddingHorizontal:20 }}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontFamily:'Poppins-SemiBold', flex: 1, }}>Leave Management</Text>
        </View>
        <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20 }} >
            <EmployeHeader />
            <EmployeeLeaveCard navigation={navigation} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
               {
                   show ? (
                     <View style={{ width: '100%', height: 60, flexDirection: 'row', gap: 10, padding: 10, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#6a8ff320', borderWidth: 1, borderColor: "#6a8ff3", borderRadius: 6 }}>
                       <View style={{ flex: 1 }}>
                          {firstDate && secondDate ? (
                           <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold", }}>
                             {firstDate}
                           </Text>
                          ):
                          (
                           <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold", }}>{currentDate}</Text>
                          )}
                       </View>
                       <View style={{ flex: 1 }}>
                           <View style={{ flex: 1 }}>
                             {firstDate && secondDate ? (
                               <TouchableOpacity style={{ width: '100%', height: 40, backgroundColor: '#6a8ff3', borderRadius: 3, justifyContent: 'center', alignItems: 'center' }}>
                                 <Text style={{ color: '#FFF', fontSize: 16, fontFamily: "Poppins-SemiBold" }}>{totalDay} Days</Text>
                               </TouchableOpacity>
                             ):(
                               <TouchableOpacity style={{ width: '100%', height: 40, backgroundColor: '#6a8ff3', borderRadius: 3, justifyContent: 'center', alignItems: 'center' }}>
                                 <Text style={{ color: '#FFF', fontSize: 16, fontFamily: "Poppins-SemiBold" }}>{selectLeave}</Text>
                               </TouchableOpacity>
                             )}
                           </View>
                       </View>
                       <View style={{ flex: 1 }}>
                        {firstDate && secondDate ? (
                          <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold", textAlign:'right'}}>
                            {secondDate}
                          </Text>
                         ):
                         (
                          <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold", textAlign:'right' }}>{currentDate}</Text>
                         )}
                       </View>
                     </View>
                   ) : (
                     <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
                       <TouchableOpacity onPress={handleTodayClick} style={{ flex: 1, height: 45, justifyContent: 'center', alignItems: 'center', backgroundColor: currentDate === '' ? '#6a8ff320' : '#6a8ff3', borderWidth: 1, borderColor: "#6a8ff3", borderRadius: 6 }}>
                         <Text style={{ color: currentDate === '' ? '#4c72d9' : '#fff', fontSize: 14, fontFamily: "Poppins-SemiBold" }}>Today</Text>
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => setModalVisible2(true)} style={{ flex: 1, height: 45, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6a8ff320', borderWidth: 1, borderColor: "#6a8ff3", borderRadius: 6 }}>
                         <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Poppins-SemiBold" }}>Select Date</Text>
                       </TouchableOpacity>
                     </View>
                   )
                 }
                <Text style={{ color: '#868686', fontSize: 14, fontFamily:'Poppins-SemiBold', paddingVertical:10 }}>Leave Type : </Text>
                <View style={{ width:'100%', backgroundColor:'#b6b6b610', borderRadius:10 }} >
                 <SelectList 
                     setSelected={() => {}} 
                     data={leaveType} 
                     save="value"
                     placeholder='Select Leave Type'
                 />
                </View>
                {/* Modal 1 */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}>
                  <View style={{ flex:1, justifyContent:'flex-end', backgroundColor:'#ffffff80', marginTop:60 }} >
                    <View style={styles.modalView}>
                      <View style={{ width:'100%', backgroundColor:'#b6b6b610', borderRadius:10 }} >
                       <SelectList 
                           setSelected={(val) => setSelectLeave(val)} 
                           data={addType} 
                           save="value"
                           placeholder='Select Leave Type'
                       />
                      </View>
                      {
                       selectLeave === '' ? 
                       <View style={{ width:'100%', height:45, backgroundColor:'#6a8ff380', borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:20 }} >
                           <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Submit</Text>
                       </View>:
                       <TouchableOpacity onPress={() => {setModalVisible(!modalVisible); setShow(!show)}} style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:20 }} >
                           <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Submit</Text>
                       </TouchableOpacity>
                      }
                    </View>
                  </View>
                </Modal>
                {/* Modal 2 */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible2}
                  onRequestClose={() => {
                    setModalVisible2(!modalVisible2);
                  }}>
                  <View style={{ flex:1, justifyContent:'center',  backgroundColor:'#ffffff80', padding:10 }} >
                    <View style={{ width:'100%', backgroundColor:'#fff', padding:20, borderRadius:10, shadowOffset: { width: 0, height: 5, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, }} >
                       <CalendarPicker
                          startFromMonday={true}
                          allowRangeSelection={true}
                          minDate={minDate}
                          maxDate={maxDate}
                          todayBackgroundColor="#6a8ff3"
                          selectedDayColor="#6a8ff3"
                          selectedDayTextColor="#FFFFFF"
                          onDateChange={onDateChange}
                          selectedStartDate={selectedStartDate} // ✅ REQUIRED
                          selectedEndDate={selectedEndDate}
                        />
                       <View style={{ flexDirection:'row', gap:20 }} >
                         <TouchableOpacity onPress={() => setModalVisible2(!modalVisible2)} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff320', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                           <Text style={{ color:'#6a8ff3', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Cancel</Text>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={handleOkConfirm} style={{ flex:1, height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#6a8ff3', borderWidth:1, borderColor:'#6a8ff3', borderRadius:6 }} >
                           <Text style={{ color:'#fff', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Confirm</Text>
                         </TouchableOpacity>
                       </View>
                    </View>
                  </View>
                </Modal>
                {/* Modal 3 */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible3}
                  onRequestClose={() => {
                    setModalVisible3(!modalVisible3);
                  }}>
                  <View style={{ flex:1, justifyContent:'flex-end', backgroundColor:'#ffffff80', marginTop:0 }} >
                    <View style={styles.modalView}>
                      <View style={{ flexDirection:'row', gap:20 }} >
                        <View style={{ flex:1, backgroundColor:'#b6b6b610', borderRadius:10 }} >
                        <Text style={{ color:'#000', fontSize:14, fontFamily:"Poppins-SemiBold" }} >Start Date: {firstDate}</Text>
                         <SelectList 
                             setSelected={(val) => setSelectedStartHalf(val)}
                             data={['First Half', 'Second Half']}
                             save="value"
                             placeholder='Select Leave Type'
                         />
                        </View>
                        <View style={{ flex:1, backgroundColor:'#b6b6b610', borderRadius:10 }} >
                        <Text style={{ color:'#000', fontSize:14, fontFamily:"Poppins-SemiBold" }} >End Date: {secondDate}</Text>
                         <SelectList 
                             setSelected={(val) => setSelectedEndHalf(val)} 
                             data={['First Half', 'Second Half']}
                             save="value"
                             placeholder='Select Leave Type'
                         />
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => {handleConfirm()}} style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', marginTop:20 }} >
                          <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
                <Text style={{ color: '#868686', fontSize: 14, fontFamily:'Poppins-SemiBold', paddingVertical:10 }}>Note to Approver : </Text>
                <View style={{ padding:.1 }} >
                 <TextInput
                   placeholder="Ex- Going for a movie show"
                   style={{ borderWidth: 1,
                       flex: 1,
                       borderColor:'#d6d6d6',
                       padding: 10,
                       marginBottom: 20,
                       borderRadius: 5,
                       height: 120,
                       textAlign: 'left',        
                       textAlignVertical: 'top',  
                       color:'#868686',
                       backgroundColor:'#b6b6b610',
                       fontSize: 12, }}
                   multiline={true} 
                   numberOfLines={10}
                   placeholderTextColor="#999"
                 />
                </View>
            </ScrollView>
            <TouchableOpacity onPress={()=> navigation.navigate('LeaveSubmit')} style={{ width:'100%', height:45, backgroundColor:'#6a8ff3', borderRadius:6, justifyContent:'center', alignItems:'center', }} >
                <Text style={{ color:'#FFF', fontSize:16, fontFamily:"Poppins-SemiBold" }} >Request Leave</Text>
            </TouchableOpacity>
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
});
