import { createSlice } from '@reduxjs/toolkit'
import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';
export const fetchingRatings = createAsyncThunk('rating/fetchRatings', 
    async ({getToken}, thunkAPI) => {
        try {
            const token = await getToken();
            const {data} = await axios.get('/api/rating', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data? data.ratings:[]

            
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch ratings');
            
        }
    }
) 
const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [],
    },
    reducers: {
        addRating: (state, action) => {
            state.ratings.push(action.payload)
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchingRatings.fulfilled, (state, action) => {
            state.ratings = action.payload
        })
    }
})

export const { addRating } = ratingSlice.actions

export default ratingSlice.reducer