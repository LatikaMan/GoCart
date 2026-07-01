import { auth } from "@clerk/nextjs/server" // 1. Change getAuth to auth
import prisma from "@/lib/prisma"

export async function POST(req){
    try {
        const { userId } = await auth() // 2. Call auth() directly without passing req
        
        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }

        const { orderId, productId, rating, review } = await req.json()
        const order = await prisma.order.findFirst({
            where:{id:orderId, userId}

        })
        if(!order){
            return new Response(JSON.stringify({error:"Order not found"}),{status:404})
        }
        const isAlreadyRated = await prisma.rating.findFirst({
            where:{orderId, productId}
        })
        if (isAlreadyRated) {
    return new Response(JSON.stringify({ error: "You have already rated this product" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" } // Content-Type dena zaroori hai
    });
}
        const response = await prisma.rating.create({
            data:{
                orderId,
                productId,
                userId,
                rating,
                review
            }
        })
        return new Response(JSON.stringify({message:"Rating submitted successfully", rating:response}),{status:201})
    } catch (error) {
        console.error("Error submitting rating:", error)
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}

export async function GET(req){
    try {
        const { userId } = await auth() // 2. Call auth() directly without passing req
        if(!userId){
            return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
        }
        const ratings = await prisma.rating.findMany({
            where:{userId}
        })
        return new Response(JSON.stringify({ratings}),{status:200})

    } catch (error) {
        console.error("Error fetching ratings:", error)
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}