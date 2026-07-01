import { auth } from "@clerk/nextjs/server"; // Clerk के लेटेस्ट तरीके का उपयोग करें
import authSeller from "@/app/middlewares/authSeller";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ❌ 'tryLoadManifestWithRetries' वाला इम्पोर्ट यहाँ से पूरी तरह हटा दिया गया है

export async function POST(request) {
    try {
        // Clerk Auth Check (Next.js 15+ के अनुसार await auth())
        const { userId } = await auth();
        
        // ⚠️ स्पेलिंग ठीक की: authseller -> authSeller
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, status } = await request.json();

        // Prisma Database Update
       await prisma.order.update({
    where: {
        id: orderId
    },
    data: {
        status
    }
});

        return NextResponse.json({ message: "Order status updated successfully" });

    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { userId } = await auth();
        
        // ⚠️ स्पेलिंग ठीक की: authseller -> authSeller
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { storeId },
            include: { 
                user: true,  
                address: true, 
                orderItems: { include: { product: true } } 
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ orders });

    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}