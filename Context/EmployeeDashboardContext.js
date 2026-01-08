import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../Urls/DomainUrl';

const EmployeeDashboardContext = createContext();

export const EmployeeDashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
  
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          // console.log("User Data---:", parsedData);
        }
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };
  
    loadUserData();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
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
              branchId: userData?.branchId,
              companyId: userData?.companyId,
              departmentId: "",
              designationId: "",
              employeId: userData?._id,
            }),
          }
        );

        const result = await response.json();
        if(result.statusCode === 200){
          setDashboardData(result.data);
        }else{
          setError(result.message);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <EmployeeDashboardContext.Provider
      value={{ dashboardData, loading, error }}
    >
      {children}
    </EmployeeDashboardContext.Provider>
  );
};

// Custom hook (cleaner usage)
export const useEmployeeDashboard = () => {
  return useContext(EmployeeDashboardContext);
};
