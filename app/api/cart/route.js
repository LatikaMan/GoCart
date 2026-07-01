
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await getAuth(request)
        const {cart} = await request.json()
       
        await prisma.user.update({
            where:{id:userId},
            data:{
                cart:cart
            }
        })
        return new Response(JSON.stringify({message:"Cart updated successfully"}),{status:200})
    } catch (error) {
        console.error("Error updating cart:", error)
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }

}
export async function GET(request) {
    try {
       const { userId } = await getAuth(request);
        const user = await prisma.user.findUnique({
            where:{id:userId},
           
        })
        return new Response(JSON.stringify({cart:user.cart}),{status:200})
    } catch (error) {
        console.error("Error fetching cart:", error)
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}