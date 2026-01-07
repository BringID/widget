type TFormatTime = (time: string | number, showSeconds?: boolean) => string


const format = (value: number) => {
  return value < 10 ? `0${value}` : value
}

const formatTime: TFormatTime = (date, showSeconds = false) => {
  const dateObj = new Date(date)
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const seconds = dateObj.getSeconds()
  const minutesFormatted = format(minutes)
  const secondsFormatted = format(seconds)
  const hoursFormatted = format(hours)
  if (!showSeconds) {
    return `${hoursFormatted}:${minutesFormatted}`
  }
  return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`
}

export default formatTime