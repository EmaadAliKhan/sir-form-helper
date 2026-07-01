import { getEffectiveFormCoords } from "./calibration";
import { buildCalibrationPreviewValues } from "./calibrationShared";
import { getDb, getSettings } from "./db";
import {
  expandRelationType,
  maskAadhaar,
  type FormPayload,
  type Manual2002Block,
  type Voter2002,
} from "./types";
import type { FormFieldKey, TextFieldCoord } from "./formCoordinates";
import {
  createEnumerationDocument,
  drawCalibrationGrid,
  drawDraftOverlay,
  drawFormValues,
} from "./formBuilder";
import { formatDobForPdf } from "./ui";

function getVoter2002ById(id: number): Voter2002 | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM voters_2002 WHERE id = ?")
    .get(id) as Voter2002 | undefined;
  return row ?? null;
}

function buildSirBlock(payload: FormPayload): Manual2002Block | null {
  const settings = getSettings();

  if (payload.was_in_2002) {
    if (payload.linked_2002_id) {
      const voter = getVoter2002ById(payload.linked_2002_id);
      if (!voter) return payload.manual_2002;
      return {
        name: voter.elector_name,
        epic: voter.epic_no ?? "",
        relative_name: voter.relation_name ?? "",
        relationship: expandRelationType(voter.rln_type),
        district: settings.district_2002,
        state: settings.state_2002,
        ac_name: settings.ac_name_2002,
        ac_number: settings.ac_no_2002,
        part_no: String(voter.ps_no),
        sr_no: String(voter.sl_no),
      };
    }
    return payload.manual_2002;
  }

  if (payload.linked_2002_id) {
    const voter = getVoter2002ById(payload.linked_2002_id);
    if (!voter) return payload.manual_2002;
    return {
      name: voter.elector_name,
      epic: voter.epic_no ?? "",
      relative_name: voter.relation_name ?? "",
      relationship: expandRelationType(voter.rln_type),
      district: payload.manual_2002?.district || settings.district_2002,
      state: payload.manual_2002?.state || settings.state_2002,
      ac_name: payload.manual_2002?.ac_name || settings.ac_name_2002,
      ac_number: payload.manual_2002?.ac_number || settings.ac_no_2002,
      part_no: String(voter.ps_no),
      sr_no: String(voter.sl_no),
    };
  }

  return payload.manual_2002;
}

function buildFieldValues(payload: FormPayload): Partial<Record<FormFieldKey, string>> {
  const address = payload.house_no?.trim() ?? "";
  const dobDigits = formatDobForPdf(payload.dob).replace(/\D/g, "").padEnd(8, " ").slice(0, 8);
  const electorBlock = payload.was_in_2002 ? buildSirBlock(payload) : null;
  const relativeBlock = !payload.was_in_2002 ? buildSirBlock(payload) : null;

  const values: Partial<Record<FormFieldKey, string>> = {
    blo_contact: [payload.blo_name, payload.blo_contact].filter(Boolean).join(" – "),
    elector_name: payload.elector_name,
    epic: payload.epic,
    address,
    serial_no: payload.serial_no,
    part_no: payload.part_no,
    ac_pc_name: payload.ac_name_2025,
    state_2025: payload.state_2025,
    aadhaar: maskAadhaar(payload.aadhaar, payload.show_full_aadhaar),
    mobile: payload.mobile,
    father_name: payload.father_name,
    father_epic: payload.father_epic,
    mother_name: payload.mother_name,
    mother_epic: payload.mother_epic,
    spouse_name: payload.spouse_name,
    spouse_epic: payload.spouse_epic,
    dob_0: dobDigits[0] ?? "",
    dob_1: dobDigits[1] ?? "",
    dob_2: dobDigits[2] ?? "",
    dob_3: dobDigits[3] ?? "",
    dob_4: dobDigits[4] ?? "",
    dob_5: dobDigits[5] ?? "",
    dob_6: dobDigits[6] ?? "",
    dob_7: dobDigits[7] ?? "",
  };

  if (electorBlock) {
    values.sir_elector_name = electorBlock.name;
    values.sir_elector_epic = electorBlock.epic;
    values.sir_elector_relative = electorBlock.relative_name;
    values.sir_elector_relationship = electorBlock.relationship;
    values.sir_elector_district = electorBlock.district;
    values.sir_elector_state = electorBlock.state;
    values.sir_elector_ac = electorBlock.ac_name;
    values.sir_elector_ac_no = electorBlock.ac_number;
    values.sir_elector_part_no = electorBlock.part_no;
    values.sir_elector_sr_no = electorBlock.sr_no;
  }

  if (relativeBlock) {
    values.sir_relative_name = relativeBlock.name;
    values.sir_relative_epic = relativeBlock.epic;
    values.sir_relative_relative = relativeBlock.relative_name;
    values.sir_relative_relationship = relativeBlock.relationship;
    values.sir_relative_district = relativeBlock.district;
    values.sir_relative_state = relativeBlock.state;
    values.sir_relative_ac = relativeBlock.ac_name;
    values.sir_relative_ac_no = relativeBlock.ac_number;
    values.sir_relative_part_no = relativeBlock.part_no;
    values.sir_relative_sr_no = relativeBlock.sr_no;
  }

  return values;
}

export const CALIBRATION_SAMPLE_PAYLOAD: FormPayload = {
  form_kind: "enumeration",
  elector_name: "Emaad Ali Khan",
  epic: "NVR2366466",
  serial_no: "476",
  part_no: "150",
  house_no: "7-1-277/156or294/c",
  relative_name_from_2025: "Hayath Alikhan",
  ac_name_2025: "Sanathnagar",
  ac_no_2025: "62",
  state_2025: "Telangana",
  blo_name: "Sample BLO",
  blo_contact: "9876543210",
  was_in_2002: true,
  linked_2002_id: null,
  manual_2002: {
    name: "Emaad Ali Khan",
    epic: "OLD1234567",
    relative_name: "Hayath Alikhan",
    relationship: "Other",
    district: "Hyderabad",
    state: "Telangana",
    ac_name: "Sanathnagar",
    ac_number: "208",
    part_no: "125",
    sr_no: "440",
  },
  dob: "02/02/2004",
  aadhaar: "3345678903",
  show_full_aadhaar: true,
  mobile: "06300729969",
  father_name: "Hayath Alikhan",
  father_epic: "",
  mother_name: "Basith Alikhan",
  mother_epic: "",
  spouse_name: "",
  spouse_epic: "",
};

export async function generateFormPdf(
  payload: FormPayload,
  options?: {
    calibration?: boolean;
    coords?: Record<FormFieldKey, TextFieldCoord>;
    /** When set, used instead of payload-derived values (calibration preview). */
    values?: Partial<Record<FormFieldKey, string>>;
    highlightField?: FormFieldKey;
  }
): Promise<Uint8Array> {
  const coords = options?.coords ?? getEffectiveFormCoords();
  const { doc, page1, font, fontBold } = await createEnumerationDocument(options);
  const values = options?.values ?? buildFieldValues(payload);

  if (options?.calibration) {
    drawCalibrationGrid(page1);
  }

  drawFormValues(page1, values, fontBold, {
    calibration: options?.calibration,
    calibrationFont: font,
    coords,
    highlightField: options?.highlightField,
  });

  if (!options?.calibration) {
    drawDraftOverlay(page1, font);
  }

  return doc.save();
}

export async function generateCalibrationPdf(): Promise<Uint8Array> {
  return generateCalibrationPreviewPdf(getEffectiveFormCoords());
}

export async function generateCalibrationPreviewPdf(
  coords: Record<FormFieldKey, TextFieldCoord>,
  highlightField?: FormFieldKey
): Promise<Uint8Array> {
  return generateFormPdf(CALIBRATION_SAMPLE_PAYLOAD, {
    coords,
    values: buildCalibrationPreviewValues(),
    highlightField,
    calibration: true,
  });
}

export { buildFieldValues };
