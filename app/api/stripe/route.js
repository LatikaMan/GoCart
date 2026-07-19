import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.text();
        const sig = req.headers.get("stripe-signature");

        const event = stripeInstance.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const { orderIds, userId, appId } = session.metadata || {};

                if (appId !== "gocart" || !orderIds || !userId) {
                    return new Response(
                        JSON.stringify({ error: "Invalid session metadata" }),
                        { status: 400 }
                    );
                }

                const orderIdsArray = orderIds.split(",");

                await Promise.all(
                    orderIdsArray.map(async (orderId) => {
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { isPaid: true },
                        });
                    })
                );

                await prisma.user.update({
                    where: { id: userId },
                    data: { cart: {} },
                });

                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object;
                const { orderIds, appId } = session.metadata || {};

                if (appId === "gocart" && orderIds) {
                    const orderIdsArray = orderIds.split(",");

                    await Promise.all(
                        orderIdsArray.map(async (orderId) => {
                            await prisma.order.delete({
                                where: { id: orderId },
                            });
                        })
                    );
                }

                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
                break;
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error) {
        console.error("Error handling Stripe webhook:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500 }
        );
    }
}