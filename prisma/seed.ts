import "dotenv/config";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/prisma";

async function main() {
    const standardPallets = [];
    for (let row = 1; row <= 3; row++) {
        for (let level = 1; level <= 3; level++) {
            for (let section = 1; section <= 10; section++) {
                for (let number = 1; number <= 3; number++) {
                    standardPallets.push({ name: `P-${row}-${level}-${section}/${number}` });
                }
            }
        }
    }
    await prisma.pallet.createMany({ data: standardPallets, skipDuplicates: true });
    console.log(`Ensured ${standardPallets.length} standard pallets exist.`);

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name =
        process.env.SUPER_ADMIN_NAME ?? "Super Administrator";

    if (!email || !password) {
        throw new Error(
            "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required"
        );
    }

    if (password.length < 12) {
        throw new Error(
            "Super Admin password must contain at least 12 characters"
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        console.log(
            "User already exists. Super Admin seed skipped."
        );
        return;
    }

    const userId = randomUUID();
    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
        data: {
            id: userId,
            name,
            email: normalizedEmail,
            emailVerified: true,
            role: "SUPER_ADMIN",

            accounts: {
                create: {
                    id: randomUUID(),
                    accountId: userId,
                    providerId: "credential",
                    password: hashedPassword,
                },
            },
        },
    });

    console.log("Super Admin created successfully.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
