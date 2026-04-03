import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGE_FILEPATH_URL } from '../../../../Urls/DomainUrl';
import { UserContext } from '../../../../Context/UserProvider';

export default function EmployeHeader({ navigation, userData: propUserData }) {
  const { userData: contextUserData, isLoading } = useContext(UserContext);

  const userData = propUserData || contextUserData;
  return (
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <View style={{ flex: 8 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#868686' }}>Hello,</Text>
        <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: '#868686' }}>
          {userData?.fullName || 'User'}
        </Text>
      </View>
      <TouchableOpacity onPress={()=> navigation.navigate('EmployeProfile')} style={{ width: 50, height: 50, borderRadius: 50, overflow: 'hidden', borderWidth:2, borderColor:'#658eff', }}>
        <Image
          key={userData?.profileImage}
          source={
            userData?.profileImage
              ? { uri: `${IMAGE_FILEPATH_URL}/${userData.profileImage}` }
              : require('../../../../assets/userIcon.jpeg')
          }
          style={{ width: '100%', height: '100%' }}
        />
      </TouchableOpacity>
    </View>
  );
};

