import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from '../Slices/AuthSlice';
import addContentPoolReducer from '../Slices/AddContentPoolSlice';
import getContentPoolReducer from '../Slices/GetContentPoolSlice';
import getAllSlidesReducer from '../Slices/GetAllSlidesSlice';
import updateContentPoolReducer from '../Slices/UpdateContentPoolSlice';
import updateContentPoolStatusReducer from '../Slices/UpdateContentPoolStatusSlice';
import updateAlwaysOnInsertionModeReducer from '../Slices/UpdateAlwaysOnInsertionModeSlice';
import addFullScreenSlideReducer from '../Slices/AddFullScreenSlideSlice';
import archiveSlideByUserReducer from '../Slices/ArchiveSlideByUserSlice';
import deleteSlideByUserReducer from '../Slices/DeleteSlideByUserSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    AddContentPool: addContentPoolReducer,
    GetContentPool: getContentPoolReducer,
    GetAllSlides: getAllSlidesReducer,
    UpdateContentPool: updateContentPoolReducer,
    UpdateContentPoolStatus: updateContentPoolStatusReducer,
    UpdateAlwaysOnInsertionMode: updateAlwaysOnInsertionModeReducer,
    AddFullScreenSlide: addFullScreenSlideReducer,
    ArchiveSlideByUser: archiveSlideByUserReducer,
    DeleteSlideByUser: deleteSlideByUserReducer,
});

const Store = configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
});

export default Store;
