import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";

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
            <AuthGuard>
                <SidebarProvider defaultOpen>
                    <AppSidebar />
                    <SidebarInset className="min-h-svh bg-muted/30">
                        <AppHeader />
                        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
                <MobileBottomNav />
            </AuthGuard>
        </Suspense>
    );
}
