import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const products = await prisma.product.findMany({
           // 1. 💡 अगर नया प्रोडक्ट दिखाना है, तो टेस्टिंग के लिए temporarily 'inStock' फ़िल्टर हटाएँ
           // where: { inStock: true }, 
           include: {
                rating: {
                    select: {
                        createdAt: true,
                        rating: true,
                        review: true,
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                store: true,
           },
           orderBy: { createdAt: "desc" }
        });

        // 2. ⚠️ इस फ़िल्टर को कमेंट या हटा दें, क्योंकि आपके स्टोर का isActive अभी false है!
        // const activeProducts = products.filter(product => product.store.isActive);
        
        // सीधे सारे प्रोडक्ट्स रिटर्न करें
        return NextResponse.json({ products }, { status: 200 });

    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}