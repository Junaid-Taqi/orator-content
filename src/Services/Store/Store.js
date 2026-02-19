import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from "../Slices/AuthSlice";
import addDisplayReducer from "../Slices/AddDisplaySlice";
import getDisplaysReducer from "../Slices/GetDisplaysSlice";

const rootReducer = combineReducers({
    auth: authReducer,
    AddDisplay: addDisplayReducer,
    GetDisplays: getDisplaysReducer,
});

const Store = configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
});

export default Store;
