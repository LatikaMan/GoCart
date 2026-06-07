import { auth, getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";


export async function POST(request) {
    try {
        const { userId } = await getAuth(request);
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { coupon } = await request.json();
        
        coupon.code = coupon.code.toUpperCase();
        
        await prisma.coupon.create({
            data: coupon}).then(async (Coupon) => 
                {
                    await inggest.send({
                        name: "app/coupon.created",
                        data: {
                            code: Coupon.code,
                            expiry_at: Coupon.expiry_at,
                        }
                    })
                }
            );
        return NextResponse.json({ message: "Coupon created successfully" }, { status: 201 });
        
    } catch (error) {
        console.log("Error in creating coupon:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
    
    //delet coupon

    export async function DELETE(request) {
        try {
            const { userId } = await getAuthuth(request);
            const isAdmin = await authAdmin(userId);
            if (!isAdmin) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const searchParams = request.nextUrl.searchParams;
            const code = searchParams.get("code");
            await prisma.coupon.delete({
                where: { code }
            })
            return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
        } catch (error) {
            console.log("Error in deleting coupon:", error);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
    }
    //get all coupon 

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