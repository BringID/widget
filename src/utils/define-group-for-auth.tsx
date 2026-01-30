
import {
  TTask,
  TTaskGroup
} from '@/types'


const compare = (
  operator: string,
  left: number,
  right: number
): boolean => {
  switch (operator) {
    case "gte":
      return left >= right
    case "gt":
      return left > right
    case "lte":
      return left <= right
    case "lt":
      return left < right
    case "eq":
      return left === right
    default:
      return false
  }
}

const defineGroupForAuth = (
  taskConfig: TTask,
  score: number
): Omit<TTaskGroup, "checks"> | null => {
  const { groups } = taskConfig

  if (groups.length === 1) {
    const { checks, ...group } = groups[0]
    return group
  }

  const matchedGroup = groups.find(group =>
    group.checks.every(check => {
      if (check.key !== "score") return true

      return compare(
        check.type,
        score,
        Number(check.value)
      )
    })
  )

  if (!matchedGroup) return null

  const { checks, ...groupWithoutChecks } = matchedGroup
  return groupWithoutChecks
}

export default defineGroupForAuth