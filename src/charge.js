const charging_stages = [
  [326, 63],
  [245, 6],
  [150, 6],
  [115, 6],
]

export const charge = (battrty_count = 7, max_power = 1800, cool_down_time = 7) => {
  const batteries = Array(battrty_count).fill(20)
  const charging = Array(battrty_count).fill(false)
  let total_charged = 0

  const cool_down_map = {}
  for (let i = 0;i < battrty_count;i++) {
    cool_down_map[i] = 0
  }

  for (let minute = 0;minute < 24 * 60;minute++) {
    let current_power = 0
    for (let i = 0;i < battrty_count;i++) {
      if (charging[i]) {
        let [stage, time_left] = charging[i]
        current_power += stage[0]
        time_left -= 1

        if (time_left === 0) {
          if (stage[1] === 63) {
            batteries[i] = 89
          }
          else if (stage[1] === 6) {
            if (batteries[i] === 89) {
              batteries[i] = 92
            }
            else if (batteries[i] === 92) {
              batteries[i] = 97
            }
            else if (batteries[i] === 97) {
              batteries[i] = 100
              charging[i] = false
              total_charged += 1
              batteries[i] = 20
              cool_down_map[i] = cool_down_time
              continue
            }
          }
          const next_stage = charging_stages[charging_stages.findIndex(item => item === stage) + 1]
          charging[i] = [next_stage, next_stage[1]]
        }
        else {
          charging[i] = [stage, time_left]
        }
      }
    }

    for (let i = 0;i < battrty_count;i++) {
      if (charging[i] === false) {
        if (cool_down_map[i] > 0) {
          cool_down_map[i] -= 1
          continue
        }
      }

      if (charging[i] === false && batteries[i] < 100) {
        for (const stage of charging_stages) {
          // const [power, need_time] = stage
          // if (current_power + power <= max_power) {
          //   charging[i] = [stage, need_time]
          //   current_power += power
          //   break
          // }
          if (batteries[i] == 20 && stage[1] === 63) {
            if (current_power + stage[0] <= max_power) {
              charging[i] = [stage, stage[1]]
              current_power += stage[0]
              break
            }
          } else if ([89, 92, 97].includes(batteries[i]) && stage[1] === 6) {
            if (current_power + stage[0] <= max_power) {
              charging[i] = [stage, stage[1]]
              current_power += stage[0]
              break
            }
          }
        }
      }
    }
  }

  return total_charged
}