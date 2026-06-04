import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';
import EmployeHeader from './EmployeComponent/EmployeHeader';
import EmployeeLeaveCard from './EmployeComponent/EmployeeLeaveCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const PRIMARY = '#6a8ff3';
const PRIMARY_DARK = '#4c72d9';
const PRIMARY_TINT = '#eef2ff';
const TEXT_DARK = '#1f2440';
const TEXT_MUTED = '#7c84a3';
const BORDER = '#e6eaf5';

export default function LeaveManagement({ navigation }) {
  const [currentDate, setCurrentDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [selectLeave, setSelectLeave] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState(false);
  const [selectedStartHalf, setSelectedStartHalf] = useState(null);
  const [selectedEndHalf, setSelectedEndHalf] = useState(null);
  const [totalDay, setTotalDay] = useState(0);

  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [firstDate, setFirstDate] = useState();
  const [secondDate, setSecondDate] = useState();

  const handleTodayClick = () => {
    const today = moment().format('DD-MM-YYYY');
    setCurrentDate(today);
    setModalVisible(true);
  };

  const addType = ['First Half', 'Second Half', 'Full Day'];

  const leaveType = [
    { key: '1', value: 'Paid Leave (PL)' },
    { key: '2', value: 'Casual Leave (CL)' },
    { key: '3', value: 'Sick Leave (SL)' },
    { key: '4', value: 'Maternity Leave' },
    { key: '5', value: 'Paternity Leave' },
    { key: '6', value: 'Marrige Leave' },
    { key: '7', value: 'Compensatory Leave' },
  ];

  const onDateChange = (date, type) => {
    if (type === 'END_DATE') {
      setSelectedEndDate(date);
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  const minDate = new Date(2020, 0, 1);
  const maxDate = new Date(2026, 11, 31);

  const handleOkConfirm = () => {
    if (selectedStartDate && selectedEndDate) {
      setShow(true);
      setModalVisible2(false);
      setModalVisible3(true);

      const formattedStartDate = moment(selectedStartDate).format('DD-MM-YYYY');
      const formattedEndDate = moment(selectedEndDate).format('DD-MM-YYYY');

      setFirstDate(formattedStartDate);
      setSecondDate(formattedEndDate);
    } else {
      Alert.alert('Warning', 'Please select both start and end dates.');
    }
  };

  const calculateTotalDays = (startDate, endDate, startHalf, endHalf) => {
    const start = moment(startDate, 'DD-MM-YYYY');
    const end = moment(endDate, 'DD-MM-YYYY');
    let daysCount = end.diff(start, 'days') + 1;
    if (startHalf) daysCount -= 0.5;
    if (endHalf) daysCount -= 0.5;
    return daysCount;
  };

  const handleConfirm = () => {
    setModalVisible3(false);
    const totalDays = calculateTotalDays(
      firstDate,
      secondDate,
      selectedStartHalf,
      selectedEndHalf
    );
    setTotalDay(totalDays);
  };

  const resetSelection = () => {
    setShow(false);
    setCurrentDate('');
    setFirstDate(undefined);
    setSecondDate(undefined);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectedStartHalf(null);
    setSelectedEndHalf(null);
    setSelectLeave('');
    setTotalDay(0);
  };

  const isFormValid = () => {
    const hasDate = !!currentDate || (!!firstDate && !!secondDate);
    return hasDate && !!selectedLeaveType;
  };

  const handleRequestLeave = () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete', 'Please select a date and leave type before submitting.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('LeaveSubmit');
    }, 600);
  };

  const selectListBoxStyle = {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  };

  const selectListDropdownStyle = {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 4,
  };

  const selectListInputStyle = {
    color: TEXT_DARK,
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Leave Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.sheet}>
        <EmployeHeader />
        <EmployeeLeaveCard navigation={navigation} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Date Selection */}
          <Text style={styles.sectionLabel}>Select Date</Text>

          {show ? (
            <View style={styles.dateRangeCard}>
              <View style={styles.dateRangeRow}>
                <View style={styles.dateChunk}>
                  <Text style={styles.dateChunkLabel}>From</Text>
                  <Text style={styles.dateChunkValue} numberOfLines={1}>
                    {firstDate || currentDate || '--'}
                  </Text>
                </View>

                <View style={styles.daysPill}>
                  <MaterialCommunityIcons name="calendar-range" size={14} color="#fff" />
                  <Text style={styles.daysPillText}>
                    {firstDate && secondDate ? `${totalDay} Days` : selectLeave || '—'}
                  </Text>
                </View>

                <View style={[styles.dateChunk, { alignItems: 'flex-end' }]}>
                  <Text style={styles.dateChunkLabel}>To</Text>
                  <Text style={styles.dateChunkValue} numberOfLines={1}>
                    {secondDate || currentDate || '--'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={resetSelection} style={styles.changeDateBtn}>
                <Feather name="refresh-ccw" size={12} color={PRIMARY_DARK} />
                <Text style={styles.changeDateBtnText}>Change Date</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dateChoiceRow}>
              <TouchableOpacity
                onPress={handleTodayClick}
                style={[
                  styles.dateChoiceBtn,
                  currentDate !== '' && styles.dateChoiceBtnActive,
                ]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="today-outline"
                  size={16}
                  color={currentDate === '' ? PRIMARY_DARK : '#fff'}
                />
                <Text
                  style={[
                    styles.dateChoiceText,
                    currentDate !== '' && { color: '#fff' },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible2(true)}
                style={styles.dateChoiceBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={16} color={PRIMARY_DARK} />
                <Text style={styles.dateChoiceText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Leave Type */}
          <Text style={styles.sectionLabel}>Leave Type</Text>
          <SelectList
            setSelected={(val) => setSelectedLeaveType(val)}
            data={leaveType}
            save="value"
            placeholder="Select Leave Type"
            search={false}
            boxStyles={selectListBoxStyle}
            dropdownStyles={selectListDropdownStyle}
            inputStyles={selectListInputStyle}
            dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
            arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
          />

          {/* Note to Approver */}
          <Text style={styles.sectionLabel}>Note to Approver</Text>
          <View style={styles.noteWrap}>
            <TextInput
              placeholder="Ex- Going for a movie show"
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
              multiline
              numberOfLines={6}
              placeholderTextColor="#a0a6bd"
              maxLength={250}
            />
            <Text style={styles.noteCount}>{note.length}/250</Text>
          </View>

          {/* Modal 1 — Half / Full Day for "Today" */}
          <Modal
            animationType="slide"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Day Type</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <AntDesign name="close" size={16} color={TEXT_DARK} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Today, {currentDate || moment().format('DD-MM-YYYY')}
                </Text>

                <SelectList
                  setSelected={(val) => setSelectLeave(val)}
                  data={addType}
                  save="value"
                  placeholder="First Half / Second Half / Full Day"
                  search={false}
                  boxStyles={selectListBoxStyle}
                  dropdownStyles={selectListDropdownStyle}
                  inputStyles={selectListInputStyle}
                  dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
                  arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
                />

                <TouchableOpacity
                  disabled={selectLeave === ''}
                  onPress={() => {
                    setModalVisible(false);
                    setShow(true);
                  }}
                  style={[
                    styles.primaryBtn,
                    { marginTop: 18 },
                    selectLeave === '' && styles.primaryBtnDisabled,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Modal 2 — Calendar Date Range */}
          <Modal
            animationType="slide"
            transparent
            visible={modalVisible2}
            onRequestClose={() => setModalVisible2(false)}
          >
            <View style={styles.modalBackdropCenter}>
              <View style={styles.calendarCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date Range</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible2(false)}
                    style={styles.modalClose}
                  >
                    <AntDesign name="close" size={16} color={TEXT_DARK} />
                  </TouchableOpacity>
                </View>

                <CalendarPicker
                  startFromMonday
                  allowRangeSelection
                  minDate={minDate}
                  maxDate={maxDate}
                  todayBackgroundColor={PRIMARY_TINT}
                  todayTextStyle={{ color: PRIMARY_DARK }}
                  selectedDayColor={PRIMARY}
                  selectedDayTextColor="#FFFFFF"
                  textStyle={{ color: TEXT_DARK, fontFamily: 'Lato-Medium' }}
                  monthTitleStyle={{ color: TEXT_DARK, fontFamily: 'Lato-SemiBold' }}
                  yearTitleStyle={{ color: TEXT_DARK, fontFamily: 'Lato-SemiBold' }}
                  onDateChange={onDateChange}
                  selectedStartDate={selectedStartDate}
                  selectedEndDate={selectedEndDate}
                />

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    onPress={() => setModalVisible2(false)}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOkConfirm} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal 3 — Half Day for Range */}
          <Modal
            animationType="slide"
            transparent
            visible={modalVisible3}
            onRequestClose={() => setModalVisible3(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Half Day Adjustment</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible3(false)}
                    style={styles.modalClose}
                  >
                    <AntDesign name="close" size={16} color={TEXT_DARK} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Optionally mark the start or end day as a half day.
                </Text>

                <View style={{ width: '100%', gap: 12 }}>
                  <View style={styles.halfDayBlock}>
                    <View style={styles.halfDayHeader}>
                      <Ionicons name="calendar-outline" size={14} color={PRIMARY_DARK} />
                      <Text style={styles.halfDayLabel}>Start Date</Text>
                      <Text style={styles.halfDayDate}>{firstDate}</Text>
                    </View>
                    <SelectList
                      setSelected={(val) => setSelectedStartHalf(val)}
                      data={['First Half', 'Second Half']}
                      save="value"
                      placeholder="Skip half (optional)"
                      search={false}
                      boxStyles={selectListBoxStyle}
                      dropdownStyles={selectListDropdownStyle}
                      inputStyles={selectListInputStyle}
                      dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
                      arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
                    />
                  </View>

                  <View style={styles.halfDayBlock}>
                    <View style={styles.halfDayHeader}>
                      <Ionicons name="calendar-outline" size={14} color={PRIMARY_DARK} />
                      <Text style={styles.halfDayLabel}>End Date</Text>
                      <Text style={styles.halfDayDate}>{secondDate}</Text>
                    </View>
                    <SelectList
                      setSelected={(val) => setSelectedEndHalf(val)}
                      data={['First Half', 'Second Half']}
                      save="value"
                      placeholder="Skip half (optional)"
                      search={false}
                      boxStyles={selectListBoxStyle}
                      dropdownStyles={selectListDropdownStyle}
                      inputStyles={selectListInputStyle}
                      dropdownTextStyles={{ color: TEXT_DARK, fontFamily: 'Lato-Medium', fontSize: 13 }}
                      arrowicon={<AntDesign name="down" size={12} color={TEXT_MUTED} />}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[styles.primaryBtn, { marginTop: 18 }]}
                >
                  <Text style={styles.primaryBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>

        {/* Bottom Submit Button */}
        <Pressable
          onPress={handleRequestLeave}
          disabled={submitting}
          style={({ pressed }) => [
            styles.requestBtn,
            (!isFormValid() || submitting) && styles.requestBtnDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="send-outline" size={16} color="#fff" />
              <Text style={styles.requestBtnText}>Request Leave</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  sectionLabel: {
    color: TEXT_DARK,
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    paddingTop: 16,
    paddingBottom: 8,
  },

  /* Date choice (Today / Select Date) */
  dateChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChoiceBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
  },
  dateChoiceBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dateChoiceText: {
    color: PRIMARY_DARK,
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
  },

  /* Selected date range card */
  dateRangeCard: {
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: '#d8e0fb',
    borderRadius: 12,
    padding: 12,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateChunk: {
    flex: 1,
  },
  dateChunkLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateChunkValue: {
    color: TEXT_DARK,
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    marginTop: 2,
  },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  daysPillText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },
  changeDateBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeDateBtnText: {
    color: PRIMARY_DARK,
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },

  /* Note */
  noteWrap: {
    position: 'relative',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    paddingBottom: 24,
    borderRadius: 10,
    minHeight: 110,
    textAlignVertical: 'top',
    color: TEXT_DARK,
    backgroundColor: '#fafbff',
    fontSize: 13,
    fontFamily: 'Lato-Regular',
  },
  noteCount: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    fontSize: 10,
    color: TEXT_MUTED,
    fontFamily: 'Lato-Medium',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31,36,64,0.35)',
  },
  modalBackdropCenter: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(31,36,64,0.35)',
    padding: 14,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e1e5f0',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: TEXT_DARK,
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f3fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    marginBottom: 14,
  },
  calendarCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  /* Buttons */
  primaryBtn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#b8c5ee',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_TINT,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
  },

  /* Half day blocks (Modal 3) */
  halfDayBlock: {
    backgroundColor: '#fafbff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  halfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  halfDayLabel: {
    color: TEXT_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },
  halfDayDate: {
    marginLeft: 'auto',
    color: PRIMARY_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },

  /* Bottom submit */
  requestBtn: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PRIMARY_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  requestBtnDisabled: {
    backgroundColor: '#b8c5ee',
    shadowOpacity: 0,
    elevation: 0,
  },
  requestBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
  },
});
