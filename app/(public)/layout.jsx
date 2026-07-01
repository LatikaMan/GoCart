"use client"

import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth , useUser } from "@clerk/nextjs";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { fetchCart, uploadedCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchingRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {
    const dispatch = useDispatch()
    const {user} = useUser()
    const {getToken} =  useAuth()

    const { cartItems } = useSelector(state => state.cart)


useEffect(() => {
    dispatch(fetchProducts({}));
}, [dispatch]);

useEffect(() => {
    if (!user) return;

    dispatch(fetchCart({ getToken }));
    dispatch(fetchAddress({ getToken }));
    dispatch(fetchProducts({ getToken }));
}, [user, dispatch, getToken]);

useEffect(() => {
    if (!user) return;

    dispatch(uploadedCart({ cart: cartItems, getToken }));
}, [cartItems, user, dispatch, getToken]);


    return (
       <>
       
            <Banner />
            <Navbar />
            {children}
            <Footer />
       </>
    );
}
