import { auth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(request) {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { coupon } = await request.json();
        
        coupon.code = coupon.code.toUpperCase();
        
        const newCoupon = await prisma.coupon.create({
            data: coupon
        });

        // 🔥 FIX: Keys changed to match 'inngest/functions.js' variables exactly
        await inngest.send({
            name: "app/coupon.created",
            data: {
                couponCode: newCoupon.code,   // Ab ye inngest functions ke 'couponCode' se match karega
                expiresAt: newCoupon.expiresAt, // Ab ye inngest functions ke 'expiresAt' se match karega
            }
        });

        return NextResponse.json({ message: "Coupon created successfully" }, { status: 201 });
        
    } catch (error) {
        console.log("Error in creating coupon:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
    
// DELETE COUPON
export async function DELETE(request) {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        
        await prisma.coupon.delete({
            where: { code }
        });
        
        return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
    } catch (error) {
        console.log("Error in deleting coupon:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET ALL COUPONS
export async function GET(request) {
    try {
        const { userId } = await auth();   
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const coupons = await prisma.coupon.findMany({});
        return NextResponse.json({ coupons });
    } catch (error) {
        console.log("Error in fetching coupons:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}