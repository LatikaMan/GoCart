'use client'
import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect } from "@clerk/nextjs"
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { clearCart } from '@/lib/features/cart/cartSlice'; // Agar fetchCart cartSlice me hai toh usey bhi yahan import karein

const OrderSummary = ({ totalPrice, items }) => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const router = useRouter();

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    // Remove the line below to avoid redeclaring the 'router' variable
    // const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if (!user) {
                return toast('Please login to proceed');
            }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCoupon(data.coupon);
            toast.success('Coupon applied successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to apply coupon');
        }
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!user) {
            toast('Please login to proceed');
            throw new Error('User not logged in');
        }
        if (!selectedAddress) {
            toast.error('Please select an address');
            throw new Error('Address not selected');
        }

        try {
            const token = await getToken();
            const normalizedItems = items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
            }));

            const normalizedAddressId =
                selectedAddress?.id ||
                selectedAddress?.addressId ||
                selectedAddress?._id;

           const orderData = {
                items: normalizedItems,
                addressId: normalizedAddressId,
                paymentMethod,
            }

            if (coupon) {
                orderData.couponCode = coupon.code;
            }

            if (!normalizedAddressId) {
                toast.error('Selected address is missing an ID');
                throw new Error('Selected address is invalid');
            }
            

            const { data } = await axios.post('/api/orders', orderData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (paymentMethod === 'STRIPE') {
                if (!data?.session?.url) {
                    throw new Error('Stripe session url missing');
                }
                window.location.href = data.session.url;
            } else {
                toast.success('Order placed successfully');
                dispatch(clearCart()); // fetchCart crash kar raha tha, isliye safe side ke liye clearCart use kiya
                router.push('/orders');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to place order');
            throw error; // Promise ko fail karne ke liye zaroor return karein taaki toast loader ruk sake
        }
    }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="STRIPE" name='payment' onChange={() => setPaymentMethod('STRIPE')} checked={paymentMethod === 'STRIPE'} className='accent-gray-500' />
                <label htmlFor="STRIPE" className='cursor-pointer'>Stripe Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p><Protect plan={'plan'} fallback={`${currency}5`}>Free</Protect></p>
                        {coupon && <p>{`-${currency}${(coupon.discount / 100 * totalPrice).toFixed(2)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...', success: 'Coupon Verified', error: 'Invalid Coupon' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>
                    <Protect plan={'plan'} fallback={`${currency}${coupon ?
                        (totalPrice + 5 - (coupon.discount / 100 * totalPrice)).toFixed(2) :
                        (totalPrice + 5).toLocaleString()
                    }`}>
                        {currency}{coupon ?
                            (totalPrice - (coupon.discount / 100 * totalPrice)).toFixed(2) :
                            totalPrice.toLocaleString()}
                    </Protect>
                </p>
            </div>
            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'placing Order...', success: 'Order Placed!', error: 'Could not place order' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary