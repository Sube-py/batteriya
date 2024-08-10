<script setup lang="ts">
import { reactive, ref, watch, toRaw, computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { simulateChargingWithUI } from '@/charge'
import type { UI, Stage, ChartsData } from '@/types'
import LineChart from '@/components/LineChart.vue'
import { UICache as form } from '@/cache'

// const form = reactive<Form>({
//   batteryNum: 4,
//   maxPower: 700,
//   time: 10,
//   stages: [
//     [336.8, 57],
//     [236.8, 6],
//     [147.4, 6],
//     [110.5, 6]
//   ]
// })

const graphModalVisible = ref(false)

const total = ref(0)

const ui = reactive<UI>({
  minutes: 387,
  charged: 0,
  chartsLoading: true,
  powerMap: {
    0: {
      currentTotalPower: 0,
      batteriesData: [],
      charged: 0
    }
  }
})

const batteryUI = computed(() => {
  return ui.powerMap[ui.minutes].batteriesData
})
const currentPower = computed(() => {
  return ui.powerMap[ui.minutes].currentTotalPower
})
const currentCharged = computed(() => {
  return ui.powerMap[ui.minutes].charged
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
  (formValue) => {
    if (!formValue.batteryNum || !formValue.maxPower || !formValue.time || !formValue.stages.length) return
    const formCopy = toRaw(formValue)
    if (formCopy.maxPower < Math.max(...formCopy.stages.map(item => item[0]))) {
      ElMessage.warning('最大功率不能小于阶段功率')
      form.value.maxPower = Math.max(...formCopy.stages.map(item => item[0]))
      return
    }
    total.value = simulateChargingWithUI(
      formCopy.batteryNum,
      formCopy.maxPower,
      formCopy.time,
      formCopy.stages,
      ui
    )
  },
  { immediate: true, deep: true }
)

const chartsData = reactive<ChartsData>({
  title: 'Power Graph',
  xAxis: Array.from({ length: 24 * 60 + 1 }, (_, i) => formatTooltip(i)),
  yAxis: []
})

watch(
  () => ui.chartsLoading,
  (loading: boolean) => {
    if (loading) return
    chartsData.yAxis = Object.values(ui.powerMap).map((item) => item.currentTotalPower)
  },
  { immediate: true, deep: true }
)
</script>
<template>
  <div class="h-screen w-full bg-gray-100 flex">
    <div class="flex flex-col w-[500px] p-4 shrink-0">
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
            <el-input-number
              :min="0"
              v-model="stage[0]"
            />瓦
            <div>-</div>
            <el-input-number
              :min="0"
              v-model="stage[1]"
            />分
            <el-button
              type="danger"
              :icon="Delete"
              circle
              @click="removeStage(stage)"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="addStage"
          >New stage</el-button>
          <el-button
            type="primary"
            @click="graphModalVisible = true"
          >Power graph</el-button>
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
        <el-slider
          v-model="ui.minutes"
          :min="0"
          :max="24 * 60"
          :format-tooltip="formatTooltip"
        />
      </div>
      <div class="flex h-8 gap-4">
        <div class="text-xxl font-bold">总功率: {{ currentPower }}W</div>
        <div class="text-xxl font-bold">已充: {{ currentCharged }}块</div>
        <div class="text-xxl font-bold">模拟时间: {{ mockedTime }}</div>
      </div>
      <!-- <div v-loading="ui.chartsLoading" class="w-full h-56">
        <line-chart
          :x-axis="chartsData.xAxis"
          :y-axis="chartsData.yAxis"
          :title="chartsData.title"
        />
      </div> -->
      <div class="flex flex-1 w-full h-full">
        <el-scrollbar>
          <div class="flex flex-wrap w-full h-full gap-3">
            <template
              v-for="(item, index) in batteryUI"
              :key="index"
            >
              <el-card
                style="height: 180px; width: 150px"
                :header="`电池${index + 1}`"
              >
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

  <el-dialog
    v-model="graphModalVisible"
    title="Power Graph"
    width="80%"
    fullscreen
    destroy-on-close
  >
    <div class="h-full w-full">
      <line-chart
        :x-axis="chartsData.xAxis"
        :y-axis="chartsData.yAxis"
        :title="chartsData.title"
      />
    </div>
  </el-dialog>
</template>

<style scope>
.el-card__header {
  padding-top: 4px;
  padding-bottom: 4px;
}

.el-dialog__body {
  height: calc(100% - 72px);
}
</style>
