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
import { IMAGE_FILEPATH_URL } from '../../../../Urls/DomainUrl';

const EmployeeLeaveCard = ({ onApplyLeave, navigation }) => {
  const { dashboardData, loading, error } = useEmployeeDashboard();

 useEffect(() => {
     if (dashboardData) {
      //  console.log('Dashboard Data todayOnLeave:', dashboardData?.todayOnLeave);
     }
 }, [dashboardData])

const employeesOnLeave = dashboardData?.todayOnLeave || [];

// Filter employees on leave today
  return (
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Employees on Leave Today</Text>
        <Text style={{ color: '#4c72d9', fontSize: 14, fontFamily: "Lato-SemiBold" }}>{employeesOnLeave.length}</Text>
      </View>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
        {employeesOnLeave.length === 0 ? (
          <Text style={styles.noEmployeesText}>No employees on leave today</Text>
        ) : (
          employeesOnLeave.map((emp) => (
            <View key={emp._id} style={styles.employeeContainer}>
              <View style={styles.avatarContainer}>
                {
                    emp.employeProfileImage ? (
                      <Image source={{ uri: `${IMAGE_FILEPATH_URL}/${emp.employeProfileImage}` }} style={{ height: 42, width: 42, borderRadius: 21 }} />
                    ) : (
                      <Text style={styles.avatarText}>{emp.employename.charAt(0)}</Text>
                    )
                }
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{emp.employename}</Text>
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
    marginBottom: 0,
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
    fontFamily: 'Lato-SemiBold',
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
    fontFamily: 'Lato-Medium',
  },
});
