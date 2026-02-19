import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from '../Slices/AuthSlice';
import addContentPoolReducer from '../Slices/AddContentPoolSlice';
import getContentPoolReducer from '../Slices/GetContentPoolSlice';
import updateContentPoolStatusReducer from '../Slices/UpdateContentPoolStatusSlice';
import updateAlwaysOnInsertionModeReducer from '../Slices/UpdateAlwaysOnInsertionModeSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    AddContentPool: addContentPoolReducer,
    GetContentPool: getContentPoolReducer,
    UpdateContentPoolStatus: updateContentPoolStatusReducer,
    UpdateAlwaysOnInsertionMode: updateAlwaysOnInsertionModeReducer,
});

const Store = configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
});

export default Store;
