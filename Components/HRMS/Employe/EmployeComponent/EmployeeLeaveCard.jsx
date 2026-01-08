import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';
import moment from 'moment';

const EmployeeLeaveCard = ({ onApplyLeave, navigation }) => {
  const { dashboardData, loading, error } = useEmployeeDashboard();
// console.log("Dashboard Data in EmployeeLeaveCard:", dashboardData.data.employeBirthday);
// const employeesOnLeave = [
//   { id: 1, name: 'Aarav Sharma', role: 'Frontend Developer', leaveDate: '2026-01-03', image: require('../../../../assets/userImg.jpg') },
//   { id: 2, name: 'Heena Verma', role: 'UI/UX Designer', leaveDate: '2026-01-02' },
//   { id: 3, name: 'Vishwas Mehta', role: 'Backend Developer', leaveDate: '2026-01-02' },
// ];

// Get today's date in 'YYYY-MM-DD' format
const todayDate = new Date().toISOString().split('T')[0];

 useEffect(() => {
     if (dashboardData) {
      //  console.log('Dashboard Data:', dashboardData);
     }
 }, [dashboardData])

const employeesOnLeave = dashboardData?.todayOnLeave || [];

// Filter employees on leave today
  return (
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Employees on Leave Today</Text>
        <TouchableOpacity onPress={()=> navigation.navigate('LeaveManagement')} style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
        {employeesOnLeave.length === 0 ? (
          <Text style={styles.noEmployeesText}>No employees on leave today</Text>
        ) : (
          employeesOnLeaveToday.map((emp) => (
            <View key={emp._id} style={styles.employeeContainer}>
              <View style={styles.avatarContainer}>
                {
                    emp.profileImage ? (
                      <Image source={{ uri: `https://api.vieasyoffice.com/public/${emp.profileImage}` }} style={{ height: 42, width: 42, borderRadius: 21 }} />
                    ) : (
                      <Text style={styles.avatarText}>{emp.fullName.charAt(0)}</Text>
                    )
                }
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{emp.fullName}</Text>
                <Text style={styles.employeeRole}>{emp.email}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default EmployeeLeaveCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  applyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  employeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 8,
  },
  avatarContainer: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '700',
    color: '#4A90E2',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  employeeRole: {
    fontSize: 13,
    color: '#888',
  },
  leaveDate: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  noEmployeesText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginTop: 0,
    fontFamily: 'Poppins-Medium',
  },
});
