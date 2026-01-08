import { combineReducers } from '@reduxjs/toolkit';
import authenticationSlice from './Reducer/Auth/Auth.reducers';
import companySlice from '../Redux/Reducer/Company/Company.Reducer';
import clientSlice from '../Redux/Reducer/Client/Client.Reducer';
import employeSlice from '../Redux/Reducer/EmployeDash/Employe.Reducer';

const rootReducer = combineReducers({
  authentication: authenticationSlice,
  company: companySlice,
  client: clientSlice,
  employe: employeSlice,
});

export default rootReducer;