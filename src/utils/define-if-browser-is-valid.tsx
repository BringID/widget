import defineIfBrowserIsMises from './define-if-browser-is-mises'

function defineIfBrowserIsValid(): boolean {
  const ua = navigator.userAgent;

  // Detect Brave using its unique navigator.brave property

  if (getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-title')) {
    return false
  }

  const isBrave =
    typeof (navigator as any).brave !== 'undefined' &&
    typeof (navigator as any).brave.isBrave === 'function';

  const isMises = defineIfBrowserIsMises()
    
  // Detect Chrome ONLY if it's not another Chromium-based browser
  const isChrome =
    /Chrome\/\d+/.test(ua) &&
    /Google Inc/.test(navigator.vendor) && // Chrome only
    !/Edg\//.test(ua) &&                   // Not Edge
    !/OPR\//.test(ua) &&                   // Not Opera
    !/YaBrowser\//.test(ua) &&             // Not Yandex
    !/Vivaldi/.test(ua) &&                 // Not Vivaldi
    !/SamsungBrowser\//.test(ua) &&        // Not Samsung
    !/DuckDuckGo\//.test(ua) &&            // Not DuckDuckGo
    !/Arc\//.test(ua);                     // Not Arc

  return isBrave || isChrome || isMises;
}
export default defineIfBrowserIsValid