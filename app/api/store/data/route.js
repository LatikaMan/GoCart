

import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username")?.toLowerCase();
        if (!username) {
            return new Response(JSON.stringify({ error: "Username is required" }), { status: 400 });
        }
        const store = await prisma.store.findFirst({
            where: { username, isActive: true },
            include: {
                products: { include: { rating: true } }
            }
        });
        if (!store) {
            return new Response(JSON.stringify({ error: "Store not found" }), { status: 404 });
        }
        return new Response(JSON.stringify({ store }), { status: 200 });
    } catch (error) {
        console.log("Error in fetching store details:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}