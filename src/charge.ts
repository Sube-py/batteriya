import { type Reactive } from 'vue'
import type { UI, BatteryUI, ChargeStatus as Status, Stage } from '@/types'
type LiteralFalse = false
type ChargeStatusType = ChargeStatus | LiteralFalse

const BATTERY_LEVEL = [20, 89, 92, 97]

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
  if (updatedPower === 0) {
    return Infinity
  }
  const { standardPower, standardTime, power: currentPower, time: chargedTime } = chargeStatus
  const chargedJoule =
    currentPower > 0 && chargedTime > 0
      ? ((standardPower * standardTime) / currentPower - chargedTime) * currentPower
      : 0
  const newTime = Math.ceil((standardPower * standardTime - chargedJoule) / updatedPower)

  return parseFloat(newTime.toFixed())
}

const adjustPower = (
  currentChargeStatus: ChargeStatus,
  charging: ChargeStatusType[],
  stages: Stage[],
  maxPower: number
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
  const charging: ChargeStatusType[] = Array(battrtyCount).fill(false)
  let totalCharged = 0
  coolDownTime += 1
  for (let minute = 0; minute <= 24 * 60; minute++) {
    let chargeIndex = -1
    for (let currentChargeStatus of charging) {
      chargeIndex++
      if (!(currentChargeStatus instanceof ChargeStatus)) {
        if (charging.some((value) => value instanceof ChargeStatus && value.coolDown > 0)) {
          continue
        }
        const [firstStagePower, firstStageTime] = chargeStages[0]
        let newChargePower: number
        const cPower = charging.every((value) => value === false)
          ? 0
          : charging.reduce((a, b) => a + (b instanceof ChargeStatus ? b.power : 0), 0)
        if (maxPower === cPower) {
          newChargePower = 0
        } else if (maxPower - cPower >= firstStagePower) {
          newChargePower = firstStagePower
        } else {
          newChargePower = maxPower - cPower
        }
        const newCharge = new ChargeStatus(firstStagePower, firstStageTime, 0, 0)
        newCharge.time = getLeftTime(newCharge, newChargePower)
        newCharge.power = newChargePower
        newCharge.coolDown = coolDownTime
        newCharge.level = BATTERY_LEVEL[0]
        charging[chargeIndex] = newCharge
        currentChargeStatus = charging[chargeIndex] as ChargeStatus
      }

      if (currentChargeStatus.coolDown > 0) {
        //换电中
        currentChargeStatus.coolDown -= 1
        continue
      }

      currentChargeStatus.time -= 1

      if (currentChargeStatus.time === 0) {
        if (currentChargeStatus.level === 20) {
          currentChargeStatus.level = currentChargeStatus.nextLevel()
          adjustPower(currentChargeStatus, charging, chargeStages, maxPower)
        } else if (currentChargeStatus.level === 89) {
          currentChargeStatus.level = currentChargeStatus.nextLevel()
          adjustPower(currentChargeStatus, charging, chargeStages, maxPower)
        } else if (currentChargeStatus.level === 92) {
          currentChargeStatus.level = currentChargeStatus.nextLevel()
          adjustPower(currentChargeStatus, charging, chargeStages, maxPower)
        } else if (currentChargeStatus.level === 97) {
          totalCharged += 1
          adjustPower(currentChargeStatus, charging, chargeStages, maxPower)
          currentChargeStatus.coolDown = coolDownTime
          currentChargeStatus.level = currentChargeStatus.nextLevel()
        } else {
          // 100%
          // pass
        }
      }
    }

    // ui
    ui.charged = totalCharged
    const data: BatteryUI[] = []
    let batteryIndex = 0
    for (const charge of charging) {
      let status: Status
      if (charge instanceof ChargeStatus) {
        status = charge.coolDown > 0 ? 'exchange' : 'charging'
      } else {
        status = 'ready'
      }

      const chargeStatus = (
        status === 'charging' ? charge : new ChargeStatus(0, 0, 0, 0)
      ) as ChargeStatus
      data[batteryIndex] = {
        status,
        power: Number(chargeStatus.power.toFixed(1)),
        time: chargeStatus.standardTime,
        timeLeft: chargeStatus.time,
        battery: chargeStatus.level
      }
      batteryIndex += 1
    }

    ui.powerMap[minute] = {
      currentTotalPower: data.reduce((acc, cur) => acc + cur.power, 0),
      batteriesData: data,
      charged: totalCharged
    }
  }
  ui.chartsLoading = false
  return totalCharged
}
