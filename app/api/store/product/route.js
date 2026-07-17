import { auth } from "@clerk/nextjs/server";
import authSeller from "../../../middlewares/authSeller";
import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    console.log("--- API HIT SUCCESSFUL ---"); // इससे पता चलेगा कि रिक्वेस्ट API के अंदर आई
    
    try {
        // 1. Clerk Auth Check
        const authData = await auth();
        if (!authData) {
            throw new Error("Clerk auth middleware not detected");
        }
        const userId = authData?.userId;
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized: No User ID found" }, { status: 401 });
        }

        // 2. Seller Middleware Check
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized: Not a seller" }, { status: 401 });
        }

        // 3. Form Data Parsing
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp")); 
        const price = Number(formData.get("price"));
        const category = formData.get("category");
        const images = formData.getAll("images");

        // 4. Validation
        if (!name || !description || !mrp || !price || !category || images.length === 0) {
            return NextResponse.json({ error: "Missing product info" }, { status: 400 });
        }

        // 5. ImageKit Upload
        const imagesUrls = await Promise.all(
            images.map(async (img) => {
                try {
                    // Check if imagekit is initialized
                    if (!imagekit) {
                        throw new Error("ImageKit not initialized");
                    }
                    const buffer = Buffer.from(await img.arrayBuffer());
                    const response = await imagekit.upload({
                        file: buffer,
                        fileName: `product-${Date.now()}`,
                        folder: "products",  
                    });

                    const url = imagekit.url({
                        src: response.url,
                        transformation: [    
                            { quality: "auto" },
                            { format: "webp" },
                            { width: "1024" }
                        ]
                    });
                    return url;
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        console.error("ImageKit upload failed with 404 status code. Please check your ImageKit configuration.");
                        return null; 
                    } else if (error.response && error.response.status === 400) {
                        console.error("ImageKit upload failed with 400 status code. Please check your image files.");
                        return null; 
                    }
                    throw error;
                }
            })
        );
        // filter out null values
        const filteredImagesUrls = imagesUrls.filter(url => url !== null);

        // 6. Prisma Database Insert
        await prisma.product.create({
            data: {
                storeId,
                name,
                description,
                mrp,
                price,
                category,
                images: filteredImagesUrls,
            }
        });

        return NextResponse.json({ message: "Product created successfully" }, { status: 201 });

    } catch (error) {
        // यह ब्लॉक अब हर छोटी-बड़ी गलती को टर्मिनल में प्रिंट करेगा
        console.error("--- NEXT.JS API POST ERROR START ---");
        console.error("ERROR MESSAGE:", error?.message || error);
        console.error("ERROR STACK:", error?.stack);
        console.error("--- NEXT.JS API POST ERROR END ---");
        
        if (error.message.includes("Clerk auth middleware not detected")) {
            return NextResponse.json({ error: "Clerk auth middleware not detected" }, { status: 500 });
        }

        if (error.message.includes("ImageKit upload failed with 404 status code")) {
            return NextResponse.json({ error: "ImageKit upload failed" }, { status: 500 });
        }

        if (error.message.includes("ImageKit not initialized")) {
            return NextResponse.json({ error: "ImageKit not initialized" }, { status: 500 });
        }

        return NextResponse.json(
            { error: error?.message || "Internal server error" }, 
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { userId } = await auth();
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const products = await prisma.product.findMany({
            where: { storeId }
        });
        return NextResponse.json({ products }, { status: 200 });
    } catch (error) {
        console.error("Error in fetching products:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
