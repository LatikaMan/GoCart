import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "../../../middlewares/authSeller";
import prisma from "@/lib/prisma";



export async function GET(request) {
    try {
        const { userId } = gethAuth(request);
        const storeId = await authSeller(userId);
        const orders = await prisma.order.findMany({
            where: {
                storeId,
            }})
        const products = await prisma.product.findMany({
            where: {
                storeId,
            }})
                
         const ratings = await prisma.rating.findMany({
            where: {
                productId: {in: products.map(products => product.id)}},
            
            include:
                {user:true , product:true}
            })        
            const dashboardData = {
                totalOrders: orders.length,
                totalProducts: products.length,
                totalRatings: ratings.length,
                ratings,
                totalEarnings:Math.round(orders.reduce((acc,order)=> acc+order.total , 0)),
            }
            return new Response(JSON.stringify(dashboardData),{status:200})



    } catch (error) {
        console.log("Error in fetching dashboard data:",error);
        return new Response(JSON.stringify({error:"Internal server error"},{status:500}));
    }
}