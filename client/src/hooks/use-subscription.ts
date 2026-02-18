import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionStatus {
  tier: "free" | "premium";
  ventsUsedToday: number;
  ventsRemaining: number;
  status: string;
  currentPeriodEnd?: string;
  voidId?: string | null;
}

export function useSubscription(userId: number | null) {
  return useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status", userId],
    queryFn: async () => {
      if (!userId) return { tier: "free", ventsUsedToday: 0, ventsRemaining: 1, status: "free" };
      const res = await fetch(`/api/subscription/status?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export async function createCheckoutSession(userId: number, userName?: string): Promise<string> {
  const res = await apiRequest("POST", "/api/stripe/create-checkout", { userId, userName });
  const data = await res.json();
  return data.url;
}

export async function createPortalSession(userId: number): Promise<string> {
  const res = await apiRequest("POST", "/api/stripe/create-portal", { userId });
  const data = await res.json();
  return data.url;
}
