import {getAuth} from "@clerk/nextjs/server";
import  authSeller  from "../../../middlewares/authSeller";
import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import {NestResponse} from "next/server";
export async function POST(request) {
    try {
        const {userId } = getAuth(request);
        const storeId= await authSeller(userId);
        if(!storeId){
            return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
        }
        const formData = await request.formData()
         const name = formData.get("name")
         const description = formData.get("desription")
         const mrp =Number(formData.get("mrp")) 
         const price =Number( formData.get("price"))
         const category= formData.get("category")
          const image= formData.getAll("image")
          if(!name||!description||!mrp||!price||!category||image.length===0){
            return new Response(JSON.stringify({error:"missing product info"}),{status:400})
          }
          const imagesUrls = await Promise.all(image.map(async(img)=>{
            const buffer = Buffer.from(await img.arrayBuffer());
            const response = await imagekit.upload({
                file:buffer,
                fileName:`product-${Date.now()}`,
                folder:"products",  
            })

           const url= imagekit.url({
                src:response.url,
                transformation:[    
                    {quality:"auto"},
                    {format:"webp"},
                    {width:"1024"}
                ]
            })
            return url;
          }
            ))
            await prisma.product.create({
                data:{
                    storeId,
                    name,
                    description,
                    mrp,
                    price,
                    category,
                    images:imagesUrls,
                }
            })
            return new Response(JSON.stringify({message:"product created successfully"}),{status:201})
    }


          catch(error){
            console.log("Error in product creation:",error);
            return new Response(JSON.stringify({error:"internal server error"}),{status:500})
         
        
    }
    }
    export async function GET(request){
        try{
            const {userId } = getAuth(request);
            const storeId= await authSeller(userId);
            if(!storeId){
                return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
            }
            const products = await prisma.product.findMany({
                where:{storeId}
            })
            return new Response(JSON.stringify({products}),{status:200})
        }catch(error){
            console.log("Error in fetching products:",error);
            return new Response(JSON.stringify({error:"internal server error"}),{status:500})
        }
    }
