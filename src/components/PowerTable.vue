<script lang="ts" setup>
import { computed } from 'vue'
import type { UI } from '@/types'
import { formatTooltip } from '@/utils'

type PowerMap = UI['powerMap']
const prop = defineProps<{ data: PowerMap }>()

const columns = computed(() => {
  const len = prop.data[0] === void 0 ? 0 : Object.keys(prop.data[0].batteriesData).length
  return [
    {
      key: 'time',
      title: '时间',
      dataKey: 'time',
      width: 100
    },
    {
      key: 'currentPower',
      title: '当前功率',
      dataKey: 'currentPower',
      width: 100
    },
    {
      key: 'charged',
      title: '已充',
      dataKey: 'charged',
      width: 100
    },
    ...Array.from({ length: len }, (_, i) => {
      return [
        {
          key: `batteryPower${i + 1}`,
          title: `电池${i + 1}功率`,
          dataKey: `batteryPower${i + 1}`,
          width: 100
        },
        {
          key: `batteryLeftTime${i + 1}`,
          title: `电池${i + 1}剩余时间`,
          dataKey: `batteryLeftTime${i + 1}`,
          width: 150
        },
        {
          key: `batteryLevel${i + 1}`,
          title: `电池${i + 1}电量`,
          dataKey: `batteryLevel${i + 1}`,
          width: 100
        }
      ]
    }).flat()
  ]
})

const tableData = computed(() => {
  const datas = []
  for (const [key, value] of Object.entries(prop.data)) {
    datas.push({
      time: formatTooltip(Number(key)),
      currentPower: value.currentTotalPower,
      charged: value.charged,
      ...value.batteriesData
        .map((battery, index) => {
          const item: Record<string, number> = {}
          item[`batteryPower${index + 1}`] = battery.power
          item[`batteryLeftTime${index + 1}`] = battery.timeLeft
          item[`batteryLevel${index + 1}`] = battery.battery
          return item
        })
        .reduce((a, b) => Object.assign(a, b), {})
    })
  }
  return datas
})
</script>

<template>
  <el-auto-resizer>
    <template #default="{ height, width }">
      <el-table-v2
        :columns="columns"
        :data="tableData"
        :height="height"
        :width="width"
        stripe
        fixed
      />
    </template>
  </el-auto-resizer>
</template>
