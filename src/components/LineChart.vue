<template>
  <v-chart class="h-full" :option="option" autoresize />
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ref } from 'vue'
import type { ChartsData } from '@/types'

const props = defineProps<ChartsData>()

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const option = ref({
  title: {
    text: props.title,
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '当前功率<br/>{b} : {c}W'
  },
  xAxis: {
    type: 'category',
    data: props.xAxis
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: props.title,
      type: 'line',
      smooth: true,
      data: props.yAxis
    }
  ]
})
</script>
