import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    updatedContentPoolStatus: null,
};

export const updateContentPoolStatus = createAsyncThunk(
    'UpdateContentPoolStatus/updateContentPoolStatus',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/contentPoolApplication/updateContentPoolStatus`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to update content pool status' }
            );
        }
    }
);

const UpdateContentPoolStatusSlice = createSlice({
    name: 'UpdateContentPoolStatus',
    initialState,
    reducers: {
        resetUpdateContentPoolStatusState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateContentPoolStatus.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateContentPoolStatus.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.updatedContentPoolStatus = action.payload;
                state.error = null;
            })
            .addCase(updateContentPoolStatus.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetUpdateContentPoolStatusState } = UpdateContentPoolStatusSlice.actions;
export default UpdateContentPoolStatusSlice.reducer;
