import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid, Platform, Alert } from 'react-native';

let unauthorizedInFlight = false;

const showSessionToast = () => {
  const msg = 'Session expired. Please log in again.';
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

// Detect an unauthorized API response (token denied / expired).
// Server returns statusCode 401 in the JSON body.
export const isUnauthorized = (result) => {
  if (!result) return false;
  const code = Number(result?.statusCode ?? result?.status);
  if (code === 401 || code === 403) return true;
  const msg = String(result?.message || '').toLowerCase();
  return msg.includes('access token') || msg.includes('invalid token') || msg.includes('unauthorized');
};

// Centralized auto-logout for the employee flow.
// Clears local auth state and resets navigation back to Splash login screen.
// `contextLogout` is the UserContext logout() (optional — falls back to clearing storage).
export const handleEmployeUnauthorized = async (navigation, contextLogout) => {
  if (unauthorizedInFlight) return;
  unauthorizedInFlight = true;

  try {
    showSessionToast();
  } catch (_) {}

  try {
    if (typeof contextLogout === 'function') {
      await contextLogout();
    } else {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('checkInData');
      await AsyncStorage.removeItem('attendanceRecordId');
    }
  } catch (e) {
    console.log('handleEmployeUnauthorized cleanup error:', e);
  }

  try {
    if (navigation?.reset) {
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    } else if (navigation?.navigate) {
      navigation.navigate('Splash');
    }
  } catch (e) {
    console.log('handleEmployeUnauthorized navigation error:', e);
  }

  // Allow another trigger after a short cooldown so subsequent requests don't double-fire.
  setTimeout(() => { unauthorizedInFlight = false; }, 1500);
};

export const checkAutoLogin = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    
    if (token && userData) {
      // Validate that userData is parseable
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && (parsedUserData._id || parsedUserData.id)) {
        return { isLoggedIn: true, userData: parsedUserData };
      }
    }
    
    return { isLoggedIn: false, userData: null };
  } catch (error) {
    console.error('Auto login check error:', error);
    return { isLoggedIn: false, userData: null };
  }
};

export const clearLoginData = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('dashboardData'); // Optional: clear cached data
  } catch (error) {
    console.error('Clear login data error:', error);
  }
};