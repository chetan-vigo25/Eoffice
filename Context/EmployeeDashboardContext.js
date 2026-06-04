import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../Urls/DomainUrl';

const EmployeeDashboardContext = createContext();

export const EmployeeDashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  const fetchDashboard = async (user) => {
    if (!user) return;
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(
        `${BASE_URL}/admin/employe/hrmsDashboard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branchId: user.branchId,
            companyId: user.companyId,
            departmentId: "",
            designationId: "",
            employeId: user._id,
          }),
        }
      );

      const result = await response.json();

      if (result.statusCode === 200) {
        // console.log('Fetched dashboardData:', result.data);
        setDashboardData(result.data);
        await AsyncStorage.setItem('dashboardData', JSON.stringify(result.data));
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        const storedDashboardData = await AsyncStorage.getItem('dashboardData');
        // console.log('Loaded userData:', storedUserData);
        // console.log('Loaded dashboardData:', storedDashboardData);
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUserData(parsedUser);
          // Fetch fresh data
          await fetchDashboard(parsedUser);
        }
        if (storedDashboardData) setDashboardData(JSON.parse(storedDashboardData));
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!userData) return;
  
    fetchDashboard(userData);
  }, [userData]);

  return (
    <EmployeeDashboardContext.Provider value={{ dashboardData, loading, error, fetchDashboard }} >
      {children}
    </EmployeeDashboardContext.Provider>
  );
};

// Custom hook (cleaner usage)
export const useEmployeeDashboard = () => {
  return useContext(EmployeeDashboardContext);
};
