import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    addedContentPool: null,
};

export const addContentPool = createAsyncThunk(
    'AddContentPool/addContentPool',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(`${serverUrl}/o/contentPoolApplication/addNewContentPool`, payload, config);
            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to add content pool' }
            );
        }
    }
);

const AddContentPoolSlice = createSlice({
    name: 'AddContentPool',
    initialState,
    reducers: {
        resetAddContentPoolState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addContentPool.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addContentPool.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.addedContentPool = action.payload;
                state.error = null;
            })
            .addCase(addContentPool.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetAddContentPoolState } = AddContentPoolSlice.actions;
export default AddContentPoolSlice.reducer;
