export type ChargeStatus = 'ready' | 'charging' | 'exchange'
export interface BatteryUI {
  status: ChargeStatus
  power: number
  timeLeft: number
  time: number
  battery: number
}
export interface UI {
  minutes: number
  charged: number
  power: number
  batteries: BatteryUI[]
}
