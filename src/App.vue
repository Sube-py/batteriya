<script setup lang="ts">
import { reactive, ref, watch, toRaw, computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'
import { simulateCharging } from '@/charge'
import type { UI, Form, Stage } from '@/types'

const form = reactive<Form>({
  batteryNum: 7,
  maxPower: 1800,
  time: 7,
  stages: [
    [326, 63],
    [245, 6],
    [150, 6],
    [115, 6]
  ]
})

const total = ref(0)

const ui = reactive<UI>({
  minutes: 663,
  charged: 0,
  power: 0,
  batteries: Array(7).fill({
    status: 'ready',
    power: 0,
    time: 0,
    timeLeft: 0,
    battery: 20
  })
})

const removeStage = (_item: Stage) => {
  // @ts-ignore
  ElMessage.warning('开发中...')
  // const index = form.stages.indexOf(item)
  // if (index !== -1) {
  //   form.stages.splice(index, 1)
  // }
}

const addStage = () => {
  // @ts-ignore
  ElMessage.warning('开发中...')
  // form.stages.push([110, 10])
}

const formatTooltip = (minutes: number) => {
  let hours = Math.floor(minutes / 60)
  let mins = minutes % 60

  let formattedHours = hours.toString().padStart(2, '0')
  let formattedMinutes = mins.toString().padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}

const mockedTime = computed(() => {
  return formatTooltip(ui.minutes)
})

watch(
  form,
  () => {
    if (!form.batteryNum || !form.maxPower || !form.time || !form.stages.length) return
    const formCopy = toRaw(form)
    total.value = simulateCharging(
      formCopy.batteryNum,
      formCopy.maxPower,
      formCopy.time,
      formCopy.stages
    )
  },
  { immediate: true, deep: true }
)

watch(
  () => [ui.minutes, form],
  debounce(() => {
    console.log(form)
    if (!form.batteryNum || !form.maxPower || !form.time || !form.stages.length) return
    const formCopy = toRaw(form)
    simulateCharging(formCopy.batteryNum, formCopy.maxPower, formCopy.time, formCopy.stages, ui)
  }, 100),
  { immediate: true, deep: true }
)
</script>
<template>
  <div class="h-screen w-full bg-gray-100 flex">
    <div class="flex flex-col w-[500px] p-4 shrink-0">
      <el-form :model="form">
        <el-form-item label="电池数量">
          <el-input-number :min="1" v-model="form.batteryNum" />
        </el-form-item>
        <el-form-item label="最大功率">
          <el-input-number :min="1" :step="100" v-model="form.maxPower" />
        </el-form-item>
        <el-form-item label="换电时间">
          <el-input-number :min="0" v-model="form.time" />
        </el-form-item>
        <el-form-item
          v-for="(stage, index) in form.stages"
          :key="index"
          :label="`第${index + 1}阶段`"
          :rules="{
            message: '不能为空',
            trigger: 'blur'
          }"
        >
          <div class="flex gap-2">
            <el-input-number :min="0" v-model="stage[0]" />瓦
            <div>-</div>
            <el-input-number :min="0" v-model="stage[1]" />分
            <el-button type="danger" :icon="Delete" circle @click="removeStage(stage)" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addStage">New stage</el-button>
        </el-form-item>
      </el-form>
      <div class="text-xl font-bold">总计:{{ total }}块</div>
      <el-divider />
      <div class="flex flex-col flex-1">
        <div class="text-xl font-bold">AI建议:</div>
        <div>developing...</div>
      </div>
    </div>
    <div class="flex-1 flex flex-col p-4 h-full w-full overflow-hidden gap-3">
      <div class="w-full flex h-8">
        <div class="text-xl font-bold w-20">时间线</div>
        <el-slider v-model="ui.minutes" :min="0" :max="24 * 60" :format-tooltip="formatTooltip" />
      </div>
      <div class="flex h-8 gap-4">
        <div class="text-xxl font-bold">总功率: {{ ui.power }}W</div>
        <div class="text-xxl font-bold">已充: {{ ui.charged }}块</div>
        <div class="text-xxl font-bold">模拟时间: {{ mockedTime }}</div>
      </div>
      <div class="flex flex-1 w-full h-full">
        <el-scrollbar>
          <div class="flex flex-wrap w-full h-full gap-3">
            <template v-for="(item, index) in ui.batteries" :key="index">
              <el-card style="height: 180px; width: 150px" :header="`电池${index + 1}`">
                <div class="flex flex-col text-sm">
                  <div>状态: {{ item.status }}</div>
                  <template v-if="item.status === 'charging'">
                    <div>功率: {{ item.power }}W</div>
                    <div>电量: {{ item.battery }}%</div>
                    <div>需充电时间: {{ item.time }}m</div>
                    <div>剩余时间: {{ item.timeLeft }}m</div>
                  </template>
                </div>
              </el-card>
            </template>
          </div>
        </el-scrollbar>
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
