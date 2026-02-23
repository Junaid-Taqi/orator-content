import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    deletedSlide: null,
};

export const deleteSlideByUser = createAsyncThunk(
    'DeleteSlideByUser/deleteSlideByUser',
    async (payload, { rejectWithValue }) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/deleteSlideByUser`,
                payload,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to delete slide' }
            );
        }
    }
);

const DeleteSlideByUserSlice = createSlice({
    name: 'DeleteSlideByUser',
    initialState,
    reducers: {
        resetDeleteSlideByUserState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(deleteSlideByUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteSlideByUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.deletedSlide = action.payload;
                state.error = null;
            })
            .addCase(deleteSlideByUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetDeleteSlideByUserState } = DeleteSlideByUserSlice.actions;
export default DeleteSlideByUserSlice.reducer;
