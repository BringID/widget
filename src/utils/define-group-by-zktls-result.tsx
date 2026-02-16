import { TTaskGroup } from '../types';

type GroupMatchResult = {
  credentialGroupId: string;
} | null;

function defineGroupByZKTLSResult (
  rawData: string,
  groups: TTaskGroup[],
): GroupMatchResult {
  const activeGroups = groups.filter(group => (group.score ?? 0) > 0)

  if (activeGroups.length === 0) return null

  if (activeGroups.length === 1) {
    const group = activeGroups[0];
    return {
      credentialGroupId: group.credentialGroupId,
    };
  }

  const extractedValues: Record<string, number> = {};

  const keysToExtract = Array.from(
    new Set(
      activeGroups.flatMap((group) => group.checks?.map((check) => check.key) ?? []),
    ),
  );

  for (const key of keysToExtract) {
    const regex = new RegExp(`"${key}":"?(\\d+)"?`);
    const match = rawData.match(regex);
    if (match) {
      extractedValues[key] = parseInt(match[1], 10);
    }
  }

  for (const group of activeGroups) {
    const checks = group.checks;

    if (!checks || checks.length === 0) {
      return {
        credentialGroupId: group.credentialGroupId,
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
        credentialGroupId: group.credentialGroupId,
      }
    }
  }

  return null
}

export default defineGroupByZKTLSResult
