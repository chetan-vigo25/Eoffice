
import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, FlatList, View, Text, Modal, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';
import { UserContext } from '../../../../Context/UserProvider';
import moment from 'moment';
import { Entypo, Ionicons } from '@expo/vector-icons';

LocaleConfig.locales['in'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'in';

const EVENT_ACCENTS = ['#2196F3','#9C27B0','#00897B','#E91E63','#FF5722'];
const EVENT_BG     = ['#E3F2FD','#F3E5F5','#E0F2F1','#FCE4EC','#FBE9E7'];

const CustomCalendar = () => {
  const { dashboardData, loading, error, fetchDashboard } = useEmployeeDashboard();
  const { userData } = useContext(UserContext);
  const [selectedDate, setSelectedDate]   = useState('');
  const [dayEvents, setDayEvents]         = useState([]);
  const [modalVisible, setModalVisible]   = useState(false);
  const [holidayModal, setHolidayModal]   = useState(false);
  const [eventsModal, setEventsModal]     = useState(false);

  useEffect(() => {
    if (!dashboardData && !loading && userData) fetchDashboard(userData);
  }, [dashboardData, loading, userData, fetchDashboard]);

  const employeesEvents = dashboardData?.eventData  || [];
  const holidayData     = dashboardData?.holidayData || [];

  console.log('Calendar data - Events:', employeesEvents);

  const getMarkedDates = () => {
    const marked = {};

    employeesEvents.forEach(event => {
      const start = moment.utc(event.startDate).startOf('day');
      const end   = moment.utc(event.endDate).startOf('day');
      for (let d = start.clone(); d.isSameOrBefore(end); d.add(1,'day')) {
        const key = d.format('YYYY-MM-DD');
        if (!marked[key]) marked[key] = { dots: [] };
        marked[key].dots.push({ key: `event-${event._id}`, color: '#2196F3' });
      }
    });

    holidayData.forEach(holiday => {
      const key = moment.utc(holiday.date).local().format('YYYY-MM-DD');
      if (!marked[key]) marked[key] = { dots: [] };
      marked[key].dots.push({ key: `holiday-${holiday._id}`, color: '#FF9800' });
    });

    if (selectedDate) {
      marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#4c72d9' };
    }

    const startOfMonth = moment().startOf('month');
    const endOfMonth   = moment().endOf('month');
    for (let d = startOfMonth.clone(); d.isSameOrBefore(endOfMonth); d.add(1,'day')) {
      if (d.day() === 0) {
        const key = d.format('YYYY-MM-DD');
        if (!marked[key]) marked[key] = {};
        marked[key].customStyles = {
          container: { backgroundColor: '#FFE0E0', borderRadius: 6 },
          text:      { color: '#D32F2F', fontWeight: 'bold' },
        };
      }
    }

    return marked;
  };

  const onDayPress = day => {
    setSelectedDate(day.dateString);
    const filteredEvents   = employeesEvents.filter(e => {
      const s = moment.utc(e.startDate).format('YYYY-MM-DD');
      const en = moment.utc(e.endDate).format('YYYY-MM-DD');
      return day.dateString >= s && day.dateString <= en;
    });
    const filteredHolidays = holidayData.filter(h =>
      moment.utc(h.date).local().format('YYYY-MM-DD') === day.dateString
    );
    setDayEvents([
      ...filteredHolidays.map(h => ({ ...h, type: 'holiday' })),
      ...filteredEvents.map(e => ({ ...e, type: 'event' })),
    ]);
    setModalVisible(true);
  };

  /* ─── Holiday card ─── */
  const renderHolidayItem = ({ item }) => {
    const dd  = moment.utc(item.date).local();
    return (
      <View style={styles.holidayCard}>
        <View style={styles.holidayDateBox}>
          <Text style={styles.holidayDD}>{dd.format('DD')}</Text>
          <Text style={styles.holidayMon}>{dd.format('MMM')}</Text>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>{dd.format('ddd')}</Text>
          </View>
        </View>
        <View style={styles.holidayBody}>
          <Text style={styles.holidayName}>{item.name}</Text>
          {!!item.description && (
            <Text style={styles.holidayDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <Text style={styles.holidayYear}>{dd.format('YYYY')}</Text>
        </View>
      </View>
    );
  };

  /* ─── Event card ─── */
  const renderEventItem = ({ item, index }) => {
    const accent = EVENT_ACCENTS[index % EVENT_ACCENTS.length];
    const bg     = EVENT_BG[index % EVENT_BG.length];
    const days   = moment.utc(item.endDate).diff(moment.utc(item.startDate), 'days') + 1;
    return (
      <View style={[styles.eventCard, { borderLeftColor: accent, backgroundColor: bg }]}>
        <View style={styles.eventDateRow}>
          <Ionicons name="calendar-outline" size={13} color="#888" />
          <Text style={styles.eventDateText}>
            {moment.utc(item.startDate).format('DD MMM')} — {moment.utc(item.endDate).format('DD MMM YYYY')}
          </Text>
          <View style={[styles.durationPill, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.durationText, { color: accent }]}>{days}d</Text>
          </View>
        </View>
        <Text style={[styles.eventTitle, { color: accent }]}>{item.title}</Text>
        {!!item.description && (
          <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
        )}
        {!!item.location && (
          <View style={styles.eventLocationRow}>
            <Entypo name="location-pin" size={14} color={accent} />
            <Text style={[styles.eventLocationText, { color: accent }]}>{item.location}</Text>
          </View>
        )}
      </View>
    );
  };

  /* ─── Empty state ─── */
  const EmptyState = ({ label }) => (
    <View style={styles.emptyWrap}>
      <Image
        source={require('../../../../assets/Images/notFound.png')}
        style={styles.emptyImg}
      />
      <Text style={styles.emptyTitle}>No {label} Found</Text>
      <Text style={styles.emptySubtitle}>There are no {label.toLowerCase()} to display right now.</Text>
    </View>
  );

  /* ─── Bottom-sheet header ─── */
  const SheetHeader = ({ title, count, accentColor, badgeBg, badgeBorder, onClose }) => (
    <>
      <View style={styles.dragHandle} />
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderLeft}>
          <View style={[styles.headerDot, { backgroundColor: accentColor }]} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={[styles.countText, { color: accentColor }]}>{count}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#555" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4c72d9" />
          <Text style={styles.loadingText}>Loading calendar…</Text>
        </View>
      ) : (
        <>
          {/* ── Stat buttons ── */}
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Calendar</Text>
            <View style={styles.accentBar} />
          </View>

          <View style={styles.statRow}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setEventsModal(!eventsModal)}
              style={[styles.statCard, { backgroundColor: '#EEF4FF', borderColor: '#C5D5F8' }]}
            >
              <View style={styles.statLeft}>
                <View style={[styles.statDot, { backgroundColor: '#4c72d9' }]} />
                <View>
                  <Text style={styles.statLabel}>Events</Text>
                  <Text style={styles.statSub}>this month</Text>
                </View>
              </View>
              <View style={[styles.statBadge, { backgroundColor: '#4c72d9' }]}>
                <Text style={styles.statBadgeText}>{employeesEvents.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setHolidayModal(!holidayModal)}
              style={[styles.statCard, { backgroundColor: '#FFF8EE', borderColor: '#FFD89B' }]}
            >
              <View style={styles.statLeft}>
                <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
                <View>
                  <Text style={styles.statLabel}>Holidays</Text>
                  <Text style={styles.statSub}>this year</Text>
                </View>
              </View>
              <View style={[styles.statBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.statBadgeText}>{holidayData.length}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Holiday bottom-sheet modal ── */}
          <Modal
            visible={holidayModal}
            transparent
            animationType="slide"
            onRequestClose={() => setHolidayModal(false)}
          >
            <View style={styles.sheetOverlay}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setHolidayModal(false)} />
              <View style={styles.sheetContainer}>
                <SheetHeader
                  title="Holidays"
                  count={holidayData.length}
                  accentColor="#FF9800"
                  badgeBg="#FFF4E5"
                  badgeBorder="#ffe0b3"
                  onClose={() => setHolidayModal(false)}
                />
                {holidayData.length === 0 ? (
                  <EmptyState label="Holidays" />
                ) : (
                  <FlatList
                    data={holidayData}
                    keyExtractor={item => item._id.toString()}
                    renderItem={renderHolidayItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                )}
                <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: '#FF9800' }]} onPress={() => setHolidayModal(false)}>
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ── Events bottom-sheet modal ── */}
          <Modal
            visible={eventsModal}
            transparent
            animationType="slide"
            onRequestClose={() => setEventsModal(false)}
          >
            <View style={styles.sheetOverlay}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setEventsModal(false)} />
              <View style={styles.sheetContainer}>
                <SheetHeader
                  title="Events"
                  count={employeesEvents.length}
                  accentColor="#4c72d9"
                  badgeBg="#EEF4FF"
                  badgeBorder="#C5D5F8"
                  onClose={() => setEventsModal(false)}
                />
                {employeesEvents.length === 0 ? (
                  <EmptyState label="Events" />
                ) : (
                  <FlatList
                    data={employeesEvents}
                    keyExtractor={item => item._id.toString()}
                    renderItem={renderEventItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                  />
                )}
                <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: '#4c72d9' }]} onPress={() => setEventsModal(false)}>
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ── Calendar widget ── */}
          <Calendar
            onDayPress={onDayPress}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            style={styles.calendarWidget}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#7c84a3',
              selectedDayBackgroundColor: '#4c72d9',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#4c72d9',
              dayTextColor: '#1f2440',
              textDisabledColor: '#c8cbe0',
              arrowColor: '#4c72d9',
              monthTextColor: '#1f2440',
              textMonthFontFamily: 'Lato-SemiBold',
              textDayFontFamily: 'Lato-Medium',
              textDayHeaderFontFamily: 'Lato-SemiBold',
              textMonthFontSize: 16,
            }}
          />
        </>
      )}

      {/* ── Day events popup modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <View>
                <Text style={styles.popupHeaderLabel}>Selected Date</Text>
                <Text style={styles.popupHeaderDate}>
                  {selectedDate ? moment(selectedDate).format('ddd, DD MMM YYYY') : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.popupCloseIcon}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>

            {dayEvents.length > 0 ? (
              dayEvents.map((item, i) => (
                <View key={item._id} style={[styles.dayEventItem, { borderLeftColor: item.type === 'holiday' ? '#FF9800' : '#4c72d9' }]}>
                  <View style={styles.dayEventTypeRow}>
                    <Ionicons
                      name={item.type === 'holiday' ? 'sunny-outline' : 'calendar-outline'}
                      size={13}
                      color={item.type === 'holiday' ? '#FF9800' : '#4c72d9'}
                    />
                    <Text style={[styles.dayEventTypeLabel, { color: item.type === 'holiday' ? '#FF9800' : '#4c72d9' }]}>
                      {item.type === 'holiday' ? 'Holiday' : 'Event'}
                    </Text>
                  </View>
                  <Text style={styles.dayEventName}>{item.type === 'event' ? item.title : item.name}</Text>
                  {!!item.description && (
                    <Text style={styles.dayEventDesc}>{item.description}</Text>
                  )}
                  {!!item.location && (
                    <View style={styles.dayEventLocRow}>
                      <Entypo name="location-pin" size={13} color="#888" />
                      <Text style={styles.dayEventLoc}>{item.location}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.popupEmpty}>
                <Ionicons name="calendar-outline" size={36} color="#ccc" />
                <Text style={styles.popupEmptyText}>No events or holidays</Text>
              </View>
            )}

            <TouchableOpacity style={styles.popupCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.sheetCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  /* loading */
  loadingWrap:     { height: 320, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 10, fontSize: 14, color: '#888', fontFamily: 'Lato-Medium' },

  /* calendar header */
  calendarHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarTitle:   { fontSize: 15, fontFamily: 'Lato-SemiBold', color: '#1f2440' },
  accentBar:       { height: 4, width: 28, borderRadius: 2, backgroundColor: '#4c72d9' },

  /* stat buttons */
  statRow:         { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  statLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statDot:         { width: 10, height: 10, borderRadius: 5 },
  statLabel:       { fontSize: 13, fontFamily: 'Lato-SemiBold', color: '#1f2440' },
  statSub:         { fontSize: 10, fontFamily: 'Lato-Medium', color: '#999', marginTop: 1 },
  statBadge:       { minWidth: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  statBadgeText:   { fontSize: 12, fontFamily: 'Lato-SemiBold', color: '#fff' },

  /* calendar widget */
  calendarWidget:  { borderWidth: 1, borderColor: '#eef0fa', height: 340, backgroundColor: '#fff', borderRadius: 16, paddingBottom: 6 },

  /* bottom sheet */
  sheetOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 30, maxHeight: '85%' },
  dragHandle:      { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', marginBottom: 4 },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerDot:       { width: 10, height: 10, borderRadius: 5 },
  sheetTitle:      { fontSize: 16, fontFamily: 'Lato-SemiBold', color: '#1f2440' },
  countBadge:      { minWidth: 22, paddingHorizontal: 7, height: 22, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  countText:       { fontSize: 11, fontFamily: 'Lato-SemiBold' },
  closeIconBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  listContent:     { paddingTop: 8, paddingBottom: 4 },
  sheetCloseBtn:   { marginTop: 14, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  sheetCloseBtnText: { color: '#fff', fontFamily: 'Lato-SemiBold', fontSize: 15 },

  /* holiday card */
  holidayCard:     { flexDirection: 'row', marginBottom: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0f0f0', },
  holidayDateBox:  { width: 62, backgroundColor: '#FFF4E5', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  holidayDD:       { fontSize: 24, fontFamily: 'Lato-SemiBold', color: '#FF9800', lineHeight: 28 },
  holidayMon:      { fontSize: 12, fontFamily: 'Lato-Medium', color: '#FF9800' },
  dayPill:         { marginTop: 4, backgroundColor: '#FF980022', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  dayPillText:     { fontSize: 10, fontFamily: 'Lato-SemiBold', color: '#FF9800' },
  holidayBody:     { flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 3, borderLeftColor: '#FF9800', justifyContent: 'center' },
  holidayName:     { fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#1f2440', marginBottom: 3 },
  holidayDesc:     { fontSize: 12, fontFamily: 'Lato-Medium', color: '#777', marginBottom: 4 },
  holidayYear:     { fontSize: 11, fontFamily: 'Lato-Medium', color: '#bbb' },

  /* event card */
  eventCard:       { borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, },
  eventDateRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  eventDateText:   { fontSize: 12, fontFamily: 'Lato-Medium', color: '#777', flex: 1 },
  durationPill:    { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  durationText:    { fontSize: 11, fontFamily: 'Lato-SemiBold' },
  eventTitle:      { fontSize: 15, fontFamily: 'Lato-SemiBold', marginBottom: 4 },
  eventDesc:       { fontSize: 12, fontFamily: 'Lato-Medium', color: '#555', marginBottom: 6 },
  eventLocationRow:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  eventLocationText:{ fontSize: 12, fontFamily: 'Lato-Medium', textTransform: 'capitalize' },

  /* empty state */
  emptyWrap:       { alignItems: 'center', paddingVertical: 40 },
  emptyImg:        { width: 100, height: 100, resizeMode: 'contain', marginBottom: 16 },
  emptyTitle:      { fontSize: 16, fontFamily: 'Lato-SemiBold', color: '#999', marginBottom: 4 },
  emptySubtitle:   { fontSize: 13, fontFamily: 'Lato-Medium', color: '#bbb', textAlign: 'center', paddingHorizontal: 20 },

  /* day popup modal */
  popupOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popupCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  popupHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  popupHeaderLabel:{ fontSize: 11, fontFamily: 'Lato-Medium', color: '#aaa', marginBottom: 2 },
  popupHeaderDate: { fontSize: 16, fontFamily: 'Lato-SemiBold', color: '#1f2440' },
  popupCloseIcon:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  dayEventItem:    { backgroundColor: '#fafafa', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3 },
  dayEventTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  dayEventTypeLabel:{ fontSize: 11, fontFamily: 'Lato-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayEventName:    { fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#1f2440', marginBottom: 3 },
  dayEventDesc:    { fontSize: 12, fontFamily: 'Lato-Medium', color: '#777', marginBottom: 4, textTransform: 'capitalize' },
  dayEventLocRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  dayEventLoc:     { fontSize: 12, fontFamily: 'Lato-Medium', color: '#888', textTransform: 'capitalize' },
  popupEmpty:      { alignItems: 'center', paddingVertical: 24 },
  popupEmptyText:  { marginTop: 10, fontSize: 14, fontFamily: 'Lato-Medium', color: '#bbb' },
  popupCloseBtn:   { marginTop: 14, backgroundColor: '#4c72d9', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
});

export default CustomCalendar;
