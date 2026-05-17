import { VoicesLayout } from "@/features/voices/views/VoicesLayout";


export default function Layout({
    children
}: {
    children: React.ReactNode
}) {
    return <VoicesLayout>{children}</VoicesLayout>;
};