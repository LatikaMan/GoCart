
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NestResponse } from "next/server";

export async function POST(request) {
    try {
        const { storeId } = getAuth(request);
        const isAdmin = await authAdmin(storeId);
        if(!isAdmin){
            return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
        }
        const stores = await request.json();
        if(!storeId){
            return new Response(JSON.stringify({error:"Missing store ID"}),{status:400})
        }

       const store = await prisma.store.findUnique({
        where:{id:storesId}
       })
       if(!store){
        return new Response(JSON.stringify({error:"Store not found"}),{status:404})

       }
       await prisma.store.update({
        where:{id:storesId},
        data:{isActive:!store.isActive}
       })
       return new Response(JSON.stringify({message:"Store status toggled successfully"}),{status:200})

       


    }catch(error){
        console.log("Error in fetching pending stores:",error);
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}
