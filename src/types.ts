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

type Power = number
type Time = number
export type Stage = [Power, Time]

export interface Form {
  batteryNum: number
  maxPower: number
  time: number
  stages: Stage[]
}