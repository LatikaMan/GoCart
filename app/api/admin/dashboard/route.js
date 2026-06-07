import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import authAdmin from "@/app/middlewares/authAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      console.warn("Unauthenticated access attempt to admin dashboard API");
      return NextResponse.json({ error: "Unauthorized: No active session" }, { status: 401 });
    }

    console.log(`Checking admin status for user: ${userId}`);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      console.warn(`Unauthorized access attempt to admin dashboard by user: ${userId}`);
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    console.log("Fetching admin dashboard stats...");
    // Run queries in parallel with individual error handling
    // This prevents the whole dashboard from failing if one table is missing
    const [orderCount, productCount, userCount, aggregateEarnings, allOrders] = await Promise.all([
      prisma.order.count().catch(() => 0),
      prisma.product.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }).catch(() => ({ _sum: { total: 0 } })),
      prisma.order.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => []),
    ]);

    console.log("Stats fetched successfully:", { orderCount, productCount, userCount });

    // Ensure earnings is handled as a number before calling toFixed
    const rawTotal = aggregateEarnings?._sum?.total || 0;
    const earnings = Number(rawTotal).toFixed(2);

    const dashboardData = {
      totalOrders: orderCount,
      totalProducts: productCount,
      totalUsers: userCount,
      totalEarnings: earnings,
      allOrders,
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error("Error in fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
