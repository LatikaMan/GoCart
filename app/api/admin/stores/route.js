import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const stores = await prisma.store.findMany({
            where: { status: "approved" },
            include: { user: true }
        });
        return NextResponse.json({ stores });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        const isAdmin = await authAdmin(userId);
        if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { storeId } = await request.json();
        const store = await prisma.store.findUnique({ where: { id: storeId } });

        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive }
        });

        return NextResponse.json({ message: "Store visibility updated" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}