import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await prisma.store.findFirst({
            where: { userId },
            include: {
                Product: {
                    include: {
                        rating: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Calculate dashboard statistics
        const totalProducts = store.Product.length;
        const totalOrders = 0; // Implement order logic here
        const totalEarnings = 0; // Implement earnings logic here
        
        // Format ratings to include product info as required by the frontend
        const ratings = store.Product.flatMap(product => 
            product.rating.map(r => ({ ...r, product }))
        );

        return NextResponse.json({
            totalProducts,
            totalEarnings,
            totalOrders,
            ratings
        }, { status: 200 });

    } catch (error) {
        console.error("DASHBOARD_FETCH_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}