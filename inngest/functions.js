
import prisma from "../lib/prisma";
import { inngest } from "./client";

export const syncUserCreation = inngest.createFunction(
    { id: "sync-user-create" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_address,
                name: `${data.name.first_name} ${data.name.last_name}`,
                image: data.image_url,
            }
        })
    }
)
export const syncUserUpdate = inngest.createFunction(
    { id: "sync-user-update" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data.email_addresses[0].email_address,
                name: `${data.name.first_name} ${data.name.last_name}`,
                image: data.image_url,
            }
        })
    }
)

export const syncUserDeletion = inngest.createFunction(
    { id: "sync-user-deletion" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: {
                id: data.id,

            },
        })
    }
)

export const deleteCouponOnExpiration = inngest.createFunction(
    { id: "delete-expired-coupons" },
    { event: 'app/coupon.created' },
    async ({event , step})=>{
        const {data} = event
        const expiryDate = new Date(data.expiry_at);
        
        // Prevent sleeping for invalid or past dates
        if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) return;

        await step.sleepUntil('wait-for-expiry',expiryDate);

        await step.run("delete-coupon-from-database",async()=>{
            await prisma.coupon.delete({
                where:{
                    code:data.code
                }
            })
        })
    }
)