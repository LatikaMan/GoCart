'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ProductCard from '@/components/ProductCard'

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const [recommendations, setRecommendations] = useState([])
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        const product = products.find((product) => product.id === productId);
        setProduct(product);
    }

    useEffect(() => {
        if (products.length > 0) {
            fetchProduct()
        }
        scrollTo(0, 0)
    }, [productId,products]);

    useEffect(() => {
        if (!product) return
        fetch(`/api/recommendations?productId=${product.id}`)
          .then((r) => r.json())
          .then((data) => setRecommendations(data || []))
          .catch(() => setRecommendations([]))
    }, [product])

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Recommended Products</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {recommendations.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}