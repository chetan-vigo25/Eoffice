import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientServices } from '../../Services/ClientService/Client.Services';

export const personalInfo = createAsyncThunk(
  'client/personalInfo', // Name of the action
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientServices.personalInfo(); // Pass requestBody
      // console.log('info data', response);
      return response; 
    } catch (error) {
      return rejectWithValue(error.message); 
    }
  }
);

// Create a slice for company data
const clientSlice = createSlice({
  name: 'client', // Name of the slice
  initialState: {
    isLoading: false,
    error: null,
    personalInfoData: [],
    taskData: [],
  },
  reducers: {
    // You can add synchronous actions here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(personalInfo.pending, (state) => {
        state.isLoading = true; 
        state.error = null; 
      })
      .addCase(personalInfo.fulfilled, (state, action) => {
        state.isLoading = false; 
        state.personalInfoData = action.payload;
        state.error = null;
      })
      .addCase(personalInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
  },
});

export default clientSlice.reducer;
