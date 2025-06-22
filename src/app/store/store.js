import { configureStore } from '@reduxjs/toolkit';
import deviceReducer from './slices/deviceSlice';
import customerReducer from './slices/customerSlice';
import customerDeviceReducer from './slices/customerDeviceSlice';
import deviceLogReducer from './slices/deviceLogSlice';
import reportsReducer from './slices/reportsSlice';
import authReducer from './slices/authSlice';
import systemUsersReducer from './slices/systemUsersSlice';

export const store = configureStore({
  reducer: {
    device: deviceReducer,
    customer: customerReducer,
    customerDevice: customerDeviceReducer,
    deviceLog: deviceLogReducer,
    reports: reportsReducer,
    auth: authReducer,
    systemUsers: systemUsersReducer,
  },
}); 