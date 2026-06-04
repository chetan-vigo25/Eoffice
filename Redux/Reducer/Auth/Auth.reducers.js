import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authServices } from "../../Services/Auth.services";
import { ToastAndroid, Alert } from "react-native";

const initialState = {
  
};

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export const login = createAsyncThunk(
  "authentication/login",
  async (userData, { rejectWithValue }) => {
    try {
      if (!userData.userName || !userData.password) {
        showToast("Please fill in all fields");
        return rejectWithValue("Empty fields");
      }
      // console.log("Sending login request with data:", userData);
      const user = await authServices.login(userData);
      // console.log("user--------", user)
      showToast(user.userinfo.message)
      if (user) {
        // console.log("message............",user);
        return user;
      } else {
        showToast("Try again...!");
        return rejectWithValue("Invalid login");
      }
    } catch (error) {
        console.log("error", error.data.message)
        const errorMessage = error?.data?.message || "Something went wrong!";
        showToast(errorMessage);
      return rejectWithValue(error.message);
    }
  }
);

const authenticationSlice = createSlice({
  name: "authentication",
  initialState,
  reducers: {
    logout(state) {
      state.loggedIn = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.login_loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.login_loading = false;
        state.loggedIn = true;
        state.user = action.payload.userinfo;
      })
      .addCase(login.rejected, (state, action) => {
        state.login_loading = false;
        state.error = action.payload;
      })
  },
});

export const { logout } = authenticationSlice.actions;

export default authenticationSlice.reducer;