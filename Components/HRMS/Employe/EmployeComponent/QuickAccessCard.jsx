import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    title: 'Leave Management',
    route: 'LeaveManagement',
    bg: '#FF980020',
    height: 140,
    column: 'left',
    icon: <Ionicons name="exit-outline" size={24} color="#6a8ff390" />,
  },
  {
    title: 'Payroll Management',
    route: 'Payroll',
    bg: '#9C27B020',
    height: 180,
    column: 'left',
    icon: <FontAwesome5 name="dollar-sign" size={20} color="#6a8ff390" />,
    footer: true,
    footerIcon: {
      type: 'Entypo',
      name: 'bar-graph',
      color: '#9C27B090',
    },
  },
  {
    title: 'Attendance Management',
    route: 'EmployeAttendance',
    bg: '#4CAF5020',
    height: 180,
    column: 'right',
    icon: <FontAwesome5 name="user" size={20} color="#6a8ff390" />,
    footer: true,
    footerIcon: {
      type: 'Foundation',
      name: 'graph-bar',
      color: '#4CAF5090',
    },
  },
  {
    title: 'WFH Management',
    route: 'EmployeWFH',
    bg: '#2196F320',
    height: 140,
    column: 'right',
    icon: <MaterialIcons name="broadcast-on-home" size={20} color="#6a8ff390" />,
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
    onPress={() => navigation.navigate(item.route)}
    style={{
      width: '100%',
      height: item.height,
      justifyContent: 'center',
      backgroundColor: item.bg,
      borderRadius: 6,
      padding: 20,
      marginBottom: 10,
    }}
  >
    <View
      style={{
        width: 45,
        height: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginBottom: 10,
      }}
    >
      {item.icon}
    </View>

    <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold' }}>
      {item.title}
    </Text>
    {item.footer && (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Lato-Medium',
            color: '#444',
          }}
        >
          $
        </Text>

        <FooterIcon icon={item.footerIcon} />
      </View>
    )}
  </TouchableOpacity>
);
const DashboardCards = ({ navigation }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {/* LEFT COLUMN */}
      <View style={{ flex: 1 }}>
        {cards
          .filter(item => item.column === 'left')
          .map((item, index) => (
            <Card key={index} item={item} navigation={navigation} />
          ))}
      </View>

      {/* RIGHT COLUMN */}
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
