import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    updatedAlwaysOnInsertionMode: null,
};

export const updateAlwaysOnInsertionMode = createAsyncThunk(
    'UpdateAlwaysOnInsertionMode/updateAlwaysOnInsertionMode',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/contentPoolApplication/updateAlwaysOnInsertionMode`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to update Always On insertion mode' }
            );
        }
    }
);

const UpdateAlwaysOnInsertionModeSlice = createSlice({
    name: 'UpdateAlwaysOnInsertionMode',
    initialState,
    reducers: {
        resetUpdateAlwaysOnInsertionModeState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateAlwaysOnInsertionMode.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateAlwaysOnInsertionMode.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.updatedAlwaysOnInsertionMode = action.payload;
                state.error = null;
            })
            .addCase(updateAlwaysOnInsertionMode.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetUpdateAlwaysOnInsertionModeState } = UpdateAlwaysOnInsertionModeSlice.actions;
export default UpdateAlwaysOnInsertionModeSlice.reducer;
