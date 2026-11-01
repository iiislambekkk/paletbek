import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import {
    defaultStatements,
    adminAc,
    userAc,
} from "better-auth/plugins/admin/access";

import { createAccessControl } from "better-auth/plugins/access";

import { prisma } from "@/lib/prisma";

const ac = createAccessControl(defaultStatements);

const superAdminRole = ac.newRole({
    ...adminAc.statements,
});

const adminRole = ac.newRole({
    ...userAc.statements,
});

const userRole = ac.newRole({
    ...userAc.statements,
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        disableSignUp: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
    },

    plugins: [
        admin({
            ac,

            roles: {
                SUPER_ADMIN: superAdminRole,
                ADMIN: adminRole,
                USER: userRole,
            },

            defaultRole: "USER",
            adminRoles: ["SUPER_ADMIN"],
        }),
    ],
});