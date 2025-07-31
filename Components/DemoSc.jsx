import React, { useEffect, useContext } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { companyDetail } from '../Redux/Reducer/Company/Company.Reducer';
import { useDeviceLocation } from '../Context/DeviceLoc';
import { DeviceInfoContext } from '../Context/DeviceInfoContext';

import Header from '../Global/Header';

export default function App({navigation, route}) {

  const { userId } = route.params;
  const dispatch = useDispatch();
  const { isLoading, companyData, error } = useSelector((state) => state.company);
  const { location, address, errorMsg, loading } = useDeviceLocation();
  const deviceInfo = useContext(DeviceInfoContext);

  useEffect(() => {
    dispatch(companyDetail(userId));
  }, [dispatch, userId]);

  let fullAddress = 'Waiting...';
  if (errorMsg) {
   fullAddress = errorMsg;
    } else if (address) {
      fullAddress = address.length > 0 ? `${address[0].formattedAddress}` : 'No address found';
    } else if (location) {
    fullAddress = JSON.stringify(location);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:'#fff' }}>
      {/* <Header /> */}
      <View style={{ flex: 1, padding:20 }}>
          <Text style={{ fontSize: 20, color: 'green' }} >userId :- {userId}</Text>
          <Text style={{ fontSize: 20, color: 'green' }} >User Type :- {companyData?.userType}</Text>
          <Text style={{ fontSize: 20, color: 'green' }} >user Name :- {companyData?.fullName}</Text>
          <Text style={{ fontSize: 20, color: 'green' }} >user Email :- {companyData?.email}</Text>
          <Text style={{ fontSize: 20, color: 'blue' }}>Location: {fullAddress}</Text>
        <View>
          <Text style={{ fontSize: 20, fontWeight:600, paddingVertical:10 }}>Device Information:-</Text>
          <Text style={{ fontSize: 20, color: 'red' }} >Model: {deviceInfo.modelName}</Text>
          <Text style={{ fontSize: 20, color: 'red' }} >Brand: {deviceInfo.brand}</Text>
          <Text style={{ fontSize: 20, color: 'red' }} >OS: {deviceInfo.osName}</Text>
          <Text style={{ fontSize: 20, color: 'red' }} >Memory: {deviceInfo.memory} GB</Text>
          <Text style={{ fontSize: 20, color: 'red' }} >Version: {deviceInfo.version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}


// import React, { useState } from "react";
// import { StyleSheet, Text, View } from "react-native";
// import CalendarPicker from "react-native-calendar-picker";
// import moment from "moment";

// export default function DemoSc () {
//   const [selectedStartDate, setSelectedStartDate] = useState(null);
//   const [selectedEndDate, setSelectedEndDate] = useState(null);

//   const onDateChange = (date, type) => {
//     if (type === "END_DATE") {
//       setSelectedEndDate(date);
//     } else {
//       setSelectedStartDate(date);
//       setSelectedEndDate(null);
//     }
//   };

//   const minDate = new Date();
//   const maxDate = new Date(2025, 6, 3);
//   const startDate = selectedStartDate ? selectedStartDate.toString() : "";
//   const endDate = selectedEndDate ? selectedEndDate.toString() : "";

//   return (
//     <View style={{ flex:1, backgroundColor:'#fff' }}>
//       <CalendarPicker
//         startFromMonday={true}
//         allowRangeSelection={true}
//         minDate={minDate}
//         maxDate={maxDate}
//         todayBackgroundColor="#f2e6ff"
//         selectedDayColor="#7300e6"
//         selectedDayTextColor="#FFFFFF"
//         onDateChange={onDateChange}
//       />
//       <View>
//         <Text>SELECTED START DATE: {moment(startDate).format('DD-MM-YYYY')}</Text>
//         <Text>SELECTED END DATE: {moment(endDate).format('DD-MM-YYYY')}</Text>
//       </View>
//     </View>
//   );
// };

