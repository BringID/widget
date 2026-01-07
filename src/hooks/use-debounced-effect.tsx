import { useEffect } from "react"

const useDebouncedEffect = (effect: () => void, deps: (string | number)[], delay: number) => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay)

    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || []), delay])
}

export default useDebouncedEffect