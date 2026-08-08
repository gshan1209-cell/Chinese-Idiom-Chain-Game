export const CANONICAL_CARD_CANVAS_PROFILE_ID = 'cicg-card-897x1752-v1';
export const LEGACY_CARD_CANVAS_PROFILE_ID = 'cicg-card-1024x2000-legacy-v1';

const CANONICAL_WIDTH = 897;
const CANONICAL_HEIGHT = 1752;
const LEGACY_WIDTH = 1024;
const LEGACY_HEIGHT = 2000;

function validResult(profileId, dimensionStatus) {
  return {
    valid: true,
    profileId,
    dimensionStatus,
    reason: null,
  };
}

function invalidResult(reason) {
  return {
    valid: false,
    profileId: null,
    dimensionStatus: null,
    reason,
  };
}

export function validateCardCanvas(
  record,
  { productionIntent = 'new' } = {},
) {
  const {
    widthPx,
    heightPx,
    dimensionStatus,
    sourceCanvasProfile = null,
    newProductionAllowed,
  } = record ?? {};

  if (!Number.isInteger(widthPx) || !Number.isInteger(heightPx)) {
    return invalidResult('Card canvas dimensions must be positive integers.');
  }

  if (widthPx === CANONICAL_WIDTH && heightPx === CANONICAL_HEIGHT) {
    if (dimensionStatus !== 'canonical') {
      return invalidResult(
        'The 897x1752 canvas must use dimensionStatus "canonical".',
      );
    }
    return validResult(CANONICAL_CARD_CANVAS_PROFILE_ID, 'canonical');
  }

  if (widthPx === LEGACY_WIDTH && heightPx === LEGACY_HEIGHT) {
    if (productionIntent === 'new') {
      return invalidResult(
        'Legacy 1024x2000 canvas is not allowed for new production.',
      );
    }
    if (
      dimensionStatus !== 'legacy-compatible' ||
      newProductionAllowed !== false
    ) {
      return invalidResult(
        'Legacy canvas requires dimensionStatus "legacy-compatible" and newProductionAllowed false.',
      );
    }
    return validResult(
      LEGACY_CARD_CANVAS_PROFILE_ID,
      'legacy-compatible',
    );
  }

  const widthScale = widthPx / CANONICAL_WIDTH;
  const heightScale = heightPx / CANONICAL_HEIGHT;
  const isIntegerDerivative =
    Number.isInteger(widthScale) &&
    Number.isInteger(heightScale) &&
    widthScale === heightScale &&
    widthScale >= 2;

  if (isIntegerDerivative) {
    if (
      dimensionStatus !== 'derivative' ||
      sourceCanvasProfile !== CANONICAL_CARD_CANVAS_PROFILE_ID
    ) {
      return invalidResult(
        'Integer-multiple canvas must be marked as derivative and reference the canonical source profile.',
      );
    }
    return validResult(CANONICAL_CARD_CANVAS_PROFILE_ID, 'derivative');
  }

  return invalidResult(
    `Unsupported card canvas ${String(widthPx)}x${String(heightPx)}.`,
  );
}
