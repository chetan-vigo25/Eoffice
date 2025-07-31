import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BACKEND_URL from '../Urls/DomainUrl';

// export const baseUrl = {
//     BACKEND_URL: `https://secondapi.cric365day1.com/api/v1/admin/login`,
// };

// Function to get authorization headers
async function authHeader() {
    const session = await AsyncStorage.getItem("token");
    // console.log("session", session)
    const headers = {
        "Content-Type": "application/json",
    };

    if (session) {
        headers["Authorization"] = "Bearer " + session;
    }
    return headers;
}

// Function for general API calls
export const apiCall = async (method, path, payload) => {
    
    try {
        const headers = await authHeader();
        // console.log("test-console",`${BACKEND_URL}${path}`, "headers",headers, )
        const response = await axios({
            method,
            url: `${BACKEND_URL}${path}`,
            data: payload,
            headers,
            redirect: "follow",
        });
        // console.log(response.data, "Response Data:");
        // console.log("Response Datagdsasdg:",response.data.message);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// Function for API calls with form data
export const apiCallForm = async (method, path, payload) => {
    try {
        const headers = await authHeader();
        headers["Content-Type"] = "multipart/form-data";
        
        const response = await axios({
            method,
            url: `${BACKEND_URL}${path}`,
            data: payload,
            headers,
        });
        console.log("Response Data",response.data);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// Error handling function
function handleApiError(error) {
    if (Number(error?.response?.data?.code) === 3 || Number(error?.response?.status) === 401) {
        // Handle unauthorized access (e.g., logout user or redirect)
    } else if (error.response) {
        throw error.response;
    } else if (error.request) {
        // console.log("sfsdfdsf",error.request)
        throw new Error("No response received from the server");
    } else {
        console.error("Error occurred during request setup:", error);
        throw new Error(error.message);
    }
}
