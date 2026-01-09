
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';
import moment from 'moment';
import { Entypo } from '@expo/vector-icons';

// Locale
LocaleConfig.locales['in'] = {
  monthNames: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ],
  monthNamesShort: [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ],
  dayNames: [
    'Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday'
  ],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: 'Today'
};

LocaleConfig.defaultLocale = 'in';

const CustomCalendar = () => {
  const { dashboardData, loading, error } = useEmployeeDashboard();
  const [selectedDate, setSelectedDate] = useState('');
  const [dayEvents, setDayEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
   useEffect(() => {
       if (dashboardData) {
        //  console.log('Dashboard Data eventData:', dashboardData.holidayData);
       }
   }, [dashboardData])
  
  const employeesEvents = dashboardData?.eventData || [];
  const holidayData = dashboardData?.holidayData || [];

  // ✅ DEFINE getMarkedDates
  const getMarkedDates = () => {
    const marked = {};
  
    // Employee Events (Green)
    employeesEvents.forEach(event => {
      const start = moment.utc(event.startDate).startOf('day');
      const end = moment.utc(event.endDate).startOf('day');
  
      for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, 'day')) {
        const formattedDate = date.format('YYYY-MM-DD');
  
        if (!marked[formattedDate]) {
          marked[formattedDate] = { dots: [] };
        }
  
        marked[formattedDate].dots.push({
          key: `event-${event._id}`,
          color: '#00adf5',
        });
      }
    });
  
    // Holidays (Red)
    holidayData.forEach(holiday => {
      const formattedDate = moment.utc(holiday.date).local().format('YYYY-MM-DD');
  
      if (!marked[formattedDate]) {
        marked[formattedDate] = { dots: [] };
      }
  
      marked[formattedDate].dots.push({
        key: `holiday-${holiday._id}`,
        color: '#FF9800',
      });
    });
  
    // Selected date highlight
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#00adf5',
      };
    }
  
    // ✅ Highlight Sundays
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');
  
    for (
      let date = startOfMonth.clone();
      date.isSameOrBefore(endOfMonth);
      date.add(1, 'day')
    ) {
      if (date.day() === 0) { // 0 = Sunday
        const formattedDate = date.format('YYYY-MM-DD');
        if (!marked[formattedDate]) {
          marked[formattedDate] = {};
        }
        marked[formattedDate].customStyles = {
          container: {
            backgroundColor: '#FFE0E0', // light red for Sunday
            borderRadius: 6,
          },
          text: {
            color: '#D32F2F', // red text for Sunday
            fontWeight: 'bold',
          },
        };
      }
    }
  
    return marked;
  };

  const onDayPress = day => {
    setSelectedDate(day.dateString);
    const filteredEvents = employeesEvents.filter(event => {
      const start = moment.utc(event.startDate).format('YYYY-MM-DD');
      const end = moment.utc(event.endDate).format('YYYY-MM-DD');
      return day.dateString >= start && day.dateString <= end;
    });
    const filteredHolidays = holidayData.filter(holiday => {
      const holidayDate = moment.utc(holiday.date).local().format('YYYY-MM-DD');
      return holidayDate === day.dateString;
    });
    setDayEvents([
      ...filteredHolidays.map(h => ({ ...h, type: 'holiday' })),
      ...filteredEvents.map(e => ({ ...e, type: 'event' })),
    ]);
    setModalVisible(true);
  };

  return (
    <View style={{ }} >
      <View style={{ width:'100%',}} >
        <View style={{ width:'100%', flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center', marginBottom:10 }} >
          <View style={{ flex:1, padding:10, flexDirection:'row', backgroundColor:'#2196F320', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
            <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <View style={{ width:10, height:10, backgroundColor:'#2196F3', borderRadius:50 }} ></View>
            <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:'#444' }} >Events</Text>
            </View>
            <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:'#444' }} >{employeesEvents.length || 0}</Text>
          </View>
          <View style={{ flex:1, padding:10, flexDirection:'row', backgroundColor:'#FF980020', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
            <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <View style={{ width:10, height:10, backgroundColor:'#FF9800', borderRadius:50 }} ></View>
            <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:'#444' }} >Holidays</Text>
            </View>
            <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:'#444' }} >{holidayData.length || 0}</Text>
          </View>
        </View>
      </View>
      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
        markingType="multi-dot"
        style={{
          borderWidth: 1,
          borderColor: '#e0e0e0',
          height: 320,
          backgroundColor: '#fff',
          borderRadius: 10,
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#b6c1cd'
        }}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.dateTitle}>On this date: {selectedDate}</Text>

            {dayEvents.length > 0 ? (
              dayEvents.map(item => (
                <View key={item._id} style={{ marginBottom: 15 }}>
                  <Text style={{fontSize: 14, color: '#444', fontFamily:'Poppins-Medium'}}>{item.type === 'holiday' ? '🏖️ Holiday:' : '🎉 Event:'}</Text>
                  {
                    item.type === 'event' ? (
                      <Text style={{ fontSize: 14, color: '#444', fontFamily:'Poppins-SemiBold', marginBottom: 4 }}>
                        {item.title}
                      </Text>
                    ):(
                      <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {/* 📅 {moment.utc(item.date).format('DD MMM YYYY')} */}
                      </Text>
                    )
                  }
                  {!!item.description && (
                    <Text style={{ fontSize: 12, color: '#999', fontFamily:'Poppins-Medium', marginBottom:5, textTransform:'capitalize' }}>
                      {item.description}
                    </Text>
                  )}
                  {!!item.location && (
                    <View style={{ flexDirection:'row', alignItems:'center', }} >
                      <Entypo name="location-pin" size={18} color="#00adf5" />
                      <Text style={{ fontSize: 14, fontFamily:'Poppins-Medium', color: '#444', textTransform:'capitalize' }}>{item.location} </Text>
                    </View>
                  )}
                  {/* {item.type === 'holiday' ?(
                      <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        📅 {moment(item.date).format('DD MMM YYYY')}
                      </Text>
                  ):(
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      📅 {moment.utc(item.startDate).format('DD MMM YYYY')} - {moment.utc(item.endDate).format('DD MMM YYYY')}
                    </Text>
                  )} */}
                </View>
              ))
            ) : (
              <Text style={styles.noEventText}>No events or holidays on this date</Text>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventText: {
    fontSize: 16,
    marginVertical: 4,
  },
  noEventText: {
    fontSize: 16,
    color: '#888',
    marginVertical: 10,
  },
  closeBtn: {
    marginTop: 15,
    backgroundColor: '#00adf5',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});

export default CustomCalendar;
