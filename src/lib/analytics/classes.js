/**
 * Maps the detector's generic COCO vocabulary onto the vocabulary a border
 * post actually uses.
 *
 * The detection model is an off-the-shelf commodity — it knows "car" and
 * "cow". The domain knowledge is here: which of those matter at a border, how
 * much each one raises suspicion, and — importantly — which ones must be
 * actively *dismissed*. Livestock wandering a border strip is the single
 * largest source of false alarms in conventional motion-triggered systems, so
 * recognising a cow as a cow and staying quiet is a feature, not an omission.
 */

const PERSON = ["person"];

const VEHICLES = {
  car: "Car",
  truck: "Truck",
  bus: "Bus",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  train: "Rail",
  boat: "Boat",
};

const LIVESTOCK = ["cow", "horse", "sheep", "dog", "bird", "cat", "elephant", "bear"];

const CARRIED = {
  backpack: "Backpack",
  handbag: "Bag",
  suitcase: "Suitcase",
  "sports ball": "Object",
  umbrella: "Umbrella",
};

/** Domain classes the rest of the platform reasons about. */
export const DOMAIN = {
  PERSON: "person",
  VEHICLE: "vehicle",
  LIVESTOCK: "livestock",
  CARRIED: "carried",
  OTHER: "other",
};

/** Per-class contribution to a threat score, before any modifiers. */
const BASE_THREAT = {
  [DOMAIN.PERSON]: 34,
  [DOMAIN.VEHICLE]: 30,
  [DOMAIN.CARRIED]: 12,
  [DOMAIN.LIVESTOCK]: 0,
  [DOMAIN.OTHER]: 0,
};

/** Classes that never raise an alert on their own. */
export const BENIGN = new Set([DOMAIN.LIVESTOCK, DOMAIN.OTHER]);

export function classify(label) {
  const key = String(label).toLowerCase();

  if (PERSON.includes(key)) {
    return {
      domain: DOMAIN.PERSON,
      display: "Person",
      subtype: null,
    };
  }

  if (key in VEHICLES) {
    return {
      domain: DOMAIN.VEHICLE,
      display: VEHICLES[key],
      subtype: VEHICLES[key],
    };
  }

  if (LIVESTOCK.includes(key)) {
    return {
      domain: DOMAIN.LIVESTOCK,
      display: key.charAt(0).toUpperCase() + key.slice(1),
      subtype: null,
    };
  }

  if (key in CARRIED) {
    return {
      domain: DOMAIN.CARRIED,
      display: CARRIED[key],
      subtype: CARRIED[key],
    };
  }

  return {
    domain: DOMAIN.OTHER,
    display: key.charAt(0).toUpperCase() + key.slice(1),
    subtype: null,
  };
}

export function baseThreat(domain) {
  return BASE_THREAT[domain] ?? 0;
}

/** Classes worth running plate recognition against. */
export function supportsAnpr(domain, subtype) {
  return (
    domain === DOMAIN.VEHICLE &&
    ["Car", "Truck", "Bus"].includes(subtype)
  );
}

export const DOMAIN_COLOR = {
  [DOMAIN.PERSON]: "#f87171",
  [DOMAIN.VEHICLE]: "#fbbf24",
  [DOMAIN.LIVESTOCK]: "#4ade80",
  [DOMAIN.CARRIED]: "#60a5fa",
  [DOMAIN.OTHER]: "#64748b",
};
