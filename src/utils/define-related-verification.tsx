import { TVerification, TTask } from '../types';

const defineRelatedVerification = (
  task: TTask,
  verifications: TVerification[],
) => {
  if (!task?.groups || !Array.isArray(verifications)) return null;

  for (const group of task.groups) {
    const matchingVerification = verifications.find(
      (verification) =>
        verification.credentialGroupId === group.credentialGroupId,
    );
    if (matchingVerification) {
      return matchingVerification;
    }
  }

  return null; // No related verification found
};

export default defineRelatedVerification;
