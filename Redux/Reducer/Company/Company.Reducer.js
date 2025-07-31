import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyServices } from '../../Services/CompanyService/Company.Services';

export const companyDetail = createAsyncThunk(
  'company/companyDetail', // Name of the action
  async (userId, { rejectWithValue }) => {
    try {
      const response = await companyServices.companyDetail(userId); 
      // console.log('seriesData', response)
      return response; 
    } catch (error) {
      return rejectWithValue(error.message); 
    }
  }
);

// Create a slice for company data
const companySlice = createSlice({
  name: 'company', // Name of the slice
  initialState: {
    isLoading: false,
    error: null,
    companyData: [],
  },
  reducers: {
    // You can add synchronous actions here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(companyDetail.pending, (state) => {
        state.isLoading = true; 
        state.error = null; 
      })
      .addCase(companyDetail.fulfilled, (state, action) => {
        state.isLoading = false; 
        state.companyData = action.payload;
        state.error = null;
      })
      .addCase(companyDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default companySlice.reducer;
