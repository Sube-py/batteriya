<script setup>
import { reactive, ref, watch } from 'vue'
import { debounce } from 'lodash-es'
import { charge } from '@/charge'

const form = reactive({
  batteryNum: 7,
  maxPower: 1800,
  time: 7,
})

const total = ref(0)

const ui = reactive({
  minutes: 81,
  charged: 0,
  power: 0,
  batteries: [],
})

const formatTooltip = (minutes) => {
  let hours = Math.floor(minutes / 60)
  let mins = minutes % 60

  let formattedHours = hours.toString().padStart(2, '0')
  let formattedMinutes = mins.toString().padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}

watch(form, () => {
  if (!form.batteryNum || !form.maxPower || !form.time) return
  total.value = charge(form.batteryNum, form.maxPower, form.time)
}, { immediate: true })

watch(() => [ui.minutes, form], debounce(() => {
  if (!form.batteryNum || !form.maxPower || !form.time) return
  charge(form.batteryNum, form.maxPower, form.time, ui)
}, 100), { immediate: true, deep: true })
</script>
<template>
  <div class="h-screen w-full bg-gray-100 flex">
    <div class="flex flex-col w-1/4 p-4 shrink-0">
      <el-form :model="form">
        <el-form-item label="电池数量">
          <el-input-number
            :min="1"
            v-model="form.batteryNum"
          />
        </el-form-item>
        <el-form-item label="最大功率">
          <el-input-number
            :min="1"
            :step="100"
            v-model="form.maxPower"
          />
        </el-form-item>
        <el-form-item label="换电时间">
          <el-input-number
            :min="0"
            v-model="form.time"
          />
        </el-form-item>
      </el-form>
      <div class="text-xl font-bold">总计:{{ total }}块</div>
    </div>
    <div class="flex-1 flex flex-col p-4 h-full w-full overflow-scroll">
      <div class="w-full flex">
        <div class="text-xl font-bold w-20">时间线</div>
        <el-slider
          v-model="ui.minutes"
          :min="0"
          :max="24 * 60"
          :format-tooltip="formatTooltip"
        />
      </div>
      <div class="flex w-full h-[180px] gap-3">
        <template
          v-for="(item, index) in ui.batteries"
          :key="index"
        >
          <el-card
            style="height: 180px; width: 150px;"
            :header="`电池${index + 1}`"
          >
            <div class="flex flex-col text-sm">
              <div>状态: {{ item.status }}</div>
              <template v-if="item.status === 'charging'">
                <div>功率: {{ item.power }}W</div>
                <div>电量: {{ item.battery }}%</div>
                <div>需充电时间: {{ item.time }}m</div>
                <div>剩余时间: {{ item.time_left }}m</div>
              </template>
            </div>
          </el-card>
        </template>
      </div>
      <div class="flex flex-col flex-1">
        <div>
          总功率: {{ ui.power }}W
        </div>
        <div>
          已充: {{ ui.charged }}块
        </div>
      </div>
    </div>
  </div>
</template>

<style scope>
.el-card__header {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>