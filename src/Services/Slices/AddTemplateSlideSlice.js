import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { serverUrl } from '../Constants/Constants';

const initialState = {
    status: 'idle',
    error: null,
    createdSlide: null,
};

export const addNewTemplateSlide = createAsyncThunk(
    'AddTemplateSlide/addNewTemplateSlide',
    async (payload, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('groupId', String(payload.groupId));
            formData.append('userId', String(payload.userId));
            formData.append('contentPoolId', String(payload.contentPoolId));
            formData.append('title', payload.title || '');
            formData.append('subtitle', payload.subtitle || '');
            formData.append('articleUrl', payload.articleUrl || '');
            formData.append('webDescription', payload.webDescription || '');
            formData.append('totemDescription', payload.totemDescription || '');
            formData.append('linkUrl', payload.linkUrl || '');
            formData.append('configJSON', payload.configJSON || '');
            formData.append('slideType', '2');
            formData.append('priority', String(payload.priority));
            formData.append('durationSeconds', String(payload.durationSeconds));
            formData.append('startDate', payload.startDate);
            formData.append('archiveDate', payload.archiveDate);
            formData.append('targetDevices', JSON.stringify(payload.targetDevices || []));

            if (payload.renderedTemplateFile) {
                formData.append('renderedTemplateFile', payload.renderedTemplateFile);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            };

            const response = await axios.post(
                `${serverUrl}/o/slidesApplication/addNewTemplateSlide`,
                formData,
                config
            );

            if (!response.data?.success) {
                return rejectWithValue(response.data);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data || { message: error.message || 'Failed to create template slide' }
            );
        }
    }
);

const AddTemplateSlideSlice = createSlice({
    name: 'AddTemplateSlide',
    initialState,
    reducers: {
        resetAddTemplateSlideState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addNewTemplateSlide.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addNewTemplateSlide.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.createdSlide = action.payload;
                state.error = null;
            })
            .addCase(addNewTemplateSlide.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { resetAddTemplateSlideState } = AddTemplateSlideSlice.actions;
export default AddTemplateSlideSlice.reducer;
