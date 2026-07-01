import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"



export async function POST(req) {
    try {
        const { userId } = await getAuth(req);

        const body = await req.json();
        console.log("BODY:", body); // add this

       const addressData = {
    ...body,
    userId: userId
};

const address = addressData;

        const newAddress = await prisma.address.create({
            data: address
        });

        return NextResponse.json(
            { message: "Address added successfully", address: newAddress },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error adding address:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const { userId } = await getAuth(req);
        const addresses = await prisma.address.findMany({
            where: { userId }
        })
        return NextResponse.json({ addresses }, { status: 200 })
    } catch (error) {
        console.error("Error fetching addresses:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}