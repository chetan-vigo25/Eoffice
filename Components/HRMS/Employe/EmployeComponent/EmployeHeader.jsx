import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGE_FILEPATH_URL } from '../../../../Urls/DomainUrl';

export default function EmployeHeader({ navigation }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue != null) {
          setUserData(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Failed to load user data from AsyncStorage', e);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <View style={{ flex: 8 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#868686' }}>Hello,</Text>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#868686' }}>
          {userData?.fullName || 'User'}
        </Text>
      </View>
      <TouchableOpacity onPress={()=> navigation.navigate('EmployeProfile')} style={{ width: 50, height: 50, borderRadius: 50, overflow: 'hidden' }}>
        <Image
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

