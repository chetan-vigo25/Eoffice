import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAutoLogin = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    
    if (token && userData) {
      // Validate that userData is parseable
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && parsedUserData._id) {
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