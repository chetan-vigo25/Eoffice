import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useEmployeeDashboard } from '../../../../Context/EmployeeDashboardContext';
import IMAGE_FILEPATH_URL from '../../../../Urls/DomainUrl';

const EmployeBirthdayCard = ({ navigation }) => {
  const { dashboardData } = useEmployeeDashboard();

  useEffect(() => {
    if (dashboardData) {
      // noop
    }
  }, [dashboardData]);

  const employeesTodayBirthday = dashboardData?.todayBirthday || [];
  // console.log('Employees with birthdays today:', employeesTodayBirthday);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <FontAwesome5 name="birthday-cake" size={12} color="#fff" />
          </View>
          <Text style={styles.headerText}>Birthdays Today</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{employeesTodayBirthday.length}</Text>
        </View>
      </View>

      {employeesTodayBirthday.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="gift-outline" size={20} color="#b6c1cd" />
          </View>
          <Text style={styles.emptyText}>No birthdays today</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
          {employeesTodayBirthday.map((emp) => (
            <View key={emp._id} style={styles.employeeContainer}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarContainer}>
                  {emp.profileImage ? (
                    <Image
                      source={{ uri: `${IMAGE_FILEPATH_URL}/${emp.profileImage}` }}
                      style={{ height: 38, width: 38, borderRadius: 19 }}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {(emp.fullName || '?').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.statusBadge}>
                  <Text style={{ fontSize: 8 }}>🎂</Text>
                </View>
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName} numberOfLines={1}>
                  {emp.fullName}
                </Text>
                <Text style={styles.wishPill}>Wish them 🎉</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default EmployeBirthdayCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: '#4c72d9',
    // shadowOpacity: 0.06,
    // shadowRadius: 10,
    // shadowOffset: { width: 0, height: 4 },
    // elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    color: '#1f2440',
    fontFamily: 'Lato-SemiBold',
  },
  countPill: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 8,
    backgroundColor: '#fce7f3',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPillText: {
    color: '#ec4899',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
  },
  employeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: '#fff7fb',
    borderWidth: 1,
    borderColor: '#fde2ef',
    borderRadius: 12,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#fbcfe8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#ec4899',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeInfo: {
    marginLeft: 10,
    paddingRight: 6,
    maxWidth: 130,
  },
  employeeName: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    textTransform: 'capitalize',
  },
  wishPill: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    color: '#ec4899',
  },
  emptyWrap: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f3fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#7c84a3',
    fontFamily: 'Lato-Medium',
  },
});
