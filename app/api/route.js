import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ isSeller: false }, { status: 200 });
        }

        // Find the store associated with the user
        const store = await prisma.store.findFirst({
            where: { userId },
        });

        if (store) {
            return NextResponse.json({ isSeller: store.isActive, store, hasStore: true }, { status: 200 });
        } else {
            return NextResponse.json({ isSeller: false, hasStore: false }, { status: 200 });
        }
    } catch (error) {
        console.error("IS_SELLER_CHECK_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
