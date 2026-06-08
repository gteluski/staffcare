import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  trial_start: string;
  trial_end: string;
  subscription_status: SubscriptionStatus;
  payment_method: string | null;
  paid_until: string | null;
  activated_at: string | null;
  notes: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Subscription | null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Realtime: when the webhook updates the subscription row, refresh queries
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["subscription", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const now = new Date();
  const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const paidUntil = subscription?.paid_until ? new Date(subscription.paid_until) : null;

  const isTrialing =
    subscription?.subscription_status === "trialing" && trialEnd && trialEnd > now;
  const isActive =
    subscription?.subscription_status === "active" && paidUntil && paidUntil > now;
  const hasAccess = !!(isTrialing || isActive);

  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const trialExpired =
    subscription?.subscription_status === "trialing" && trialEnd && trialEnd <= now;

  const cancelScheduled = !!(isActive && subscription?.cancel_at_period_end);

  return {
    subscription,
    isLoading,
    refetch,
    hasAccess,
    isTrialing: !!isTrialing,
    isActive: !!isActive,
    trialExpired: !!trialExpired,
    trialDaysLeft,
    cancelScheduled,
  };
}
