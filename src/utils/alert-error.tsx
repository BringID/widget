type TAlertError = (errorText: string) => void

const alertError: TAlertError = (errorText) => {
  return alert(`Error occured: ${errorText}`)
}

export default alertError
