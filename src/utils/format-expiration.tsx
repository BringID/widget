type TFormatExpiration = (seconds: number) => string

const formatExpiration: TFormatExpiration = (seconds) => {
  if (seconds <= 0) {
    return (`0d 0h 0m 0s`)
  }

  let minutes = Math.floor(seconds/60)
  let hours = Math.floor(minutes/60)
  let days = Math.floor(hours/24)

  hours = hours-(days*24)
  minutes = minutes-(days*24*60)-(hours*60)
  seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60)
  return (`${days > 999 ? 999 : days}d ${hours}h ${minutes}m ${seconds}s`)
}

export default formatExpiration