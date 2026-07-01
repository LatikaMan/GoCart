import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const {code} = await request.json();

        const coupon = await prisma.coupon.findFirst({
            where: { code :code.toUpperCase() ,
                expiresAt : { gt: new Date()}

            }
        });
        if(!coupon){
            return new Response(JSON.stringify({error:"Invalid or expired coupon"}),{status:400})
        }
        if(coupon.forNewUsers){
            const useroreders = await prisma.order.findMany({
                where:{userId}
            })
            if(useroreders.length>0){
                return new Response(JSON.stringify({error:"Coupon is only for new users"}),{status:400})
            }
        }
        if(coupon.forMembers){
            const hasPlus = has({plan: 'plus'});
            if(!hasPlus){
                return new Response(JSON.stringify({error:"Coupon is only for plus members"}),{status:400})
            }
        }
        return NextResponse.json({coupon},{status:200})
        
    } catch (error) {
        console.error("Error validating coupon:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        

    }
}