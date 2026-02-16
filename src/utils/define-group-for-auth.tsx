
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
  const activeGroups = groups.filter(group => (group.score ?? 0) > 0)

  if (activeGroups.length === 0) return null

  if (activeGroups.length === 1) {
    const { checks, ...group } = activeGroups[0]
    return group
  }

  const matchedGroup = activeGroups.find(group =>
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