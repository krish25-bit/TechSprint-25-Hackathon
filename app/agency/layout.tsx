"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AgencyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Skip check for login page itself
        if (pathname === "/agency/login") {
            setIsAuthorized(true);
            return;
        }

        const token = sessionStorage.getItem("agency_token");

        if (!token) {
            router.push("/agency/login");
        } else {
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    if (!isAuthorized) {
        return null; // Or a loading spinner while redirecting
    }

    return <>{children}</>;
}
