import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    createdSlide: null,
};

export const addNewFullScreenSlide = createAsyncThunk(
    'AddFullScreenSlide/addNewFullScreenSlide',
    async (payload, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('groupId', String(payload.groupId));
            formData.append('userId', String(payload.userId));
            formData.append('contentPoolId', String(payload.contentPoolId));
            formData.append('title', payload.title);
            formData.append('slideType', '1');
            formData.append('priority', String(payload.priority));
            formData.append('durationSeconds', String(payload.durationSeconds));
            formData.append('startDate', payload.startDate);
            formData.append('archiveDate', payload.archiveDate);
            formData.append('mediaName', payload.mediaName);
            formData.append('targetDevices', JSON.stringify(payload.targetDevices));

            if (payload.file) {
                formData.append('file', payload.file);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/addNewFullScreenSlide`,
                formData,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to create fullscreen slide' }
            );
        }
    }
);

const AddFullScreenSlideSlice = createSlice({
    name: 'AddFullScreenSlide',
    initialState,
    reducers: {
        resetAddFullScreenSlideState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addNewFullScreenSlide.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addNewFullScreenSlide.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.createdSlide = action.payload;
                state.error = null;
            })
            .addCase(addNewFullScreenSlide.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetAddFullScreenSlideState } = AddFullScreenSlideSlice.actions;
export default AddFullScreenSlideSlice.reducer;
