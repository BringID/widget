import { TNotarizationGroup } from '../types';

type GroupMatchResult = {
  semaphoreGroupId: string;
  credentialGroupId: string;
  points: number;
} | null;

function defineGroupByZKTLSResult (
  rawData: string,
  groups: TNotarizationGroup[],
): GroupMatchResult {
  if (groups.length === 1) {
    const group = groups[0];
    return {
      semaphoreGroupId: group.semaphoreGroupId,
      credentialGroupId: group.credentialGroupId,
      points: group.points,
    };
  }

  const extractedValues: Record<string, number> = {};

  const keysToExtract = Array.from(
    new Set(
      groups.flatMap((group) => group.checks?.map((check) => check.key) ?? []),
    ),
  );

  for (const key of keysToExtract) {
    const regex = new RegExp(`"${key}":"?(\\d+)"?`);
    const match = rawData.match(regex);
    if (match) {
      extractedValues[key] = parseInt(match[1], 10);
    }
  }

  const sortedGroups = [...groups].sort((a, b) => b.points - a.points);

  for (const group of sortedGroups) {
    const checks = group.checks;

    if (!checks || checks.length === 0) {
      return {
        semaphoreGroupId: group.semaphoreGroupId,
        credentialGroupId: group.credentialGroupId,
        points: group.points,
      };
    }

    let allChecksPass = true;

    for (const check of checks) {
      const actual = extractedValues[check.key];
      const expected = parseFloat(check.value);

      if (actual === undefined || isNaN(expected)) {
        allChecksPass = false;
        break;
      }

      switch (check.type) {
        case 'gte':
          if (!(actual >= expected)) allChecksPass = false;
          break;
        case 'gt':
          if (!(actual > expected)) allChecksPass = false;
          break;
        case 'lte':
          if (!(actual <= expected)) allChecksPass = false;
          break;
        case 'lt':
          if (!(actual < expected)) allChecksPass = false;
          break;
        case 'eq':
          if (!(actual === expected)) allChecksPass = false;
          break;
        default:
          allChecksPass = false;
      }

      if (!allChecksPass) break;
    }

    if (allChecksPass) {
      return {
        semaphoreGroupId: group.semaphoreGroupId,
        credentialGroupId: group.credentialGroupId,
        points: group.points,
      }
    }
  }

  return null
}

export default defineGroupByZKTLSResult
