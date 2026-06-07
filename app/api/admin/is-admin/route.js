import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    console.log("USER ID =", userId);
    console.log("ADMIN USER ID =", process.env.ADMIN_USER_ID);

    const isAdmin = userId === process.env.ADMIN_USER_ID;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error in checking admin status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}