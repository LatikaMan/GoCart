import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import imagekit from "@/configs/imagekit";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Ensure the user has an active store
        const store = await prisma.store.findFirst({
            where: { userId, isActive: true }
        });

        if (!store) {
            return NextResponse.json({ error: "You must have an active store to add products" }, { status: 403 });
        }

        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const category = formData.get("category");
        const price = parseFloat(formData.get("price"));
        const mrp = parseFloat(formData.get("mrp"));
        const files = formData.getAll("images"); // Get all uploaded images

        if (!name || !description || !category || isNaN(price) || files.length === 0) {
            return NextResponse.json({ error: "Missing required product fields" }, { status: 400 });
        }

        // 2. Upload images to ImageKit
        const imageUrls = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadResponse = await imagekit.upload({
                file: buffer,
                fileName: `prod-${Date.now()}`,
                folder: "products",
            });

            const optimizedUrl = imagekit.url({
                src: uploadResponse.url,
                transformation: [{ quality: "auto" }, { format: "webp" }],
            });
            imageUrls.push(optimizedUrl);
        }

        // 3. Save product to database
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                category,
                price,
                mrp,
                images: imageUrls,
                storeId: store.id,
                inStock: true,
            },
        });

        return NextResponse.json({ success: true, product: newProduct }, { status: 201 });

    } catch (error) {
        console.error("ADD PRODUCT ERROR:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}