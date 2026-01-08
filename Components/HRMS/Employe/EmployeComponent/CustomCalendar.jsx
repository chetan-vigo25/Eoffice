// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Modal,
//   StyleSheet,
//   ScrollView,
// } from 'react-native';

// const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// const MONTHS = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];

// // Sample event data (for testing)
// const events = [
//   { type: 'birthday', name: 'Aarav Sharma', date: '2025-12-23' }, 
//   { type: 'holiday', name: 'Independence Day', date: '2026-02-01' }, 
//   { type: 'holiday', name: 'Happy New Year', date: '2026-01-01' },
// ];

// const CustomCalendar = ({ onDateSelect, navigation }) => {
//   const today = new Date();
//   // helper to format a Date as YYYY-MM-DD in local timezone (prevents UTC shift)
//   const formatDateLocal = (d) => {
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const [currentMonth, setCurrentMonth] = useState(today.getMonth());
//   const [currentYear, setCurrentYear] = useState(today.getFullYear());
//   const [selectedDate, setSelectedDate] = useState(today);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [eventDetail, setEventDetail] = useState(null);

//   const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

//   const changeMonth = (direction) => {
//     if (direction === 'next') {
//       if (currentMonth === 11) {
//         setCurrentMonth(0);
//         setCurrentYear(currentYear + 1);
//       } else {
//         setCurrentMonth(currentMonth + 1);
//       }
//     } else {
//       if (currentMonth === 0) {
//         setCurrentMonth(11);
//         setCurrentYear(currentYear - 1);
//       } else {
//         setCurrentMonth(currentMonth - 1);
//       }
//     }
//   };

//   const handleDatePress = (day) => {
//     const selected = new Date(currentYear, currentMonth, day);

//     // Normalize the selected date using local timezone (avoid UTC shift)
//     const selectedDateString = formatDateLocal(selected); // Get the date part (YYYY-MM-DD)

//     // Check if there's an event on the selected date
//     const event = events.find((event) => event.date === selectedDateString);
//     if (event) {
//       setEventDetail(event);
//       setModalVisible(true);
//     } else {
//       setEventDetail(null);  // If no event, hide the modal
//       onDateSelect?.(selected);
//     }
//     setSelectedDate(selected);
//   };

//   const isToday = (day) =>
//     day === today.getDate() &&
//     currentMonth === today.getMonth() &&
//     currentYear === today.getFullYear();

//   const isSelected = (day) =>
//     selectedDate &&
//     day === selectedDate.getDate() &&
//     currentMonth === selectedDate.getMonth() &&
//     currentYear === selectedDate.getFullYear();

//   const isEventDate = (day) => {
//     const date = new Date(currentYear, currentMonth, day);

//     // Normalize the date using local timezone (avoid UTC shift)
//     const dateString = formatDateLocal(date);  // Get YYYY-MM-DD
//     return events.some((event) => event.date === dateString);
//   };

//   const renderEventModal = () => {
//     if (!eventDetail) return null;
//     return (
//       <Modal
//         visible={modalVisible}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalCard}>
//             {/* Icon circle (overlapping) */}
//             <View style={[styles.modalIconWrap, eventDetail?.type === 'birthday' ? styles.birthdayBg : styles.holidayBg]}>
//               <Text style={styles.modalIcon}>{eventDetail?.type === 'birthday' ? '🎂' : '🏖️'}</Text>
//             </View>

//             <Text style={styles.modalTitle}>{eventDetail?.type === 'birthday' ? 'Happy Birthday' : 'Holiday'}</Text>
//             <Text style={styles.modalName}>{eventDetail?.name}</Text>
//             <Text style={styles.modalDate}>{eventDetail ? new Date(eventDetail.date).toLocaleDateString() : ''}</Text>

//             <Text style={styles.modalDesc}>
//               {eventDetail?.type === 'birthday'
//                 ? `Send your best wishes to ${eventDetail.name}.` 
//                 : `Details for the holiday — mark your calendar and enjoy the day!`}
//             </Text>

//             <View style={styles.modalActions}>
//               {/* <TouchableOpacity
//                 style={[styles.actionButton, styles.primaryButton]}
//                 onPress={() => {
//                   // Placeholder: integrate add-to-calendar action if needed
//                   setModalVisible(false);
//                 }}
//               >
//                 <Text style={styles.actionText}>Add to Calendar</Text>
//               </TouchableOpacity> */}

//               <TouchableOpacity
//                 style={[styles.actionButton, styles.secondaryButton]}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={styles.secondaryText}>Close</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => changeMonth('prev')}>
//           <Text style={styles.navText}>‹</Text>
//         </TouchableOpacity>

//         <Text style={styles.monthText}>
//           {MONTHS[currentMonth]} {currentYear}
//         </Text>

//         <TouchableOpacity onPress={() => changeMonth('next')}>
//           <Text style={styles.navText}>›</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Week Days */}
//       <View style={styles.weekRow}>
//         {WEEK_DAYS.map((day) => (
//           <Text key={day} style={styles.weekDay}>
//             {day}
//           </Text>
//         ))}
//       </View>

//       {/* Dates */}
//       <View style={styles.grid}>
//         {Array.from({ length: firstDayOfMonth }).map((_, i) => (
//           <View key={`empty-${i}`} style={styles.dayCell} />
//         ))}

//         {Array.from({ length: daysInMonth }, (_, i) => {
//           const day = i + 1;

//           return (
//             <TouchableOpacity
//               key={day}
//               style={[
//                 styles.dayCell,
//                 isSelected(day) && styles.selectedDay,
//                 isToday(day) && styles.todayDay,
//                 isEventDate(day) && styles.eventDay,  // Highlight event days
//               ]}
//               onPress={() => handleDatePress(day)}
//             >
//               <Text
//                 style={[
//                   styles.dayText,
//                   (isSelected(day) || isToday(day)) && styles.activeText,
//                   isEventDate(day) && styles.eventText,  // Event text styling
//                 ]}
//               >
//                 {day}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//       {renderEventModal()}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 10,
//     marginTop: 16,
//     elevation: 1,
//     borderWidth: 0.5,
//     borderColor: '#E0E0E0',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   navText: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   monthText: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   weekRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   weekDay: {
//     width: '14.28%',
//     textAlign: 'center',
//     color: '#999',
//     fontWeight: '600',
//   },
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   dayCell: {
//     width: '14.28%',
//     height: 30,
//     aspectRatio: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 50,
//   },
//   dayText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   todayDay: {
//     borderWidth: 1.5,
//     borderColor: '#4A90E2',
//   },
//   selectedDay: {
//     backgroundColor: '#4A90E2',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   activeText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   eventDay: {
//     backgroundColor: '#FFCC00', // Highlight event days
//   },
//   eventText: {
//     color: '#fff', // White text for event days
//     fontWeight: 'bold',
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     padding: 20,
//   },
//   modalCard: {
//     width: '100%',
//     maxWidth: 420,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     paddingTop: 40,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.12,
//     shadowRadius: 12,
//     elevation: 10,
//   },
//   modalIconWrap: {
//     width: 88,
//     height: 88,
//     borderRadius: 44,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'absolute',
//     top: -44,
//   },
//   modalIcon: {
//     fontSize: 36,
//   },
//   birthdayBg: {
//     backgroundColor: '#FF6B6B',
//   },
//   holidayBg: {
//     backgroundColor: '#4A90E2',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     marginTop: 10,
//     color: '#222',
//   },
//   modalName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginTop: 6,
//   },
//   modalDate: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 4,
//   },
//   modalDesc: {
//     fontSize: 14,
//     color: '#555',
//     textAlign: 'center',
//     marginTop: 12,
//     marginBottom: 16,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     width: '100%',
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//     minWidth: 120,
//     paddingVertical: 10,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   primaryButton: {
//     backgroundColor: '#6a8ff3',
//   },
//   actionText: {
//     color: '#fff',
//     fontWeight: '700',
//   },
//   secondaryButton: {
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   secondaryText: {
//     color: '#6a8ff3',
//     fontWeight: '700',
//   },
// });

// export default CustomCalendar;


import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';

const events = [
  { type: 'birthday', name: 'Aarav Sharma', date: '2025-12-23' },
  { type: 'birthday', name: 'Chetan Jangid', date: '2026-01-05' },
  { type: 'holiday', name: 'Republic Day', date: '2026-01-26' },
  { type: 'holiday', name: 'Independence day', date: '2026-08-15' },
];

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

  // ✅ DEFINE getMarkedDates
  const getMarkedDates = () => {
    const marked = {};

    events.forEach(event => {
      marked[event.date] = {
        marked: true,
        dotColor: event.type === 'birthday' ? 'green' : 'orange'
      };
    });

    // highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#00adf5'
      };
    }

    return marked;
  };

  const onDayPress = day => {
    setSelectedDate(day.dateString);

    const filteredEvents = events.filter(
      event => event.date === day.dateString
    );

    setDayEvents(filteredEvents);
    setModalVisible(true);
  };

  return (
    <View>
      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
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
            <Text style={styles.dateTitle}>{selectedDate}</Text>

            {dayEvents.length > 0 ? (
              dayEvents.map((event, index) => (
                <Text key={index} style={styles.eventText}>
                  {event.type === 'birthday' ? '🎂' : '🎉'} {event.name}
                </Text>
              ))
            ) : (
              <Text style={styles.noEventText}>
                No events or holidays on this date
              </Text>
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
