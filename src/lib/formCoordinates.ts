/** PDF overlay coordinates for Enumeration-Form_SIR_English.pdf (page 1, A4 596×842 pt)
 *  pdf-lib y = baseline from bottom. Template labels are h≈10–11pt; values use size 10 bold.
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
  blo_contact: { x: 360, y: 752, size: S, maxWidth: 200 },

  // Header col 1 — values in lower half of each sub-row (below printed labels)
  elector_name: { x: 82, y: 696, size: S, maxWidth: 118, pad: true },
  epic: { x: 82, y: 681, size: S, maxWidth: 118, pad: true },
  address: { x: 82, y: 666, size: 9, maxWidth: 118, pad: true },

  // Header col 2
  serial_no: { x: 172, y: 708, size: S, pad: true },
  part_no: { x: 172, y: 693, size: S, pad: true },
  ac_pc_name: { x: 172, y: 678, size: S, maxWidth: 82, pad: true },
  state_2025: { x: 172, y: 663, size: S, pad: true },

  // DOB — centred in each box (boxes ~28pt wide, row centre pdfY≈634)
  dob_0: { x: 291, y: 634, size: S, boxWidth: 28 },
  dob_1: { x: 319, y: 634, size: S, boxWidth: 28 },
  dob_2: { x: 348, y: 634, size: S, boxWidth: 28 },
  dob_3: { x: 378, y: 634, size: S, boxWidth: 28 },
  dob_4: { x: 410, y: 634, size: S, boxWidth: 28 },
  dob_5: { x: 440, y: 634, size: S, boxWidth: 28 },
  dob_6: { x: 470, y: 634, size: S, boxWidth: 28 },
  dob_7: { x: 500, y: 634, size: S, boxWidth: 28 },

  // Personal details — centred vertically in each value cell (row height ≈20pt)
  aadhaar: { x: 288, y: 604, size: S, maxWidth: 285 },
  mobile: { x: 288, y: 584, size: S },
  father_name: { x: 288, y: 562, size: S, maxWidth: 285 },
  father_epic: { x: 288, y: 542, size: S },
  mother_name: { x: 288, y: 522, size: S, maxWidth: 285 },
  mother_epic: { x: 288, y: 502, size: S },
  spouse_name: { x: 288, y: 482, size: S, maxWidth: 285 },
  spouse_epic: { x: 288, y: 462, size: S },

  // SIR left — value row centre ≈15pt below label baseline
  sir_elector_name: { x: 138, y: 396, size: S, maxWidth: 150 },
  sir_elector_epic: { x: 138, y: 378, size: S },
  sir_elector_relative: { x: 138, y: 360, size: S, maxWidth: 150 },
  sir_elector_relationship: { x: 138, y: 341, size: S },
  sir_elector_district: { x: 138, y: 323, size: S },
  sir_elector_state: { x: 138, y: 305, size: S },
  sir_elector_ac: { x: 138, y: 287, size: S },

  // SIR right
  sir_relative_name: { x: 348, y: 396, size: S, maxWidth: 150 },
  sir_relative_epic: { x: 348, y: 378, size: S },
  sir_relative_relative: { x: 348, y: 360, size: S, maxWidth: 150 },
  sir_relative_relationship: { x: 348, y: 341, size: S },
  sir_relative_district: { x: 348, y: 323, size: S },
  sir_relative_state: { x: 348, y: 305, size: S },
  sir_relative_ac: { x: 348, y: 287, size: S },

  // SIR bottom trio — inside boxes below header row (pdfY≈265)
  sir_elector_ac_no: { x: 118, y: 265, size: S, boxWidth: 72 },
  sir_elector_part_no: { x: 198, y: 265, size: S, boxWidth: 62 },
  sir_elector_sr_no: { x: 268, y: 265, size: S, boxWidth: 52 },
  sir_relative_ac_no: { x: 348, y: 265, size: S, boxWidth: 72 },
  sir_relative_part_no: { x: 428, y: 265, size: S, boxWidth: 62 },
  sir_relative_sr_no: { x: 498, y: 265, size: S, boxWidth: 52 },
};

/** @deprecated Use DEFAULT_FORM_COORDS or getFormCoords() from calibration.ts */
export const FORM_COORDS = DEFAULT_FORM_COORDS;

export const FORM_FIELD_KEYS = Object.keys(DEFAULT_FORM_COORDS) as FormFieldKey[];

export const CALIBRATION_GRID = {
  startX: 50,
  endX: 545,
  startY: 250,
  endY: 820,
  step: 20,
};
