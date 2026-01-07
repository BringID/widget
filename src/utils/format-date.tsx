type TFormatDate = (date: string | number) => string

export const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const formatDate: TFormatDate = (date) => {
  const dateObj = new Date(date)
  const day = dateObj.getDate()
  const month = dateObj.getMonth()
  const year = dateObj.getFullYear()
  return `${months[month]} ${day}, ${year}`
}

export default formatDate