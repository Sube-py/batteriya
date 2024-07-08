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
  chartsLoading: boolean
  powerMap: {
    [key: number]: {
      currentTotalPower: number
      batteriesData: BatteryUI[]
      charged: number
    }
  }
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
export interface ChartsData {
  title: string
  xAxis: string[]
  yAxis: number[]
}
