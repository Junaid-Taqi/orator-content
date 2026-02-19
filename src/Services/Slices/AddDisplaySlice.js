import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    addedDisplay: null,
};

export const addDisplay = createAsyncThunk(
    'AddDisplay/addDisplay',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/displayManagementApplication/addNewDisplay`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to add display' }
            );
        }
    }
);

const AddDisplaySlice = createSlice({
    name: 'AddDisplay',
    initialState,
    reducers: {
        resetAddDisplayState: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addDisplay.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addDisplay.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.addedDisplay = action.payload;
                state.error = null;
            })
            .addCase(addDisplay.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetAddDisplayState } = AddDisplaySlice.actions;
export default AddDisplaySlice.reducer;
