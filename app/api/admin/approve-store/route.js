import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if(!isAdmin){
            return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
        }   
        const {storeId , status} = await request.json();
        if(status === 'approved'){
            await prisma.store.update({
                where:{id:storeId},
                data:{status:"approved" , isActive:true}
            })
        }else if(status === 'rejected'){
            await prisma.store.update({
                where:{id:storeId},
                data:{status:"rejected" }
            })
        }
        return new Response(JSON.stringify({message:"Store status updated successfully"}),{status:200})
    }catch(error){
        console.log("Error in updating store status:",error);
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }   
}


export async function GET(request) {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if(!isAdmin){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const stores = await prisma.store.findMany({
            where: { status: { in: ["pending", "rejected"] } },
            include:{user:true}
        })
        return NextResponse.json({ stores });


    }catch(error){
        console.log("Error in fetching pending stores:",error);
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}

    
