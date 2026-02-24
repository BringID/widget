function isMobileDevice(): boolean {


  // Custom DevTools device with touch disabled — fall back to viewport width
  if (typeof window !== 'undefined' && window.innerWidth <= 400) {
    return true
  }
  
  if (typeof navigator === 'undefined') return false

  // Modern API — available in Chrome 90+, Edge (not Firefox/Safari)
  if ('userAgentData' in navigator) {
    return (navigator as any).userAgentData.mobile
  }

  // User agent fallback — covers iOS, Android, and generic mobile tokens
  if (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) {
    return true
  }

  // DevTools responsive mode with no device selected: UA is unchanged
  // but Chrome sets maxTouchPoints > 0 when touch emulation is active
  if (navigator.maxTouchPoints > 0) {
    return true
  }


  return false
}

export default isMobileDevice
