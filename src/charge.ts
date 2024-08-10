import { type Reactive } from 'vue'
import type { UI, BatteryUI, ChargeStatus as Status, Stage } from '@/types'
type LiteralFalse = false
type ChargeStatusType = ChargeStatus | LiteralFalse

const BATTERY_LEVEL = [20, 89, 92, 97, 100]

class ChargeStatus {
  private _coolDown: number
  private _level: number
  constructor(
    public standardPower: number,
    public standardTime: number,
    public power: number,
    public time: number
  ) {
    this.standardPower = standardPower
    this.standardTime = standardTime
    this.power = power
    this.time = time
    this._coolDown = 0
    this._level = 0
  }

  get stage(): Stage {
    return [this.standardPower, this.standardTime]
  }

  nextStage(stages: Stage[]): Stage {
    const stage: Stage = [this.standardPower, this.standardTime]
    const nextStageIndex = stages.findIndex((s) => s[0] === stage[0] && s[1] === stage[1]) + 1
    if (nextStageIndex >= stages.length) {
      return stages[0]
    } else {
      return stages[nextStageIndex]
    }
  }

  set setNextStage(stage: Stage) {
    this.standardPower = stage[0]
    this.standardTime = stage[1]
  }

  get coolDown(): number {
    return this._coolDown
  }

  set coolDown(coolDown: number) {
    this._coolDown = coolDown
  }

  get level(): number {
    return this._level
  }

  set level(level: number) {
    this._level = level
  }

  nextLevel() {
    const levelIndex = BATTERY_LEVEL.findIndex((l) => l === this.level)
    const nextLevelIndex = levelIndex + 1 >= BATTERY_LEVEL.length ? 0 : levelIndex + 1
    return BATTERY_LEVEL[nextLevelIndex]
  }
}

const getLeftTime = (chargeStatus: ChargeStatus, updatedPower: number) => {
  const { standardPower, standardTime, power: currentPower, time: chargedTime } = chargeStatus
  const chargedJoule =
    currentPower > 0
      ? ((standardPower * standardTime) / currentPower - chargedTime) * currentPower
      : 0
  const newTime = Math.ceil((standardPower * standardTime - chargedJoule) / updatedPower)

  return parseFloat(newTime.toFixed(2))
}

const adjustPower = (
  currentChargeStatus: ChargeStatus,
  charging: ChargeStatusType[],
  stages: Stage[]
) => {
  const nextStage = currentChargeStatus.nextStage(stages)
  const [nextStagePower, nextStageTime] = nextStage

  let powerLeft = currentChargeStatus.power - nextStagePower
  if (powerLeft > 0) {
    // 上阶段的功率大于下一阶段的功率
    currentChargeStatus.setNextStage = nextStage
    currentChargeStatus.power = nextStagePower
    currentChargeStatus.time = nextStageTime

    for (const chargingBattery of charging) {
      if (powerLeft <= 0) {
        break
      }
      if (
        chargingBattery instanceof ChargeStatus &&
        chargingBattery.power < chargingBattery.standardPower
      ) {
        const usedPower = chargingBattery.standardPower - chargingBattery.power
        chargingBattery.time = getLeftTime(
          chargingBattery,
          Math.min(chargingBattery.power + powerLeft, chargingBattery.standardPower)
        )

        if (usedPower <= powerLeft) {
          powerLeft -= usedPower
          chargingBattery.power = chargingBattery.standardPower
        } else {
          chargingBattery.power += powerLeft
          powerLeft = 0
          break
        }
      }
    }
  } else {
    // 上阶段的功率小于下一阶段的功率
    currentChargeStatus.setNextStage = nextStage
    currentChargeStatus.time = getLeftTime(currentChargeStatus, currentChargeStatus.power)
  }
}

export const simulateChargingWithUI = (
  battrtyCount = 7,
  maxPower = 1800,
  coolDownTime = 7,
  chargeStages: Stage[] = [
    [326, 63],
    [245, 6],
    [150, 6],
    [115, 6]
  ],
  ui: Reactive<UI>
): number => {
  ui.chartsLoading = true
  const batteries: number[] = Array(battrtyCount).fill(20)
  const charging: ChargeStatusType[] = Array(battrtyCount).fill(false)
  let totalCharged = 0

  let coolDown = coolDownTime
  let currentPower = 0
  const coolDownMap: { [key: number]: boolean } = {}
  for (let i = 0; i < battrtyCount; i++) {
    coolDownMap[i] = false
  }
  for (let minute = 0; minute <= 24 * 60; minute++) {
    currentPower = 0

    for (let i = 0; i < battrtyCount; i++) {
      if (charging.every((value) => value === false)) {
        break
      }
      const currentChargeStatus = charging[i]
      if (!(currentChargeStatus instanceof ChargeStatus)) {
        continue
      }

      currentChargeStatus.time -= 1

      if (currentChargeStatus.time === 0) {
        if (batteries[i] === 20) {
          batteries[i] = 89
          adjustPower(currentChargeStatus, charging, chargeStages)
        } else if (batteries[i] === 89) {
          batteries[i] = 92
          adjustPower(currentChargeStatus, charging, chargeStages)
        } else if (batteries[i] === 92) {
          batteries[i] = 97
          adjustPower(currentChargeStatus, charging, chargeStages)
        } else if (batteries[i] === 97) {
          batteries[i] = 100
          totalCharged += 1
          currentChargeStatus.coolDown = coolDownTime
        } else {
          // 100%
          currentChargeStatus.coolDown -= 1
          if (currentChargeStatus.coolDown === 0) {
            batteries[i] = 20
            adjustPower(currentChargeStatus, charging, chargeStages)
          }
        }
      }

      currentPower += currentChargeStatus.power
    }

    // ui
    ui.charged = totalCharged
    const data: BatteryUI[] = []
    for (let i = 0; i < battrtyCount; i++) {
      let status: Status
      if (coolDownMap[i]) {
        status = 'exchange'
      } else {
        status = charging[i] === false ? 'ready' : 'charging'
      }

      const chargeStatus = (
        status === 'charging' ? charging[i] : new ChargeStatus(0, 0, 0, 0)
      ) as ChargeStatus
      data[i] = {
        status,
        power: chargeStatus.power,
        time: chargeStatus.standardTime,
        timeLeft: chargeStatus.time,
        battery: batteries[i]
      }
    }

    ui.powerMap[minute] = {
      currentTotalPower: data.reduce((acc, cur) => acc + cur.power, 0),
      batteriesData: data,
      charged: totalCharged
    }

    if (coolDown > 0) {
      coolDown -= 1
      continue
    }

    // continue
    for (let i = 0; i < battrtyCount; i++) {
      if (coolDown > 0) {
        continue
      } else {
        coolDownMap[i] = false
      }
      if (charging[i] === false && batteries[i] < 100) {
        for (const stage of chargeStages) {
          if (batteries[i] === 20) {
            if (Object.values(coolDownMap).some((value) => value === true)) {
              continue
            }
            coolDownMap[i] = minute > coolDownTime ? true : false
            coolDown = coolDownTime
            if (currentPower + stage[0] <= maxPower) {
              charging[i] = new ChargeStatus(stage[0], stage[1], stage[0], stage[1])
              currentPower += stage[0]
              break
            } else if (maxPower - currentPower > 0) {
              const leftPower = maxPower - currentPower
              const needTime = Math.ceil((stage[0] * stage[1]) / leftPower)
              charging[i] = new ChargeStatus(stage[0], stage[1], leftPower, needTime)
              currentPower = maxPower
              break
            } else {
              console.log('max power is not enough', currentPower)
              charging[i] = new ChargeStatus(stage[0], stage[1], 0, Infinity)
              break
            }
          } else if (batteries[i] === 89) {
            if (currentPower + stage[0] <= maxPower) {
              charging[i] = new ChargeStatus(stage[0], stage[1], stage[0], stage[1])
              currentPower += stage[0]
              break
            }
          } else if (batteries[i] === 92) {
            if (currentPower + stage[0] <= maxPower) {
              charging[i] = new ChargeStatus(stage[0], stage[1], stage[0], stage[1])
              currentPower += stage[0]
              break
            }
          } else if (batteries[i] === 97) {
            if (currentPower + stage[0] <= maxPower) {
              charging[i] = new ChargeStatus(stage[0], stage[1], stage[0], stage[1])
              currentPower += stage[0]
              break
            }
          }
        }
      }
    }
  }
  ui.chartsLoading = false
  return totalCharged
}
