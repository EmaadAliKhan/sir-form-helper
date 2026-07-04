/** PDF overlay coordinates for self-enumeration template (page 1, A4 596×842 pt)
 *  pdf-lib y = baseline from bottom. Values use size 10 bold unless noted.
 *  Calibrated against public/templates/Enumeration-Form_SIR_English.pdf (improved layout).
 */

export interface TextFieldCoord {
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  /** Draw white rectangle behind text (covers overlapping printed labels) */
  pad?: boolean;
  /** Center single character in a box of this width */
  boxWidth?: number;
}

export type FormFieldKey =
  | "blo_contact"
  | "elector_name"
  | "epic"
  | "address"
  | "serial_no"
  | "part_no"
  | "ac_pc_name"
  | "state_2025"
  | "dob_0"
  | "dob_1"
  | "dob_2"
  | "dob_3"
  | "dob_4"
  | "dob_5"
  | "dob_6"
  | "dob_7"
  | "aadhaar"
  | "mobile"
  | "father_name"
  | "father_epic"
  | "mother_name"
  | "mother_epic"
  | "spouse_name"
  | "spouse_epic"
  | "sir_elector_name"
  | "sir_elector_epic"
  | "sir_elector_relative"
  | "sir_elector_relationship"
  | "sir_elector_district"
  | "sir_elector_state"
  | "sir_elector_ac"
  | "sir_relative_name"
  | "sir_relative_epic"
  | "sir_relative_relative"
  | "sir_relative_relationship"
  | "sir_relative_district"
  | "sir_relative_state"
  | "sir_relative_ac"
  | "sir_elector_ac_no"
  | "sir_elector_part_no"
  | "sir_elector_sr_no"
  | "sir_relative_ac_no"
  | "sir_relative_part_no"
  | "sir_relative_sr_no";

const S = 10;

export const DEFAULT_FORM_COORDS: Record<FormFieldKey, TextFieldCoord> = {
  blo_contact: { x: 360, y: 758, size: S, maxWidth: 200 },

  // 2025 header — pre-printed band below BLO row (no printed labels on improved form)
  elector_name: { x: 82, y: 728, size: S, maxWidth: 118 },
  epic: { x: 82, y: 713, size: S, maxWidth: 118 },
  address: { x: 82, y: 698, size: 9, maxWidth: 118 },
  serial_no: { x: 172, y: 728, size: S },
  part_no: { x: 172, y: 713, size: S },
  ac_pc_name: { x: 172, y: 698, size: S, maxWidth: 82 },
  state_2025: { x: 172, y: 683, size: S },

  // DOB — centred in each box (row label pdfY≈438)
  dob_0: { x: 298, y: 420, size: S, boxWidth: 28 },
  dob_1: { x: 328, y: 420, size: S, boxWidth: 28 },
  dob_2: { x: 356, y: 420, size: S, boxWidth: 28 },
  dob_3: { x: 386, y: 420, size: S, boxWidth: 28 },
  dob_4: { x: 418, y: 420, size: S, boxWidth: 28 },
  dob_5: { x: 448, y: 420, size: S, boxWidth: 28 },
  dob_6: { x: 478, y: 420, size: S, boxWidth: 28 },
  dob_7: { x: 508, y: 420, size: S, boxWidth: 28 },

  // Personal details — value column to the right of printed labels
  aadhaar: { x: 288, y: 400, size: S, maxWidth: 285 },
  mobile: { x: 288, y: 381, size: S },
  father_name: { x: 288, y: 359, size: S, maxWidth: 285 },
  father_epic: { x: 288, y: 339, size: S },
  mother_name: { x: 288, y: 320, size: S, maxWidth: 285 },
  mother_epic: { x: 288, y: 300, size: S },
  spouse_name: { x: 288, y: 280, size: S, maxWidth: 285 },
  spouse_epic: { x: 288, y: 261, size: S },

  // SIR left — value row ~18pt below each label baseline
  sir_elector_name: { x: 160, y: 594, size: S, maxWidth: 150 },
  sir_elector_epic: { x: 160, y: 576, size: S },
  sir_elector_relative: { x: 160, y: 558, size: S, maxWidth: 150 },
  sir_elector_relationship: { x: 160, y: 540, size: S },
  sir_elector_district: { x: 160, y: 522, size: S },
  sir_elector_state: { x: 160, y: 504, size: S },
  sir_elector_ac: { x: 160, y: 486, size: S },

  // SIR right
  sir_relative_name: { x: 360, y: 594, size: S, maxWidth: 150 },
  sir_relative_epic: { x: 360, y: 576, size: S },
  sir_relative_relative: { x: 360, y: 558, size: S, maxWidth: 150 },
  sir_relative_relationship: { x: 360, y: 540, size: S },
  sir_relative_district: { x: 360, y: 522, size: S },
  sir_relative_state: { x: 360, y: 504, size: S },
  sir_relative_ac: { x: 360, y: 486, size: S },

  // SIR bottom trio — inside boxes below header row (label pdfY≈484)
  sir_elector_ac_no: { x: 87, y: 466, size: S, boxWidth: 72 },
  sir_elector_part_no: { x: 168, y: 466, size: S, boxWidth: 62 },
  sir_elector_sr_no: { x: 238, y: 466, size: S, boxWidth: 52 },
  sir_relative_ac_no: { x: 300, y: 466, size: S, boxWidth: 72 },
  sir_relative_part_no: { x: 389, y: 466, size: S, boxWidth: 62 },
  sir_relative_sr_no: { x: 470, y: 466, size: S, boxWidth: 52 },
};

/** @deprecated Use DEFAULT_FORM_COORDS or getFormCoords() from calibration.ts */
export const FORM_COORDS = DEFAULT_FORM_COORDS;

export const FORM_FIELD_KEYS = Object.keys(DEFAULT_FORM_COORDS) as FormFieldKey[];

export const CALIBRATION_GRID = {
  startX: 50,
  endX: 545,
  startY: 120,
  endY: 820,
};
