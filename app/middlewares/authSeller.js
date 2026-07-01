import prisma from "@/lib/prisma";

const authSeller = async (userId) => {
  try {
    console.log("--- AUTH SELLER MIDDLEWARE START --- FOR USER:", userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        store: true,
      },
    });

    if (!user) {
      console.log("❌ DB Error: User not found in database for ID:", userId);
      return false;
    }

    console.log("DB User Found. Store Details:", user.store);

    // ⚠️ यहाँ स्टेटस चेक करें कि डेटाबेस में क्या लिखा है
    if (user.store && user.store.status === "approved") {
      console.log("✅ Seller Approved! Store ID:", user.store.id);
      return user.store.id;
    }

    console.log(`❌ Seller Not Approved. Status in DB is: "${user.store?.status}"`);
    return false;
  } catch (error) {
    console.log("❌ Error in authSeller middleware:", error);
    return false;
  }
};

export default authSeller;