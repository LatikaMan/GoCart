import AdminLayout from "@/components/admin/AdminLayout";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
                <AdminAuthGate>
                    <AdminLayout>{children}</AdminLayout>
                </AdminAuthGate>
            
        </>
    );
}
