import { TRPCError } from "@trpc/server";
import { polar } from "@/lib/polar";
import { env } from "@/lib/env";
import { createTRPCRouter, orgProcedure } from "../init";

export const billingRouter = createTRPCRouter({
    createCheckout: orgProcedure.mutation(async ({ ctx }) => {
        const result = await polar.checkouts.create({
            products: [env.POLAR_PRODUCT_ID],
            externalCustomerId: ctx.orgId,
            successUrl: process.env.APP_URL,
        });

        if (!result.url) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create checkout session",
            });
        }

        return { checkoutUrl: result.url };
    }),

    createPortalSession: orgProcedure.mutation(async ({ ctx }) => {
        const result = await polar.customerSessions.create({
            externalCustomerId: ctx.orgId,
        });

        if (!result.customerPortalUrl) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create customer portal session",
            });
        }

        return { portalUrl: result.customerPortalUrl };
    }),

    getStatus: orgProcedure.query(async ({ ctx }) => {
        try {
            const customerState = await polar.customers.getStateExternal({
                externalId: ctx.orgId,
            });

            const hasActiveSubscription =
                (customerState.activeSubscriptions ?? []).length > 0;

            // Sum up estimated costs from all meters across active subscriptions
            let estimatedCostCents = 0;
            for (const sub of customerState.activeSubscriptions ?? []) {
                // Check for meters on the subscription
                if (sub.meters) {
                    for (const meter of sub.meters) {
                        estimatedCostCents += meter.amount ?? 0;
                    }
                }
                
                // If there are no meters, or they all returned 0, we might want to check
                // if there's a total amount on the subscription itself for usage-based items.
                // In some Polar versions, usage-based costs are aggregated in sub.amount
                // if it's the only item or if it's already calculated.
            }

            return {
                hasActiveSubscription,
                customerId: customerState.id,
                estimatedCostCents,
            };
        } catch {
            // Customer doesn't exist yet in Polar
            return {
                hasActiveSubscription: false,
                customerId: null,
                estimatedCostCents: 0,
            };
        }
    }),
});