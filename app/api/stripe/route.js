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
         const handlePaymentIntent = async (paymentIntentId, isPaid) => {
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
                limit: 1,

            })
            const {orderIds, userId, appId} = session.data[0].metadata
        if(appId!=='gocart'){
            return new Response(JSON.stringify({error:"Invalid appId"}),{status:400})
        }
        const orderIdsArray = orderIds.split(",");
        if(isPaid){
            await Promise.all(orderIdsArray.map(async (orderId) => {
                await prisma.order.update({
                    where: {id: orderId},
                    data: {isPaid: true}
                })
            }))
            await prisma.user.update({
                where: {id: userId},
                data: {cart: {}}
            })
        }else{
            await Promise.all(orderIdsArray.map(async (orderId) => {
                await prisma.order.delete({
                    where: { id: orderId },
                });
            }))
        }
    }
        switch (event.type) {
            case 'payment_intent.succeeded':{
                await handlePaymentIntent(event.data.object.id,true);
                break;
            }
                
            case 'payment_intent.canceled':{
                await handlePaymentIntent(event.data.object.id,false);
                break;

            }
            default:
                console.log(`Unhandled event type ${event.type}`);
                break;
        }
        return new Response(JSON.stringify({received:true}),{status:200})
                
        }catch (error) {
        console.error("Error handling Stripe webhook:", error);
        return new Response(JSON.stringify({error:"Internal Server Error"}),{status:500})
    }
}

    export const config = {
        api: {
            bodyParser: false,
        }
    }