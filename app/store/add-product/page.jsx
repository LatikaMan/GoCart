'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import {useRouter} from "next/navigation"


export default function StoreAddProduct() {
    const router = useRouter()
    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",description: "",mrp: 0,price: 0, category: "",
    })
    const [loading, setLoading] = useState(false)
    const {getToken} = useAuth()
    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }
   const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // 1. इमेज वैलिडेशन
    if (!images[1] && !images[2] && !images[3] && !images[4]) {
        return toast.error("Please upload at least one product image");
    }

    setLoading(true);
    
    // 2. ⚠️ toastId को try ब्लॉक से बाहर 'let' के साथ डिक्लेयर करें (ताकि catch इसे ढूंढ पाए)
    let toastId; 

    try {
        // 3. यहाँ लोडिंग टोस्ट शुरू करें और इसकी ID स्टोर करें
        toastId = toast.loading("Adding Product...");

        const formData = new FormData();
        formData.append("name", productInfo.name);
        formData.append("description", productInfo.description);
        formData.append("mrp", productInfo.mrp);
        formData.append("price", productInfo.price);
        formData.append("category", productInfo.category);
        
        Object.keys(images).forEach(key => {
            images[key] && formData.append("images", images[key]);
        });

        const token = await getToken();
        
        // API पर डेटा भेजें
        const { data } = await axios.post("/api/store/product", formData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // ✅ अगर सक्सेस हुआ, तो लोडिंग टोस्ट को सक्सेस में बदलें
        toast.success(data.message || "Product created successfully", { id: toastId });
        
        // फॉर्म की स्टेट खाली करें
        setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" });
        setImages({ 1: null, 2: null, 3: null, 4: null });
        
        // यूज़र को वापस प्रोडक्ट्स पेज पर भेजें
      router.refresh();

    } catch (error) {
        console.error("Frontend Error:", error);
        const errorMsg = error.response?.data?.error || "Failed to add product";
        
        // 4. 🛡️ अब यहाँ 'toastId' का एरर कभी नहीं आएगा क्योंकि स्कोप सही है
        if (toastId) {
            toast.error(errorMsg, { id: toastId });
        } else {
            toast.error(errorMsg);
        }
    } finally {
        setLoading(false);
    }
};
    return (
       <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Actual Price ($)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Offer Price ($)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
        </form>
    )
}