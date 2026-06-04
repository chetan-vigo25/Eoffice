import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  FontAwesome5,
  Ionicons,
  Foundation,
  MaterialIcons,
  Entypo,
} from '@expo/vector-icons';

/* -------------------- CARD DATA -------------------- */

const cards = [
  {
    title: 'Leave',
    subtitle: 'Apply & track',
    route: 'LeaveManagement',
    bg: '#FFF4E5',
    accent: '#FF9800',
    height: 140,
    column: 'left',
    icon: <Ionicons name="exit-outline" size={22} color="#FF9800" />,
  },
  {
    title: 'Payroll',
    subtitle: 'Salary & slips',
    route: 'Payroll',
    bg: '#F3E8FB',
    accent: '#9C27B0',
    height: 180,
    column: 'left',
    icon: <FontAwesome5 name="dollar-sign" size={20} color="#9C27B0" />,
    footer: true,
    footerIcon: {
      type: 'Entypo',
      name: 'bar-graph',
      color: '#9C27B0',
    },
  },
  {
    title: 'Attendance',
    subtitle: 'Daily summary',
    route: 'EmployeAttendance',
    bg: '#E8F6EA',
    accent: '#4CAF50',
    height: 180,
    column: 'right',
    icon: <FontAwesome5 name="user-clock" size={18} color="#4CAF50" />,
    footer: true,
    footerIcon: {
      type: 'Foundation',
      name: 'graph-bar',
      color: '#4CAF50',
    },
  },
  {
    title: 'Work From Home',
    subtitle: 'Request WFH',
    route: 'EmployeWFH',
    bg: '#E3F1FD',
    accent: '#2196F3',
    height: 140,
    column: 'right',
    icon: <MaterialIcons name="home-work" size={22} color="#2196F3" />,
  },
];

const FooterIcon = ({ icon }) => {
  if (!icon) return null;
  const { type, name, color } = icon;
  if (type === 'Foundation')
    return <Foundation name={name} size={36} color={color} />;
  if (type === 'Ionicons')
    return <Ionicons name={name} size={36} color={color} />;
  if (type === 'MaterialIcons')
    return <MaterialIcons name={name} size={36} color={color} />;
  if (type === 'Entypo')
    return <Entypo name={name} size={36} color={color} />;
  return null;
};

const Card = ({ item, navigation }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => navigation.navigate(item.route)}
    style={[styles.card, { height: item.height, backgroundColor: item.bg }]}
  >
    <View style={styles.cardTop}>
      <View style={styles.iconWrap}>{item.icon}</View>
      <View style={[styles.arrow, { backgroundColor: '#ffffff' }]}>
        <Entypo name="chevron-right" size={14} color={item.accent} />
      </View>
    </View>

    <View style={styles.cardBottom}>
      <Text style={[styles.title, { color: item.accent }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.subtitle}
      </Text>

      {item.footer && (
        <View style={styles.footer}>
          <View style={[styles.dotPill, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.dotText, { color: item.accent }]}>View</Text>
          </View>
          <FooterIcon icon={item.footerIcon} />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const DashboardCards = ({ navigation }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}>
        {cards
          .filter(item => item.column === 'left')
          .map((item, index) => (
            <Card key={index} item={item} navigation={navigation} />
          ))}
      </View>

      <View style={{ flex: 1 }}>
        {cards
          .filter(item => item.column === 'right')
          .map((item, index) => (
            <Card key={index} item={item} navigation={navigation} />
          ))}
      </View>
    </View>
  );
};

export default DashboardCards;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    marginTop: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  dotPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dotText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
});
