import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function AuthGuard({
                             children,
                         }: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return <>{children}</>;
}

export default function ProtectedLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <AuthGuard>{children}</AuthGuard>
        </Suspense>
    );
}