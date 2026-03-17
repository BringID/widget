const isMobileDevice = (): boolean =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

export default isMobileDevice
