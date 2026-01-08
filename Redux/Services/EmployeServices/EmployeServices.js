import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../Urls/DomainUrl';

export const employeServices = {
  // Get Employee Dashboard Data
  employeDashboard: async (employeData) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', `Bearer ${token}`);

      // Use the employeData parameter passed to the function
      const raw = JSON.stringify({
        branchId: employeData?.branchId,
        companyId: employeData?.companyId,
        departmentId: null,
        designationId: null,
        employeId: employeData?._id,
      });

      console.log('📤 Employee Dashboard Request:', raw);

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      const response = await fetch(
        `${BASE_URL}/admin/employe/dashboard`,
        requestOptions
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Employee Dashboard API Response:', result);

      return result;
    } catch (error) {
      console.error('❌ Employee Dashboard API Error:', error);
      throw error;
    }
  },
};
