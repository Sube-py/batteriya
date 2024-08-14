export const formatTooltip = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  const formattedHours = hours.toString().padStart(2, '0')
  const formattedMinutes = mins.toString().padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}
