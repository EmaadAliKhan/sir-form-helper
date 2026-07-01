import {
  DEFAULT_FORM_COORDS,
  FORM_FIELD_KEYS,
  type FormFieldKey,
  type TextFieldCoord,
} from "./formCoordinates";

export type CalibrationOverrides = Partial<
  Record<FormFieldKey, Partial<TextFieldCoord>>
>;

export const CALIBRATION_FIELD_GROUPS: { label: string; fields: FormFieldKey[] }[] = [
  {
    label: "Header (2025 pre-printed)",
    fields: [
      "blo_contact",
      "elector_name",
      "epic",
      "address",
      "serial_no",
      "part_no",
      "ac_pc_name",
      "state_2025",
    ],
  },
  {
    label: "Date of birth",
    fields: [
      "dob_0",
      "dob_1",
      "dob_2",
      "dob_3",
      "dob_4",
      "dob_5",
      "dob_6",
      "dob_7",
    ],
  },
  {
    label: "Personal details",
    fields: [
      "aadhaar",
      "mobile",
      "father_name",
      "father_epic",
      "mother_name",
      "mother_epic",
      "spouse_name",
      "spouse_epic",
    ],
  },
  {
    label: "SIR — elector (left column)",
    fields: [
      "sir_elector_name",
      "sir_elector_epic",
      "sir_elector_relative",
      "sir_elector_relationship",
      "sir_elector_district",
      "sir_elector_state",
      "sir_elector_ac",
      "sir_elector_ac_no",
      "sir_elector_part_no",
      "sir_elector_sr_no",
    ],
  },
  {
    label: "SIR — relative (right column)",
    fields: [
      "sir_relative_name",
      "sir_relative_epic",
      "sir_relative_relative",
      "sir_relative_relationship",
      "sir_relative_district",
      "sir_relative_state",
      "sir_relative_ac",
      "sir_relative_ac_no",
      "sir_relative_part_no",
      "sir_relative_sr_no",
    ],
  },
];

export function mergeFormCoords(
  overrides: CalibrationOverrides = {}
): Record<FormFieldKey, TextFieldCoord> {
  const merged = { ...DEFAULT_FORM_COORDS };
  for (const key of FORM_FIELD_KEYS) {
    const patch = overrides[key];
    if (patch) {
      merged[key] = { ...merged[key], ...patch };
    }
  }
  return merged;
}

export function overridesFromCoords(
  coords: Record<FormFieldKey, TextFieldCoord>
): CalibrationOverrides {
  const overrides: CalibrationOverrides = {};
  for (const key of FORM_FIELD_KEYS) {
    const current = coords[key];
    const base = DEFAULT_FORM_COORDS[key];
    const diff: Partial<TextFieldCoord> = {};
    if (current.x !== base.x) diff.x = current.x;
    if (current.y !== base.y) diff.y = current.y;
    if ((current.size ?? 10) !== (base.size ?? 10)) diff.size = current.size;
    if (current.maxWidth !== base.maxWidth) diff.maxWidth = current.maxWidth;
    if (current.pad !== base.pad) diff.pad = current.pad;
    if (current.boxWidth !== base.boxWidth) diff.boxWidth = current.boxWidth;
    if (Object.keys(diff).length > 0) overrides[key] = diff;
  }
  return overrides;
}

/** Sample text for every PDF field — calibration preview fills all positions at once. */
export function buildCalibrationPreviewValues(): Record<FormFieldKey, string> {
  return {
    blo_contact: "Sample BLO – 9876543210",
    elector_name: "Emaad Ali Khan",
    epic: "NVR2366466",
    address: "7-1-277/156or294/c",
    serial_no: "476",
    part_no: "150",
    ac_pc_name: "Sanathnagar",
    state_2025: "Telangana",
    dob_0: "0",
    dob_1: "2",
    dob_2: "0",
    dob_3: "2",
    dob_4: "2",
    dob_5: "0",
    dob_6: "0",
    dob_7: "4",
    aadhaar: "3345678903",
    mobile: "9876543210",
    father_name: "Hayath Alikhan",
    father_epic: "FTH1234567",
    mother_name: "Basith Alikhan",
    mother_epic: "MTH7654321",
    spouse_name: "Sample Spouse Name",
    spouse_epic: "SPS9998877",
    sir_elector_name: "Emaad Ali Khan",
    sir_elector_epic: "OLD1234567",
    sir_elector_relative: "Hayath Alikhan",
    sir_elector_relationship: "Other",
    sir_elector_district: "Hyderabad",
    sir_elector_state: "Telangana",
    sir_elector_ac: "Sanathnagar",
    sir_elector_ac_no: "208",
    sir_elector_part_no: "125",
    sir_elector_sr_no: "440",
    sir_relative_name: "Hayath Alikhan",
    sir_relative_epic: "REL1234567",
    sir_relative_relative: "Basith Alikhan",
    sir_relative_relationship: "Father",
    sir_relative_district: "Hyderabad",
    sir_relative_state: "Telangana",
    sir_relative_ac: "Sanathnagar",
    sir_relative_ac_no: "208",
    sir_relative_part_no: "130",
    sir_relative_sr_no: "520",
  };
}
