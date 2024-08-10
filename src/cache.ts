import { useLocalStorage } from '@vueuse/core'
import type { Form } from '@/types'

export const UICache = useLocalStorage<Form>('batteryUI', {
  batteryNum: 4,
  maxPower: 700,
  time: 10,
  stages: [
    [336.8, 57],
    [236.8, 6],
    [147.4, 6],
    [110.5, 6]
  ]
})
