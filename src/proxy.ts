import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';


const isPublicRoute = createRouteMatcher([
    "/landing",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks/clerk-webhook",
]);

const isOrgSelectionRoute = createRouteMatcher([
    "/org-selection(.*)"
]);


export default clerkMiddleware(async (auth, req) => {
    const { userId, orgId } = await auth();

    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    if (!userId) {
        if (req.nextUrl.pathname === "/" || req.nextUrl.pathname === "") {
            return NextResponse.redirect(new URL("/landing", req.url));
        }
        await auth.protect();
    }

    if (isOrgSelectionRoute(req)) {
        return NextResponse.next()
    }

    if (userId && !orgId) {
        const orgSelectionUrl = new URL(`/org-selection`, req.url);
        return NextResponse.redirect(orgSelectionUrl);
    }

    return NextResponse.next()
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};  