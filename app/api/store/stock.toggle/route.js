
import {getAuth} from "@clerk/nextjs/server";
import authSeller  from "../../../middlewares/authSeller";
import prisma from "@/lib/prisma";
import {NestResponse} from "next/server";


export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const {productId} = await request.json();
            if(!userId||!productId){
                return new Response(JSON.stringify({error:"missing info"}),{status:400})
            }
            const storeId = await authSeller(userId);
            if(!storeId){
                return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
            }
            const product = await prisma.product.findFirst({
                where:{id:productId}
            })
            if(!product){
                return new Response(JSON.stringify({error:"Product not found"}),{status:404})
            }
            await prisma.product.update({
                where:{id:productId},
                data:{
                    inStock:!product.inStock
                }
            })
            return new Response(JSON.stringify({message:"Product stock status toggled successfully"}),{status:200})


    }catch(error){
        console.log("Error in toggling stock status:",error);
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})

    }
}
