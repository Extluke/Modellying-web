import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  subscriptionPlansApi,
  mapBackendPlanToPricingPlan,
  type BackendSubscriptionPlan,
} from "../api/subscriptionPlansApi"
import { PRICING_PLANS, type PricingPlan } from "@/features/styleguide/components/PricingSection"

export const SUBSCRIPTION_PLANS_QUERY_KEY = ["subscription", "plans"] as const

export function useSubscriptionPlans() {
  const queryClient = useQueryClient()

  const query = useQuery<BackendSubscriptionPlan[]>({
    queryKey: SUBSCRIPTION_PLANS_QUERY_KEY,
    queryFn: subscriptionPlansApi.getPublicPlans,
    staleTime: 1000 * 60 * 5, // 5 menit
    refetchOnWindowFocus: false,
  })

  // Map backend plans to UI PricingPlan objects, with fallback to PRICING_PLANS
  const plans: PricingPlan[] = useMemo(() => {
    if (query.data && query.data.length > 0) {
      return query.data.map(mapBackendPlanToPricingPlan)
    }
    return PRICING_PLANS
  }, [query.data])

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_PLANS_QUERY_KEY })
  }

  return {
    ...query,
    plans,
    backendPlans: query.data || [],
    isLoadingPlans: query.isLoading,
    invalidatePlans,
  }
}
