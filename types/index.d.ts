export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Task = {
  id: string
  title: string
  kind: 'main' | 'sub'
  agentType?: string
  pct: number
  isReal: boolean
  calls: number
  isDone: boolean
  endedAt?: number
}
export type Totals = { input: number; output: number; cache: number; missions: number }

declare module 'claude-code' {
  interface PluginState {
    'knight-pane': {
      busy: boolean
      tasks: Task[]
      tool: string
      frame: number
      limits: Limit[]
      usd: number
      totals: Totals
    }
  }
}
