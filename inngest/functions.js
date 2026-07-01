import { inngest } from "./client";
import prisma from "@/lib/prisma"; // Sahi path ensure karein

// 1. Sync User Creation (Clerk to DB)
export const syncUserCreation = inngest.createFunction(
    { id: "sync-user-create", triggers: [{ event: "clerk/user.created" }] },
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

// 2. Sync User Update (Clerk to DB)
export const syncUserUpdate = inngest.createFunction(
    { id: "sync-user-update", triggers: [{ event: "clerk/user.updated" }] },
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

// 3. Sync User Deletion (Clerk to DB)
export const syncUserDeletion = inngest.createFunction(
    { id: "sync-user-deletion", triggers: [{ event: "clerk/user.deleted" }] },
    async ({ event }) => {
        const { data } = event;
        const { id } = data;
        await prisma.user.delete({
            where: { id: id }
        });
    }
);

// 4. Automatic Coupon Deletion on Expiration
export const deleteCouponOnExpiration = inngest.createFunction(
    { id: "delete-expired-coupons", triggers: [{ event: "app/coupon.created" }] },
    async ({ event, step }) => {
        const { couponCode, expiresAt } = event.data;

        if (couponCode && expiresAt) {
            // 1. Wait until the coupon expires
            await step.sleepUntil("wait-for-coupon-expiration", expiresAt);

            // 2. Delete the coupon from the database
            await step.run("delete-coupon-from-db", async () => {
                return await prisma.coupon.delete({
                    where: { code: couponCode },
                });
            });
        }

        return { success: true };
    }
);