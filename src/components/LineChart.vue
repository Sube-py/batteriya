<template>
  <v-chart
    class="h-full"
    :option="option"
    autoresize
  />
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { ref, provide } from 'vue'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

provide(THEME_KEY, 'dark')

const arr = []
const time = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
for (let i = 0;i < 24 * 60;i++) {
  arr.push(Math.floor(Math.random() * 1801))
}
const option = ref({
  title: {
    text: 'Traffic Sources',
    left: 'center',
  },
  // tooltip: {
  //   trigger: 'item',
  //   formatter: '{a} <br/>{b} : {c} ({d}%)',
  // },
  // legend: {
  //   orient: 'vertical',
  //   left: 'left',
  //   data: ['Direct', 'Email', 'Ad Networks', 'Video Ads', 'Search Engines'],
  // },
  xAxis: {
    type: 'category',
    data: time,
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'Traffic Sources',
      type: 'line',
      smooth: true,
      data: arr,
      // emphasis: {
      //   itemStyle: {
      //     shadowBlur: 10,
      //     shadowOffsetX: 0,
      //     shadowColor: 'rgba(0, 0, 0, 0.5)',
      //   },
      // },
    },
  ],
})
</script>
