import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    isSeller: true,
    hasStore: true,
    store: {
      name: "Test Store"
    }
  });
}
