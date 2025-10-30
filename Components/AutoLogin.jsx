
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../Urls/DomainUrl';

export default function AutoLogin({navigation}) {

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');

        if (token && userData) {
          // Check if token is still valid by calling profile API
          const res = await fetch(`${BASE_URL}/client/auth/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.status === 200) {
            // Token is still valid
            const profile = await res.json();
            navigation.reset({
              index: 0,
              routes: [{ name: 'ClientDash', params: { userData: JSON.parse(userData)}}],
            });
          } else {
            // Token invalid (maybe logged in from another device)
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Splash' }],
            });
          }
        } else {
          // No token or userData, stay at splash or go to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Splash' }],
          });
        }
      } catch (error) {
        console.error('Auto login error:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Splash' }],
        });
      }
    };
    autoLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Loading spinner while checking login status */}
      <ActivityIndicator size="large" color="#658eff" />
    </View>
  );
}
