import { inngest } from "./client";
import prisma from "@/lib/prisma"; // Sahi path ensure karein

// 1. Sync User Creation (Clerk to DB)
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

// 2. Sync User Update (Clerk to DB)
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

// 3. Sync User Deletion (Clerk to DB)
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

// 4. Automatic Coupon Deletion on Expiration
export const deleteCouponOnExpiration = inngest.createFunction(
    { id: "delete-expired-coupons", event: "app/coupon.created" },
    async ({ event, step }) => {
        const { couponCode, expiresAt } = event.data;

        console.log("🚀 Inngest triggered for coupon:", couponCode, "Expires at:", expiresAt);

        if (!couponCode || !expiresAt) {
            console.error("❌ Missing couponCode or expiresAt in payload:", event.data);
            return { success: false, error: "Missing data fields" };
        }

        // 1. Coupon ke expire hone tak execution ko sleep/wait mode me daalo
        await step.sleepUntil("wait-for-coupon-expiration", expiresAt);

        // 2. Sleep complete hote hi database se coupon delete karo
        const deletionResult = await step.run("delete-coupon-from-db", async () => {
            try {
                console.log(`🗑️ Attempting to delete coupon ${couponCode} from DB...`);
                
                // Pehle check karo coupon exist karta hai ya nahi
                const existing = await prisma.coupon.findUnique({
                    where: { code: couponCode }
                });

                if (!existing) {
                    console.log(`⚠️ Coupon ${couponCode} already deleted or doesn't exist.`);
                    return { status: "already_deleted" };
                }

                const deleted = await prisma.coupon.delete({
                    where: { code: couponCode }
                });
                
                console.log(`✅ Successfully deleted coupon: ${couponCode}`);
                return { status: "deleted", data: deleted };
            } catch (err) {
                console.error(`❌ Prisma Error while deleting coupon ${couponCode}:`, err.message);
                throw new Error(`Prisma Deletion Failed: ${err.message}`);
            }
        });

        return { success: true, result: deletionResult };
    }
);