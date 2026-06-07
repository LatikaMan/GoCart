import { inngest } from "./client";
import prisma from "@/lib/prisma"; // Ensure prisma client is imported properly

export const syncUserCreation = inngest.createFunction(
    { id: "sync-user-create", event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event;
        const { id, first_name, last_name, email_addresses, image_url } = data;
        
        await prisma.user.create({
            data: {
                id: id,
                name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
                email: email_addresses[0]?.email_address || "",
                image: image_url || "",
            }
        });
    }
);

export const syncUserUpdate = inngest.createFunction(
    { id: "sync-user-update", event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;
        const { id, first_name, last_name, email_addresses, image_url } = data;

        await prisma.user.update({
            where: { id: id },
            data: {
                name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
                email: email_addresses[0]?.email_address || "",
                image: image_url || "",
            }
        });
    }
);

export const syncUserDeletion = inngest.createFunction(
    { id: "sync-user-deletion", event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;
        const { id } = data;

        await prisma.user.delete({
            where: { id: id }
        });
    }
);

// 🔥 FIX: Added Coupon Automatic Deletion Logic
export const deleteCouponOnExpiration = inngest.createFunction(
    { id: "delete-expired-coupons", event: "app/coupon.created" },
    async ({ event, step }) => {
        const { couponCode, expiresAt } = event.data;

        // 1. Coupon ke expire hone tak execution ko hold/sleep pe daalo
        await step.sleepUntil("wait-for-coupon-expiration", expiresAt);

        // 2. Sleep complete hote hi database se coupon delete karo
        await step.run("delete-coupon-from-db", async () => {
            await prisma.coupon.delete({
                where: { code: couponCode }
            });
        });

        return { success: true, message: `Coupon ${couponCode} deleted successfully.` };
    }
);