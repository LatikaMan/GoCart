
import {getAuth} from "@clerk/nextjs/server";
import  authSeller  from "../../../middlewares/authSeller";
import prisma from "@/lib/prisma";
import {NestResponse} from "next/server";
export async function GET(request) {
    try {
            const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if(isSeller){
            return new Response(JSON.stringify({isSeller:true}),{status:200});
        }
    
        const storeInfo = await prisma.store.findFirst({
            where:{userId:userId}
        });
        return new Response(JSON.stringify({isSeller:false,storeInfo}),{status:200});
    } catch (error) {
        console.log("Error in checking seller status:",error);
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500});
    }
}
