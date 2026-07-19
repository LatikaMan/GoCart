import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import Stripe from "stripe";

// =======================
// PLACE ORDER
// =======================
export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);

        if (!userId) {
            return NextResponse.json(
                { error: "Not Authorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const items = body.items;
        const currentPaymentMethod =
            body.paymentMethod || body.incomingPaymentMethod;

        const addressId = body.addressId || body.address;

        const couponCode = body.couponCode || body.coupon;

        if (
            !addressId ||
            !items ||
            !currentPaymentMethod ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return NextResponse.json(
                { error: "Invalid Request" },
                { status: 400 }
            );
        }

        let coupon = null;

        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: {
                    code: couponCode.toUpperCase(),
                },
            });

            if (!coupon) {
                return NextResponse.json(
                    { error: "Invalid Coupon" },
                    { status: 400 }
                );
            }
        }

        // New User Coupon
        if (coupon && coupon.forNewUser) {
            const oldOrders = await prisma.order.findMany({
                where: { userId },
            });

            if (oldOrders.length > 0) {
                return NextResponse.json(
                    {
                        error: "Coupon only for new users",
                    },
                    { status: 400 }
                );
            }
        }

        // Plus Member Coupon
        const isPlusMember = typeof has === "function" ? has({ plan: "plus" }) : false;

        if (coupon && coupon.forMember && !isPlusMember) {
            return NextResponse.json(
                {
                    error: "Coupon only for Plus Members",
                },
                { status: 400 }
            );
        }

        const ordersByStore = new Map();

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
            });

            if (!product) {
                return NextResponse.json(
                    {
                        error: "Product not found",
                    },
                    { status: 400 }
                );
            }

            if (!ordersByStore.has(product.storeId)) {
                ordersByStore.set(product.storeId, []);
            }

            ordersByStore.get(product.storeId).push({
                ...item,
                price: product.price,
            });
        }

        let fullAmount = 0;
        let shippingAdded = false;
        let orderIds = [];

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            if (coupon) {
                total =
                    total -
                    (total * (coupon.discount || 0)) / 100;
            }

            if (!shippingAdded && !isPlusMember) {
                total += 5;
                shippingAdded = true;
            }

            fullAmount += total;

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,

                    total,

                    paymentMethod: currentPaymentMethod,

                    isPaid:
                        currentPaymentMethod === PaymentMethod.COD,

                    isCouponUsed: !!coupon,

                    coupon: coupon
                        ? { code: coupon.code }
                        : {},

                    orderItems: {
                        create: sellerItems.map((item) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
            });

            orderIds.push(order.id);
        }
        if(currentPaymentMethod === PaymentMethod.STRIPE){
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const origin = request.nextUrl?.origin || request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

            if (!origin) {
                return NextResponse.json(
                    { error: "Missing application origin for Stripe checkout" },
                    { status: 500 }
                );
            }

            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items: [
                        {
                            price_data: {
                                currency: "usd",
                                product_data: {
                                    name: "Order Payment",
                                },
                                unit_amount: Math.round(fullAmount * 100),
                            },
                            quantity: 1,
                        },
                    ],
                    mode: "payment",
                    success_url: `${origin}/loading?nextUrl=orders`,
                    cancel_url: `${origin}/cart`,
                    metadata: {
                        orderIds: orderIds.join(","),
                        userId: userId,
                        appId: "gocart",
                    },
                });

                return NextResponse.json({ session });
            } catch (stripeError) {
                console.error("Stripe checkout session creation failed:", stripeError);

                return NextResponse.json(
                    {
                        error:
                            stripeError?.message ||
                            "Failed to create Stripe checkout session",
                    },
                    { status: 500 }
                );
            }
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                cart: {},
            },
        });

        return NextResponse.json({
            success: true,
            orderIds,
            fullAmount,
        });

    } catch (error) {
        console.log(error);

        return NextResponse.json(
            {
                error: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}

// =======================
// FETCH CUSTOMER ORDERS
// =======================

export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    {
                        paymentMethod: PaymentMethod.COD,
                    },
                    {
                        AND: [
                            {
                                paymentMethod: PaymentMethod.STRIPE,
                            },
                            {
                                isPaid: true,
                            },
                        ],
                    },
                ],
            },

            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },

                address: true,

                store: true,
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            orders,
        });

    } catch (error) {
        console.log(error);

        return NextResponse.json(
            {
                error: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}