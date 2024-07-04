import { type Reactive } from 'vue'
import type { UI, BatteryUI, ChargeStatus as Status } from '@/types'
type LiteralFalse = false
type ChargingStage = [number, number]
type ChargeStatusType = ChargeStatus | LiteralFalse

const chargingStages: ChargingStage[] = [
  [326, 63],
  [245, 6],
  [150, 6],
  [115, 6]
]

class ChargeStatus {
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
  }
}

const adjustPower = (chargeStatus: ChargeStatus, charging: ChargeStatusType[]) => {
  const stage: ChargingStage = [chargeStatus.standardPower, chargeStatus.standardTime]
  const nextStageIndex = chargingStages.findIndex((s) => s[0] === stage[0] && s[1] === stage[1]) + 1
  let nextPower: number
  if (nextStageIndex >= chargingStages.length) {
    nextPower = 0
  } else {
    nextPower = chargingStages[nextStageIndex][0]
  }
  let powerLeft = chargeStatus.power - nextPower
  for (const item of charging) {
    if (powerLeft <= 0) {
      break
    }
    if (item instanceof ChargeStatus && item.power < item.standardPower) {
      const _power = item.standardPower - item.power
      const chargedJoule =
        item.power > 0
          ? ((item.standardPower * item.standardTime) / item.power - item.time) * item.power
          : 0
      const newTime = Math.ceil(
        (item.standardPower * item.standardTime - chargedJoule) /
          Math.min(item.power + powerLeft, item.standardPower)
      )
      item.time = newTime
      if (_power <= powerLeft) {
        powerLeft -= _power
        item.power = item.standardPower
      } else {
        item.power += powerLeft
        powerLeft = 0
        break
      }
    }
  }
}

export const simulateCharging = (
  battrtyCount = 7,
  maxPower = 1800,
  coolDownTime = 7,
  ui: Reactive<UI> | undefined = undefined
): number => {
  const batteries: number[] = Array(battrtyCount).fill(20)
  const charging: ChargeStatusType[] = Array(battrtyCount).fill(false)
  let totalCharged = 0

  let coolDown = 7
  let currentPower = 0
  const coolDownMap: { [key: number]: boolean } = {}
  for (let i = 0; i < battrtyCount; i++) {
    coolDownMap[i] = false
  }
  for (let minute = 0; minute < 24 * 60; minute++) {
    currentPower = 0

    for (let i = 0; i < battrtyCount; i++) {
      if (charging[i] !== false) {
        const chargeStatus = charging[i] as ChargeStatus
        const stage: ChargingStage = [chargeStatus.standardPower, chargeStatus.standardTime]
        let timeLeft = chargeStatus.time
        currentPower += chargeStatus.power
        timeLeft -= 1

        if (timeLeft === 0) {
          if (stage[1] === 63) {
            batteries[i] = 89
            adjustPower(chargeStatus, charging)
          } else if (stage[1] === 6) {
            if (batteries[i] === 89) {
              batteries[i] = 92
              adjustPower(chargeStatus, charging)
            } else if (batteries[i] === 92) {
              batteries[i] = 97
              adjustPower(chargeStatus, charging)
            } else if (batteries[i] === 97) {
              batteries[i] = 100
              adjustPower(chargeStatus, charging)
              charging[i] = false
              totalCharged += 1
              batteries[i] = 20
              continue
            }
          }
          const index = chargingStages.findIndex((s) => s[0] === stage[0] && s[1] === stage[1])
          const nextStage = chargingStages[index + 1]
          charging[i] = new ChargeStatus(nextStage[0], nextStage[1], nextStage[0], nextStage[1])
        } else {
          charging[i] = new ChargeStatus(stage[0], stage[1], chargeStatus.power, timeLeft)
        }
      }
    }

    // ui
    if (ui?.minutes === minute) {
      ui.charged = totalCharged
      ui.power = currentPower

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

      ui.batteries = data
      return totalCharged
    }

    if (coolDown > 0) {
      coolDown -= 1
      continue
    }

    for (let i = 0; i < battrtyCount; i++) {
      if (coolDown > 0) {
        continue
      } else {
        coolDownMap[i] = false
      }
      if (charging[i] === false && batteries[i] < 100) {
        for (const stage of chargingStages) {
          if (batteries[i] === 20 && stage[1] === 63) {
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
              break
            } else {
              charging[i] = new ChargeStatus(stage[0], stage[1], 0, Infinity)
              break
            }
          } else if ([89, 92, 97].includes(batteries[i]) && stage[1] === 6) {
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
  return totalCharged
}

// const total = simulateCharging(7, 1800, 7);
// console.log(`24小时内最多可以进出${total}块电池`);
