
import CustomLoader from "@/components/CustomLoader";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
            <CustomLoader size={150} text="Cargando..." />
        </div>
    );
}
