import { TVerification } from '../types'

function calculateAvailablePoints(
  verifications: TVerification[],
): number {
  let points = 0;
  verifications.forEach((verification) => {
    if (verification.status !== 'completed') {
      return;
    }
    points = points + (verification.score || 0);
  });
  return points;
}

export default calculateAvailablePoints;
