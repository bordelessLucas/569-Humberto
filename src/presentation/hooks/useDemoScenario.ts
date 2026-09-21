import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDemoClient } from '../../services/api/client.ts'
import { queryKeys } from '../../services/api/query-keys.ts'

const demoClient = getDemoClient()

export function useDemoScenario() {
  const queryClient = useQueryClient()
  const state = useQuery({
    queryKey: queryKeys.demo,
    queryFn: () => demoClient?.getState() ?? null,
    enabled: demoClient !== null,
  })
  const play = useMutation({
    mutationFn: async () => {
      if (!demoClient) return
      await demoClient.playArrival(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.all })
      })
    },
  })

  return {
    available: demoClient !== null,
    state: state.data ?? null,
    running: play.isPending || state.data?.status === 'running',
    start() {
      play.mutate()
    },
    reset() {
      void demoClient?.reset().then(() => queryClient.invalidateQueries({ queryKey: queryKeys.all }))
    },
  }
}
