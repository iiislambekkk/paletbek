import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: Request) {
    const path = new URL(request.url).pathname;
    const protectedActions = ["set-role", "update-user", "set-user-password", "remove-user", "ban-user", "unban-user"];
    const action = path.split("/").at(-1);

    if (action && protectedActions.includes(action) && path.includes("/admin/")) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return Response.json({ message: "Недостаточно прав" }, { status: 403 });
        }

        const body = await request.clone().json() as { userId?: string; role?: string; data?: { role?: string } };
        if (body.userId) {
            const target = await prisma.user.findUnique({ where: { id: body.userId }, select: { role: true } });
            if (target?.role === "SUPER_ADMIN" && body.userId !== session.user.id) {
                return Response.json({ message: "Изменять другого суперадминистратора нельзя" }, { status: 403 });
            }
            if (body.userId === session.user.id && ((action === "set-role" && body.role !== "SUPER_ADMIN") || (action === "update-user" && body.data?.role && body.data.role !== "SUPER_ADMIN") || action === "remove-user" || action === "ban-user")) {
                return Response.json({ message: "Нельзя удалить свою роль суперадминистратора" }, { status: 403 });
            }
        }
    }

    return handlers.POST(request);
}
