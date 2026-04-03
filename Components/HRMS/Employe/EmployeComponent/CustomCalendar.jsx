
import React, { useState, useEffect, useContext } from 'react';
import { ScrollView, StyleSheet, FlatList, View, Text, Modal, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';
import { UserContext } from '../../../../Context/UserProvider';
import moment from 'moment';
import { Entypo, FontAwesome } from '@expo/vector-icons';

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
  const { dashboardData, loading, error, fetchDashboard } = useEmployeeDashboard();
  const { userData } = useContext(UserContext);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayEvents, setDayEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [eventsModal, setEventsModal] = useState(false);
  
  useEffect(() => {
    if (!dashboardData && !loading && userData) {
      fetchDashboard(userData);
    }
  }, [dashboardData, loading, userData, fetchDashboard]);
  
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
const pastelColors = ['#FFB3BA50', '#FFDFBA50', '#FFFFBA50', '#BAFFBA50', '#BAE1FF50'];
const textColors = ['#b62634', '#c7873d', '#b9b92c', '#3bcf3b', '#2178bb'];

const renderItem = ({ item, index }) => {
    const date = moment(item.date).format('DD');
    const day = moment(item.date).format('MMM YYYY');
    
    return (
      <View style={{ flexDirection: 'row', }}>
          <View style={{ width:60, height:80, alignItems:'center', borderRightWidth:1.5, borderColor:'#ccc' }} >
            <Text style={{ fontSize:26, fontFamily:'Lato-SemiBold', color:'#ccc' }} >{date}</Text>
            <Text style={{ fontSize:12, fontFamily:'Lato-Medium', color:'#868686' }} >{day}</Text>
          </View>
          <View style={{ flex:1, paddingHorizontal:10, backgroundColor:pastelColors[index % pastelColors.length], marginBottom:0, borderRadius:4, margin:5 }} >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Lato-SemiBold',
                color: textColors[index % textColors.length],
                paddingHorizontal: 8,
                borderRadius: 4,
                alignSelf: 'flex-start', // 👈 important
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Lato-Medium',
                color: "#444",
                paddingHorizontal: 8,
                borderRadius: 4,
                alignSelf: 'flex-start', // 👈 important
              }}
            >
              {item.description}
            </Text>
          </View>
      </View>
    );
  };

const renderItemEvents = ({ item, index }) => {
    return (
      <View style={{ }}>
          <View style={{ paddingHorizontal:10, backgroundColor:'#f1f1f1', marginBottom:10, borderRadius:4, margin:5 }} >
            <View style={{ flexDirection:'row', padding:5 }} >
              <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{moment.utc(item.startDate).format('DD MMM YYYY')} to </Text>
              <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{moment.utc(item.endDate).format('DD MMM YYYY')}</Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Lato-SemiBold',
                color: textColors[index % textColors.length],
                paddingHorizontal: 8,
                borderRadius: 4,
                alignSelf: 'flex-start', // 👈 important
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Lato-Medium',
                color: "#444",
                paddingHorizontal: 8,
                borderRadius: 4,
                alignSelf: 'flex-start', // 👈 important
              }}
            >
              {item.description}
            </Text>
            <View style={{ flexDirection:'row', justifyContent:'center', paddingVertical:4 }} >
              <View style={{ width:20, height:20, justifyContent:'center', alignItems:'center' }} >
                <Entypo name="location" size={14} color="#2196F3" />
              </View>
               <Text
                 style={{
                  flex:1,
                   fontSize: 14,
                   fontFamily: 'Lato-SemiBold',
                   color: "#000",
                   paddingHorizontal: 8,
                   borderRadius: 4,
                   alignSelf: 'flex-start', // 👈 important
                   textTransform:'capitalize',
                 }}
               >
                 {item.location}
               </Text>
            </View>
          </View>
      </View>
    );
  };
  return (
    <View style={{ }} >
      {loading ? (
        <View style={{ height: 320, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00adf5" />
          <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Loading calendar...</Text>
        </View>
      ) : (
        <>
          <View style={{ width:'100%',}} >
            <View style={{ width:'100%', flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center', marginBottom:10 }} >
              <TouchableOpacity onPress={()=> setEventsModal(!eventsModal)} style={{ flex:1, padding:10, flexDirection:'row', backgroundColor:'#2196F320', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                <View style={{ width:10, height:10, backgroundColor:'#2196F3', borderRadius:50 }} ></View>
                <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >Events</Text>
                </View>
                <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{employeesEvents.length || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=> setHolidayModal(!holidayModal)} style={{ flex:1, padding:10, flexDirection:'row', backgroundColor:'#FF980020', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
                <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                <View style={{ width:10, height:10, backgroundColor:'#FF9800', borderRadius:50 }} ></View>
                <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >Holidays</Text>
                </View>
                <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{holidayData.length || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
           <Modal
             visible={holidayModal}
             transparent
             animationType="slide"
             onRequestClose={() => setHolidayModal(false)}
           >
             <View style={{ flex:1, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', padding:10 }} >
               <View style={{ flex:1, width:'100%', }} >
                  {
                    holidayData.length === 0 ? (
                      <>
                      <View style={{ width:'100%', justifyContent:'center', alignItems:'center', padding:20, }} >
                         <View style={{ width:100, height:100 }} >
                          <Image
                            source={require('../../../../assets/Images/notFound.png')}
                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                          />
                        </View>
                        <Text style={{fontSize: 28, fontFamily:'Lato-SemiBold', color: '#868686',}}>Ooos !</Text>
                        <Text style={{fontSize: 14, fontFamily:'Lato-SemiBold', color: '#868686',}}>Records not found</Text>
                      </View>
                       <TouchableOpacity
                         style={styles.closeBtn}
                         onPress={() => setHolidayModal(false)}
                       >
                         <Text style={{ color: '#fff' }}>Close</Text>
                       </TouchableOpacity>
                      </>
                    ):(
                       <>
                       <View style={{ padding:10, flexDirection:'row', backgroundColor:'#FF980020', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
                          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                          <View style={{ width:10, height:10, backgroundColor:'#FF9800', borderRadius:50 }} ></View>
                          <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >Holidays</Text>
                          </View>
                          <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{holidayData.length || 0}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth:1.5, borderColor:'#ccc', marginTop:10, }} >
                           <View style={{ width:60, justifyContent:'center', alignItems:'center', borderRightWidth:1.5, borderColor:'#ccc' }} >
                             <Text style={{ fontSize:16, fontFamily:'Lato-Medium', color:'#222' }} >Day</Text>
                           </View>
                           <View style={{ flex:1, paddingHorizontal:10, alignItems:'center' }} >
                             <Text
                               style={{
                                 fontSize: 16,
                                 fontFamily: 'Lato-Medium',
                                 color: "#222",
                                 paddingHorizontal: 8,
                                 paddingVertical: 4,
                                 borderRadius: 4,
                                //  alignSelf: 'flex-start',
                               }}
                             >
                               Holidays
                             </Text>
                           </View>
                        </View>
                        <FlatList
                          data={holidayData}
                          keyExtractor={(item) => item._id.toString()}
                          renderItem={renderItem}
                          showsVerticalScrollIndicator={false}
                        />
                       <TouchableOpacity
                         style={styles.closeBtn}
                         onPress={() => setHolidayModal(false)}
                       >
                         <Text style={{ color: '#fff' }}>Close</Text>
                       </TouchableOpacity>
                       </>
                    )
                  }
               </View>
             </View>
           </Modal>
           <Modal
             visible={eventsModal}
             transparent
             animationType="slide"
             onRequestClose={() => setEventsModal(false)}
           >
             <View style={{ flex:1, backgroundColor:'#fff', justifyContent:'center', alignItems:'center', padding:10 }} >
               <View style={{ flex:1, width:'100%', }} >
                  {
                    employeesEvents.length === 0 ? (
                      <>
                      <View style={{ width:'100%', justifyContent:'center', alignItems:'center', padding:20, }} >
                         <View style={{ width:100, height:100 }} >
                          <Image
                            source={require('../../../../assets/Images/notFound.png')}
                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                          />
                        </View>
                        <Text style={{fontSize: 28, fontFamily:'Lato-SemiBold', color: '#868686',}}>Ooos !</Text>
                        <Text style={{fontSize: 14, fontFamily:'Lato-SemiBold', color: '#868686',}}>Records not found</Text>
                      </View>
                       <TouchableOpacity
                         style={styles.closeBtn}
                         onPress={() => setEventsModal(false)}
                       >
                         <Text style={{ color: '#fff' }}>Close</Text>
                       </TouchableOpacity>
                      </>
                    ):(
                       <>
                       <View style={{ padding:10, flexDirection:'row', backgroundColor:'#2196F320', borderRadius:5, justifyContent:'space-between', alignItems:'center'}} >
                          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                          <View style={{ width:10, height:10, backgroundColor:'#2196F3', borderRadius:50 }} ></View>
                          <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >Events</Text>
                          </View>
                          <Text style={{ fontSize:14, fontFamily:'Lato-SemiBold', color:'#444' }} >{holidayData.length || 0}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth:1.5, borderColor:'#ccc', marginTop:10, }} >
                           {/* <View style={{ width:60, justifyContent:'center', alignItems:'center', borderRightWidth:1.5, borderColor:'#ccc' }} >
                             <Text style={{ fontSize:16, fontFamily:'Lato-Medium', color:'#222' }} >Day</Text>
                           </View> */}
                           <View style={{ flex:1, paddingHorizontal:10, alignItems:'center' }} >
                             {/* <Text
                               style={{
                                 fontSize: 16,
                                 fontFamily: 'Lato-Medium',
                                 color: "#222",
                                 paddingHorizontal: 8,
                                 paddingVertical: 4,
                                 borderRadius: 4,
                                //  alignSelf: 'flex-start',
                               }}
                             >
                               Events
                             </Text> */}
                           </View>
                        </View>
                        <FlatList
                          data={employeesEvents}
                          keyExtractor={(item) => item._id.toString()}
                          renderItem={renderItemEvents}
                          showsVerticalScrollIndicator={false}
                        />
                       <TouchableOpacity
                         style={styles.closeBtn}
                         onPress={() => setEventsModal(false)}
                       >
                         <Text style={{ color: '#fff' }}>Close</Text>
                       </TouchableOpacity>
                       </>
                    )
                  }
               </View>
             </View>
           </Modal>
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
        </>
      )}

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
                  <Text style={{fontSize: 14, color: '#444', fontFamily:'Lato-Medium'}}>{item.type === 'holiday' ? '🏖️ Holiday:' : '🎉 Event:'}</Text>
                  {
                    item.type === 'event' ? (
                      <Text style={{ fontSize: 14, color: '#444', fontFamily:'Lato-SemiBold', marginBottom: 4 }}>
                        {item.title}
                      </Text>
                    ):(
                      <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {/* 📅 {moment.utc(item.date).format('DD MMM YYYY')} */}
                      </Text>
                    )
                  }
                  {!!item.description && (
                    <Text style={{ fontSize: 12, color: '#999', fontFamily:'Lato-Medium', marginBottom:5, textTransform:'capitalize' }}>
                      {item.description}
                    </Text>
                  )}
                  {!!item.location && (
                    <View style={{ flexDirection:'row', alignItems:'center', }} >
                      <Entypo name="location-pin" size={18} color="#00adf5" />
                      <Text style={{ fontSize: 14, fontFamily:'Lato-Medium', color: '#444', textTransform:'capitalize' }}>{item.location} </Text>
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
   monthHeader: {
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  dateContainer: {
    width: 80,
    alignItems: 'center',
  },

  dateText: {
    fontSize: 22,
    fontFamily: 'Lato-Bold',
    color: '#000',
  },

  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
    marginHorizontal: 15,
  },

  detailContainer: {
    flex: 1,
  },

});

export default CustomCalendar;
