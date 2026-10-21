export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Totals = { input: number; output: number; cache: number; missions: number }

declare module 'claude-code' {
  interface PluginState {
    'knight-pane': {
      busy: boolean
      tool: string
      frame: number
      limits: Limit[]
      usd: number
      totals: Totals
    }
  }
}
