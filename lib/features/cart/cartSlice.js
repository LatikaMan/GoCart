import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'



let debounceTimer = null;

export const uploadedCart = createAsyncThunk('cart/uploadCart',
    async ({ cart, getToken }, thunkAPI) => {
        
        if (debounceTimer) clearTimeout(debounceTimer);

        return new Promise((resolve, reject) => {
            debounceTimer = setTimeout(async () => {
                try {
                    const token = await getToken();
                    
                
                    const { cartItems } = thunkAPI.getState().cart; 
                    
                    
                    const { data } = await axios.post("/api/cart", { cart: cartItems }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    
                    
                    resolve(data);
                } catch (error) {
                    
                    reject(thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to upload cart"));
                }
            }, 1000); 
        });
    }
);


export const fetchCart = createAsyncThunk('cart/fetchCart',
         async ({ getToken }, thunkAPI) => {
            try {
                const token = await getToken()
                const { data } = await axios.get("/api/cart", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                return data.cart
            } catch (error) {
                return thunkAPI.rejectWithValue("Failed to fetch cart")
            }
        }
    )


const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.fulfilled, (state, action) => {
    state.cartItems = action.payload || {};
    state.total = Object.values(action.payload || {}).reduce(
        (acc, item) => acc + item,
        0
    );
})
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
