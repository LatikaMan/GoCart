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

        console.log("Clerk User ID:", userId);
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const username = formData.get("username");
        const email = formData.get("email");
        const address = formData.get("address");
        const contactNumber = formData.get("contactNumber");
        const image = formData.get("image");

        // validate required fields
        if (!name || !description || !username || !email || !address || !contactNumber || !image) {
            return NextResponse.json({ error: "missing store info" }, { status: 400 });
        }

        const existingStore = await prisma.store.findFirst({ where: { userId } });
        if (existingStore) {
            return NextResponse.json({ error: "store already exists" }, { status: 400 });
        }

        const isUsernameTaken = await prisma.store.findFirst({ where: { username: username.toLowerCase() } });
        if (isUsernameTaken) {
            return NextResponse.json({ error: "username already taken" }, { status: 400 });
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: `store-${Date.now()}`,
            folder: "logos",
        });

        const optimizedImageUrl = imagekit.url({
            src: uploadResponse.url,
            transformation: [{ quality: "auto" }, { format: "webp" }, { width: "512" }],
        });
        const dbUser = await prisma.user.findUnique({
  where: { id: userId },
});

console.log("Current Clerk User:", userId);
console.log("DB User:", dbUser);

if (!dbUser) {
  return NextResponse.json(
    { error: `User ${userId} not found in database` },
    { status: 400 }
  );
}

        const newStore = await prisma.store.create({
            data: {
                user: { connect: { id: userId } },
                name,
                description,
                username: username.toLowerCase(),
                email,
                address,
                contact: contactNumber,
                logo: optimizedImageUrl,
            },
        });

        return NextResponse.json({ store: newStore }, { status: 201 });
    } catch (error) {
        console.error("STORE CREATE ERROR:", error);
        return NextResponse.json(
            {
                error: error?.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}



export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log("Clerk User ID:", userId);
        const store = await prisma.store.findFirst({ where: { userId } });
        if (store) {
            return NextResponse.json({ status: store.status }, { status: 200 });
        }
        return NextResponse.json({ status: "not registered" }, { status: 404 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "something went wrong" }, { status: 500 });
    }
}
