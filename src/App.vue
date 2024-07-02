<script setup>
import { reactive, ref, watchEffect } from 'vue'
import { charge } from '@/charge'

const form = reactive({
  batteryNum: 7,
  maxPower: 1800,
  time: 7,
})

const total = ref(0)

watchEffect(() => {
  if (!form.batteryNum || !form.maxPower || !form.time) return
  total.value = charge(form.batteryNum, form.maxPower, form.time)
}, { immediate: true })
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
    <div class="flex-1 p-4 h-full w-full overflow-scroll">
      <div class="flex w-full h-[150px] gap-3">
        <template
          v-for="item in form.batteryNum"
          :key="item"
        >
          <el-card style="height: 150px; width: 150px;">
            <template #header>
              <span>电池{{ item }}</span>
            </template>

          </el-card>
        </template>
      </div>
    </div>
  </div>
</template>