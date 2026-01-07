import { TVerification } from "@/types";

const defineInitialSelectedVerifications = (verifications: TVerification[]) => {
  const verificationsCompleted = verifications.reduce<string[]>((res, item) => {
    if (item.status === 'completed') {
      return [...res, item.credentialGroupId];
    }

    return res;
  }, []);

  return verificationsCompleted;
};

export default defineInitialSelectedVerifications