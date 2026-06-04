import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { EMPLOYEE_SCREEN } from '../Urls/DomainUrl';
import { useDispatch } from 'react-redux';
import { logout } from "../Redux/Reducer/Auth/Auth.reducers";

export default function AutoLogin({navigation}) {
  const dispatch = useDispatch();

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // ── Employee auto-login (checked first) ──────────────────────────
        const authToken    = await AsyncStorage.getItem('authToken');
        const empUserDataStr = await AsyncStorage.getItem('userData');
        if (authToken && empUserDataStr) {
          const empUserData = JSON.parse(empUserDataStr);
          if (empUserData?._id || empUserData?.id) {
            navigation.reset({
              index: 0,
              routes: [{ name: EMPLOYEE_SCREEN, params: { userData: empUserData } }],
            });
            return;
          }
        }

        // ── Client auto-login ─────────────────────────────────────────────
        const token    = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');

        if (token && userData) {
          const res = await fetch(`${BASE_URL}/client/auth/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.status === 200) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ClientDash', params: { userData: JSON.parse(userData) } }],
            });
          } else if (res.status === 401) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            dispatch(logout());
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          } else {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
        }
      } catch (error) {
        console.error('Auto login error:', error);
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
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