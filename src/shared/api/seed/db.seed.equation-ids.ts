// src/shared/api/db.seed.equation-ids.ts
// Stable UUID registry for every seeded condition / equation / note / extra-input row.
// All IDs are hardcoded so that `INSERT OR IGNORE` calls in db.seed.equations.ts
// remain idempotent across app restarts and migrations.

export const SEED_IDS = {
  // ─── Critical Illness ───────────────────────────────────────────────────
  crit_ill_root:     "24569aa6-3b20-4fc6-a8f5-9ea50d4f8c77",
  crit_ill_adult:    "143da29d-6b66-4f23-a663-5c43c542c7da",
  crit_ill_bmi_lt30: "555b185e-a90a-4299-bbdf-593fa759f3a7",
  crit_ill_bmi_30_50:"6b93a785-beb8-48d6-958e-485bef034da8",
  crit_ill_bmi_gt50: "b2c92094-c5a0-4599-9550-210493b382e4",

  crit_ill_lt30_kcal_low:  "880bb86c-41b4-4b91-a2b2-d16e98ab3f56",
  crit_ill_lt30_kcal_high: "fa3132dc-9a4c-4963-a3ef-f56fc644f81f",
  crit_ill_lt30_prot_low:  "2ae93032-beee-4256-8019-a7239b43dcfd",
  crit_ill_lt30_prot_high: "79326093-ae27-4e7f-9fff-101d3299db21",
  crit_ill_lt30_note1:     "87c51e30-2cc4-4cb8-8b28-344bdee06b29",
  crit_ill_lt30_note2:     "e9e4e9a9-0709-4476-bf2c-61b047e690b8",

  crit_ill_30_50_kcal_low:  "684951f9-2dd4-45ec-92ff-bd4c4aed60de",
  crit_ill_30_50_kcal_high: "823d6c63-1455-46f2-8f93-096cf5e60881",
  crit_ill_30_50_prot_low:  "33abef6f-cb06-4dbb-851a-87557a21e507",
  crit_ill_30_50_prot_high: "56a6afdd-7ffa-4406-802b-7efe37df8e85",
  crit_ill_30_50_note1:     "fbd75c3f-0fff-489d-929c-d6626a4b283a",
  crit_ill_30_50_note2:     "6e0ac609-ddbf-4d6e-8cb1-7598cef6bf88",
  crit_ill_30_50_note3:     "cacd724e-d5d6-4a1c-a9ec-9583117245d7",

  crit_ill_gt50_kcal_low:  "02f44926-c894-4e4e-a960-f9e126aa2ffb",
  crit_ill_gt50_kcal_high: "f5acd20f-38a3-4c66-aa0d-97022da79cbb",
  crit_ill_gt50_prot_low:  "b19c57f6-2698-4581-82aa-8187005fc8f7",
  crit_ill_gt50_prot_high: "445d7aba-5fcb-49a4-af3f-83cf0b2809fe",
  crit_ill_gt50_note1:     "768ffd32-0ed7-41ba-8654-f8a39f566c1a",
  crit_ill_gt50_note2:     "460cf2b5-b206-40c5-93df-6b95ec435ec6",
  crit_ill_gt50_note3:     "e131e283-dc12-475d-bf5d-07c96d5da098",

  // ─── AKI ────────────────────────────────────────────────────────────────
  aki_root:         "d9074d2d-a8d4-455c-8171-57c96655b738",
  aki_adult:        "2942afca-5507-47d1-8ca0-ecf4f9654f56",
  aki_no_dialysis:  "ef67362f-7406-4399-9a0d-3f4d60606f09",
  aki_hemodialysis: "9b8eedef-8094-47e2-8a1a-c290ac5bdf41",
  aki_crrt:         "d1bbb747-06a6-4365-adfa-807aa0031d6b",

  aki_no_dial_kcal_low:  "a3c5943e-9959-4dc5-937a-1d689c2f3866",
  aki_no_dial_kcal_high: "c8aa423b-ccd0-403a-aaa9-a81eb11bd203",
  aki_no_dial_prot_low:  "f2866734-e65b-4630-9300-ab1f09efe889",
  aki_no_dial_prot_high: "1a3d9157-b98a-46a5-973b-f6a71bfed888",
  aki_no_dial_note1:     "85547c11-174b-4783-90d8-8483af37dd58",
  aki_no_dial_note2:     "1a29d9d4-adca-4130-94aa-394af677fb78",

  aki_hd_kcal_low:  "e4b5102a-8fa4-42b6-98d5-c2a18f687d1b",
  aki_hd_kcal_high: "46a90f4c-b936-4d99-a173-6fdd4533dd57",
  aki_hd_prot_low:  "26facdfc-1754-4393-b91c-30aba00138c6",
  aki_hd_prot_high: "b7ad9f6b-31dc-43cc-a1e2-ab7291b5ff09",
  aki_hd_note1:     "9d9a4098-6899-485c-a4e2-95f24322ec2c",
  aki_hd_note2:     "0ed15b01-6ce1-49ed-9dcd-992760ad4809",

  aki_crrt_kcal_low:  "5f463292-3940-4468-aa5e-24b50f1aed7d",
  aki_crrt_kcal_high: "4ed7c218-5dd6-41bf-a437-5c8cfbf76212",
  aki_crrt_prot_low:  "2da12d89-81de-48ba-9620-006c4d95f582",
  aki_crrt_prot_high: "c10112aa-4551-4047-824b-343f32d76240",
  aki_crrt_note1:     "71ce2cc9-a9e7-409c-a7aa-d1f491416819",
  aki_crrt_note2:     "ad8d6bfd-783e-4ff2-bd10-d24fe1d126eb",
  aki_crrt_note3:     "37e0d5d6-d177-4180-bd89-90c9d62094f5",

  // ─── Acute Pancreatitis ─────────────────────────────────────────────────
  pancreatitis_root:        "3556410f-7176-4b91-97a4-adc52dc59a65",
  pancreatitis_adult:       "6d14aa26-ce9b-40b4-a734-964c6e6f0e5b",
  pancreatitis_mild_mod:    "b4ce6f78-7a30-493a-8b46-97334e7cf8cb",
  pancreatitis_severe_crit: "eddd1fe4-cb96-4475-aaba-2673b4d2d2c5",

  pancreatitis_mild_kcal_low:  "42b5c81f-f4ab-4b26-96fa-600aaf78d733",
  pancreatitis_mild_kcal_high: "c37b2974-6a01-470d-a196-0b1a72172d2b",
  pancreatitis_mild_prot_low:  "666cf333-e697-48d7-bef8-cd4cadde870c",
  pancreatitis_mild_prot_high: "c1319831-87e8-44cb-88b0-8f54ad724925",
  pancreatitis_mild_note1:     "9c104460-96b2-4970-806a-a3f6a6ff2014",
  pancreatitis_mild_note2:     "de4f0755-a78d-4980-a84b-faf69b397958",

  pancreatitis_severe_kcal_low:  "ba2e3c17-f502-4b3d-854c-a49b24db1e6e",
  pancreatitis_severe_kcal_high: "f2f30bb2-2a3d-46ef-928c-101c2e1023a6",
  pancreatitis_severe_prot_low:  "c31093c9-dffa-494c-ab09-c2e50fad8fc7",
  pancreatitis_severe_prot_high: "e45087eb-446b-4066-a81e-1b23869dda38",
  pancreatitis_severe_note1:     "240725ab-fc88-4ea2-96c6-8b40c20d1c69",
  pancreatitis_severe_note2:     "d5d8d9d6-f959-49f5-aab2-0dae6c2c7521",
  pancreatitis_ic_note:          "14273433-bcb5-433a-bd9f-d31cdb28fe9b",

  // ─── Trauma ─────────────────────────────────────────────────────────────
  trauma_root:         "a152d4d8-0efc-4bfd-9567-0fc5e8fcbd19",
  trauma_adult:        "b2e11c5a-b4ba-400b-9f36-6c2daaf2c3bc",
  trauma_standard:     "43d18d92-b757-4a78-9c69-4153ab8559bb",
  trauma_open_abdomen: "eb75700e-abee-481a-8972-a68120ab349b",

  trauma_std_kcal_low:  "bb6f35d9-e4c9-4499-95c5-8ecdf5021997",
  trauma_std_kcal_high: "e7f9d3d5-232d-4acf-b996-16408d72d60a",
  trauma_std_prot_low:  "d85a8f65-b6ba-4047-a189-5930e6342bbb",
  trauma_std_prot_high: "2f64b5ec-dcdb-4951-a798-b17f34139b42",
  trauma_std_note1:     "d571b0ec-cb0f-4322-99ae-c2641ecf61c8",
  trauma_std_note2:     "5d4b2612-60f0-4d5a-a61c-40df3c3ac6db",

  trauma_open_kcal_low:  "0e60c6c3-966b-429f-aff4-5d5fbcfc05e8",
  trauma_open_kcal_high: "c4b0f69d-35dc-46e2-b389-7c0ffbce0a5e",
  trauma_open_prot_low:  "800d8475-4c7f-4956-9474-fbbc18e52680",
  trauma_open_prot_high: "a94b7d8f-024e-42c7-8405-a934e7de2666",
  trauma_open_note1:     "450a4fa1-312e-4f58-b90e-a64e0b88fe48",
  trauma_open_note2:     "550bb86c-41b4-4b91-a2b2-d16e98ab3f56",
  trauma_open_note3:     "660bb86c-41b4-4b91-a2b2-d16e98ab3f56",

  // ─── Burns ──────────────────────────────────────────────────────────────
  burns_root:   "770bb86c-41b4-4b91-a2b2-d16e98ab3f56",
  burns_adult:  "780bb86c-41b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto:"7a0bb86c-41b4-4b91-a2b2-d16e98ab3f56",

  burns_toronto_kcal_low:  "800bb86c-41b4-4b91-a2b2-d16e98ab3f59",
  burns_toronto_kcal_high: "80bb86ca-11b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto_prot_low:  "80bb86ca-21b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto_prot_high: "80bb86ca-31b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto_note1:     "80bb86ca-41b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto_note2:     "80bb86ca-51b4-4b91-a2b2-d16e98ab3f56",
  burns_toronto_note3:     "80bb86ca-61b4-4b91-a2b2-d16e98ab3f56",
  burns_ic_note:           "0299dc32-dadc-4f1f-b40f-f8b7fcfbe9c8",

  // ─── Stroke ─────────────────────────────────────────────────────────────
  stroke_root:        "80bb86ca-71b4-4b91-a2b2-d16e98ab3f56",
  stroke_adult:       "80bb86ca-81b4-4b91-a2b2-d16e98ab3f56",
  stroke_ischemic:    "80bb86ca-91b4-4b91-a2b2-d16e98ab3f56",
  stroke_hemorrhagic: "80bb86ca-a1b4-4b91-a2b2-d16e98ab3f56",

  stroke_isc_kcal_low:  "80bb86ca-b1b4-4b91-a2b2-d16e98ab3f56",
  stroke_isc_kcal_high: "80bb86ca-c1b4-4b91-a2b2-d16e98ab3f56",
  stroke_isc_prot_low:  "80bb86ca-d1b4-4b91-a2b2-d16e98ab3f56",
  stroke_isc_prot_high: "80bb86ca-e1b4-4b91-a2b2-d16e98ab3f56",
  stroke_isc_note1:     "80bb86ca-f1b4-4b91-a2b2-d16e98ab3f56",
  stroke_isc_note2:     "80bb86cb-01b4-4b91-a2b2-d16e98ab3f56",

  stroke_hem_kcal_low:  "80bb86cb-11b4-4b91-a2b2-d16e98ab3f56",
  stroke_hem_kcal_high: "80bb86cb-21b4-4b91-a2b2-d16e98ab3f56",
  stroke_hem_prot_low:  "80bb86cb-31b4-4b91-a2b2-d16e98ab3f56",
  stroke_hem_prot_high: "80bb86cb-41b4-4b91-a2b2-d16e98ab3f56",
  stroke_hem_note1:     "80bb86cb-51b4-4b91-a2b2-d16e98ab3f56",
  stroke_hem_note2:     "80bb86cb-61b4-4b91-a2b2-d16e98ab3f56",

  // ─── COPD ───────────────────────────────────────────────────────────────
  copd_root:     "fef0537b-e899-4617-8adb-b08ecd11a75c",
  copd_adult:    "f82c5664-72da-4fad-b9e2-72bed4ae3c9b",
  copd_standard: "67f9911d-6c3f-475a-9321-0cc315285404",

  copd_std_kcal_low:  "a6a48753-1987-4e69-b1f2-8d14fcbae4a2",
  copd_std_kcal_high: "bfed715c-5249-47c3-93c8-9f58262dc4a2",
  copd_std_prot_low:  "0842b724-a482-4516-b19c-58c8b2646eb7",
  copd_std_prot_high: "a52ef462-5a8f-4230-b230-df31e29c966e",
  copd_std_note1:     "7bee51c9-e3ee-4c13-a2fd-6c06e4f355ce",
  copd_std_note2:     "0aadec47-5c38-460d-9d55-c42cc98abeb0",

  // ─── Heart Failure ──────────────────────────────────────────────────────
  heart_failure_root:     "dd2cd4df-811e-4559-a149-a08e835dd3bc",
  heart_failure_adult:    "17f18a19-8f1f-4e30-aa80-c800568173f7",
  heart_failure_standard: "18d65d08-bca2-460a-9a3e-1bfa24456183",

  heart_failure_std_kcal_low:  "d3ed0d73-25b2-4417-9dd7-f8dd64035dc6",
  heart_failure_std_kcal_high: "216f0cf9-4400-44bd-aed4-62286b1f7aca",
  heart_failure_std_prot_low:  "c35a64f3-8d03-4d14-bb8b-6023672b04e8",
  heart_failure_std_prot_high: "7cfeaee7-3861-4aa1-be7c-961ac0d4f3ba",
  heart_failure_std_note1:     "3444628a-24ea-4c1e-9bd1-e8b7dbdb3776",
  heart_failure_std_note2:     "6d202fdd-caab-4068-96bc-12ddce5ec5ff",

  // ─── Cirrhosis ──────────────────────────────────────────────────────────
  cirrhosis_root:          "be4f0477-58a5-4bab-b679-eb4ede89894f",
  cirrhosis_adult:         "5a087f64-8156-43b0-a72e-40a83a05500a",
  cirrhosis_compensated:   "8a4dec75-2ef7-4821-8aa8-21bbb9e9c8e0",
  cirrhosis_decompensated: "a15f89ce-2b71-4666-ada6-fa14aef6b7e7",

  cirrhosis_comp_kcal_low:  "1d864ef0-8a0c-4c85-ac46-c0671eada83b",
  cirrhosis_comp_kcal_high: "b2b950f3-6241-489b-ab7d-f8311a7b4d94",
  cirrhosis_comp_prot_low:  "2d81bb5d-1a2a-455a-a5e7-96b0ecdc4784",
  cirrhosis_comp_prot_high: "aa7e9ee4-7ddf-44b9-a319-6ce60d69c8cc",
  cirrhosis_comp_note1:     "b116cd83-e9a7-4e41-9ffd-17c923a5d940",
  cirrhosis_comp_note2:     "092a8c5b-d6fa-4756-8cf1-1fc72559d666",
  cirrhosis_comp_note3:     "1f8c0512-0247-4b6f-b630-8addeb65d4ed",
  cirrhosis_comp_note4:     "bc0a2c9e-3992-45d6-8235-ca1f8cd48553",

  cirrhosis_decomp_kcal_low:  "435efb60-f5a0-4d35-9a91-25d474b7438a",
  cirrhosis_decomp_kcal_high: "4cd043bd-7730-42ee-bb13-6b4d658c6843",
  cirrhosis_decomp_prot_low:  "606ca5e0-ebb5-4411-bb51-f8845520c3e9",
  cirrhosis_decomp_prot_high: "b3f19836-e9d5-479a-b4b4-a530802f7554",
  cirrhosis_decomp_note1:     "89a2b457-829b-4713-86fa-4e93ec4e8760",
  cirrhosis_decomp_note2:     "6bce7e3f-7e79-4b4e-90fc-8d4f9bbda11b",
  cirrhosis_decomp_note3:     "fcc033c3-a5e9-41c0-b325-fad2b968dafc",
  cirrhosis_decomp_note4:     "b7c44c36-7c33-4fb6-b7c3-a05b54f4bc11",
  cirrhosis_decomp_note5:     "87e2ce8f-2dcf-469c-867e-c499ab472f8f",

  // ─── Liver Transplant ───────────────────────────────────────────────────
  liver_transplant_root:    "d496ee92-fd8c-45f2-9434-63f55b405fad",
  liver_transplant_adult:   "30ffb4da-3b92-4461-926a-e8c993d426b5",
  liver_transplant_acute:   "e36c76a3-37ce-475f-b91c-df4d5f88f460",
  liver_transplant_chronic: "5bb88aa3-7105-48b8-9d51-c719dbe0b2f8",

  liver_transplant_acute_kcal:      "0cc2bdb2-f607-4be3-84ea-ab77c1c0e2b7",
  liver_transplant_acute_prot_low:  "b322a913-ca52-40f8-ba90-122da218d6b4",
  liver_transplant_acute_prot_high: "fdaa5b74-4d87-470a-b30e-e9b497fe36a2",
  liver_transplant_acute_note1:     "29c60318-7908-45bf-96f8-ddd58aeb401d",

  liver_transplant_chronic_kcal_low:  "719a8e8b-eb54-4981-8785-d74fad6309b0",
  liver_transplant_chronic_kcal_high: "5778b68c-045e-4a07-95c9-25a3c6b14528",
  liver_transplant_chronic_prot_low:  "a1e3e975-be32-4b0f-86f2-092d0b7d4c4f",
  liver_transplant_chronic_prot_high: "2b055478-5bfb-4a37-92a4-67f896bc77c7",

  // ─── CKD ────────────────────────────────────────────────────────────────
  ckd_root:      "c80f6b69-a0b2-4207-8dbb-b20c3db2ef9a",
  ckd_adult_3_5: "d8de9719-c878-4ece-b00f-9993d541d823",
  ckd_vlpd:      "d4c82475-053b-458b-88f3-b04d401bc1ad",
  ckd_lpd:       "7ee94b4a-fb53-4542-af85-4ed77b1f3a46",
  ckd_lpd_dm:    "aa5eff9e-d7a9-4097-9d6d-6673558decec",

  ckd_vlpd_kcal_low:  "da33bf3d-4942-408f-9416-6a7e7b50eaff",
  ckd_vlpd_kcal_high: "829aeabe-a055-415a-a967-31ae084b78d1",
  ckd_vlpd_prot_low:  "b5665a22-2b29-4ae0-90a6-5c47c793bd29",
  ckd_vlpd_prot_high: "f4b8749c-f055-42e8-935a-6f983a090022",
  ckd_vlpd_note1:     "2f43e465-be28-455e-8b7b-16892b6a97f7",

  ckd_lpd_kcal_low:  "c455c103-9de4-4ef0-b388-c40f19212112",
  ckd_lpd_kcal_high: "317b8b92-64db-41a1-afa5-9159bf30ab70",
  ckd_lpd_prot_low:  "a1e314c4-6609-4dce-8601-82a26bfe450e",
  ckd_lpd_prot_high: "c5e05584-1329-4415-a208-a5e0a9e16633",
  ckd_lpd_note1:     "7473c4af-0126-43a5-946a-42dc1c180a10",

  ckd_lpddm_kcal_low:  "53422fe5-1439-42e8-beb9-5d43f6fb109e",
  ckd_lpddm_kcal_high: "d3d73cbf-450a-4f9b-9f73-0280d9e7918f",
  ckd_lpddm_prot_low:  "781aded4-e6be-4385-8f1e-aadb74de77c3",
  ckd_lpddm_prot_high: "901dab30-eefa-4354-90bf-cc82bf981fed",
  ckd_lpddm_note1:     "a237ba2e-b92c-4245-a797-bcad70ed31c2",

  ckd_adult_5d: "1cd5eae8-66e1-4365-aca0-a5c54783e06c",
  ckd_hd:       "ab94dc5b-4e2b-45b7-b373-df1ea313917e",
  ckd_pd:       "22b972e5-4340-428b-97cd-b2ff15156f55",

  ckd_hd_kcal_low:  "324b04c4-d250-48f0-9443-7ac8ed4b4f46",
  ckd_hd_kcal_high: "88800806-5313-42fc-afd3-010e992113c2",
  ckd_hd_prot_low:  "cd7dec8e-2c06-4636-b5b3-ff6915cedf62",
  ckd_hd_prot_high: "95c34361-5ad6-4cbd-b695-7475c3003a39",
  ckd_hd_note1:     "ab38795d-5193-4701-a583-92b0b5c0f626",

  ckd_pd_kcal_low:  "87e0bc77-a6ad-4c96-8f69-f59c344876cb",
  ckd_pd_kcal_high: "e4fa06c9-dbc4-4e53-beef-8fdf49c9cfee",
  ckd_pd_prot_low:  "6a7648d4-3eff-469d-b854-62b65316a836",
  ckd_pd_prot_high: "e4defe1c-5c10-4254-b424-171c1653ca41",
  ckd_pd_note1:     "3cb5f5b3-2c80-4881-a4fb-4dcf43cd2608",

  // ─── Kidney Transplant ──────────────────────────────────────────────────
  kidney_transplant_root:       "70db06df-b8c8-4c43-bb9b-eedfbe1813e2",
  kidney_transplant_adult:      "483148fa-2320-45e8-bb93-871513c737e5",
  kidney_transplant_acute:      "91fdcb71-13d4-4231-83ab-cbfd2aa1dfb6",
  kidney_transplant_chronic:    "da734a46-cb54-48f5-a64f-fa7a3a231632",
  kidney_transplant_chronic_dm: "c1da6dec-ffd4-4ac6-b390-a1434c6f67bc",

  kidney_transplant_acute_kcal_low:  "cb0915f7-8929-4721-9465-5be1734e10c7",
  kidney_transplant_acute_kcal_high: "914fc920-38c8-4f79-aaac-79ae85942d00",
  kidney_transplant_acute_prot_low:  "07e9ba60-e459-437e-8796-86322961b647",
  kidney_transplant_acute_prot_high: "69846c38-2d69-400a-a48a-e50c9a89751a",
  kidney_transplant_acute_note1:     "06a9fc5e-a620-44e3-af14-4bdc4523a685",

  kidney_transplant_chron_kcal_low:  "a828d430-8c0d-4b64-ae4e-e407230b38dc",
  kidney_transplant_chron_kcal_high: "c31a63ef-fa81-4105-8012-b3170ed1fe33",
  kidney_transplant_chron_prot_low:  "a990ec87-7d6f-4a8a-ae2f-ee504c48133c",
  kidney_transplant_chron_prot_high: "2e6e8162-7bb1-49e1-906e-9ff417f9966e",

  kidney_transplant_chrondm_kcal_low:  "95e4bfa6-744b-47d7-b62c-638b4f3c26b6",
  kidney_transplant_chrondm_kcal_high: "0c7cce2d-5351-48f4-ae81-6f6c8c88b39d",
  kidney_transplant_chrondm_prot_low:  "2b44c1bd-2667-4746-b387-b493e7a3ee13",
  kidney_transplant_chrondm_prot_high: "3313d4cc-5033-4aa1-a2c4-5ac396d2e384",

  // ─── MASLD / MASH ───────────────────────────────────────────────────────
  masld_mash_root:         "a70fee2e-6da9-4387-9dbf-9ac6283c9145",
  masld_mash_adult:        "1503a96c-b26f-4b07-98fc-54099fb507df",
  masld_mash_standard:     "25d4e5d1-3876-499d-b3af-c6d84bcaf5bd",
  masld_mash_malnourished: "ad0acca3-5184-4f28-a40b-2a6c45ef4ce4",

  masld_mash_std_kcal_low:  "6d471019-e279-4105-8ccd-e3ad9a0569d0",
  masld_mash_std_kcal_high: "3eb80628-2ee0-4adc-bbc5-651276ac2822",
  masld_mash_std_prot_low:  "06d670b9-a1fb-472a-b850-ef82940bf806",
  masld_mash_std_prot_high: "3c5242d0-21af-43b0-a908-9903556bcfea",
  masld_mash_std_note1:     "d0b34030-ef05-42ed-bc48-63b25fa41d54",
  masld_mash_std_note2:     "f073e887-668e-489c-9d24-e4b1855dacb6",

  masld_mash_mal_kcal_low:  "323f2ff9-e3d5-4fcd-a95f-774ff48db3c0",
  masld_mash_mal_kcal_high: "b3f5b999-c573-4d60-8833-45138499ed7b",
  masld_mash_mal_prot_low:  "32e83cee-f4da-4633-b285-a4b2f53b0c8e",
  masld_mash_mal_prot_high: "2391d4b6-3bd2-46cd-b4bf-8fd2211e6f44",
  masld_mash_mal_note1:     "5797251d-fb04-4693-b4dd-fd31db32bf52",
  masld_mash_mal_note2:     "2f1af71a-49c1-4dbb-b6ed-b5fbb9259012",

  // ─── Oncology ───────────────────────────────────────────────────────────
  onc_root:      "b73fe71d-3f40-4875-a09b-31e8b2b2ebab",
  onc_adult:     "58ea1dbd-2dc8-465c-b150-0e0e1a4268e1",
  onc_sed:       "73e1d78e-b596-47a7-a027-05035b50548c",
  onc_hyper:     "c67e1c6c-a5e1-48bc-8273-b64e22c4ebd7",
  onc_stressed:  "a1053cf9-b03b-4260-8c8c-857536308adb",
  onc_highprot:  "acd8fefd-b306-4ab6-9bd5-f8a536f690a0",

  onc_sed_kcal_low:  "96a789a2-1b05-4421-8315-68d061586389",
  onc_sed_kcal_high: "ab467e42-4971-4262-8a81-67082806ade7",
  onc_sed_prot_low:  "275c711f-7131-478e-950a-d0427f97c79a",
  onc_sed_prot_high: "36cf69e3-46bc-40f1-8404-f99a151da4b5",
  onc_sed_note1:     "c9330a80-dace-4d56-974e-439c259cd5da",

  onc_hyper_kcal_low:  "ae6b3aa2-3b78-4003-981c-5367fb3802ff",
  onc_hyper_kcal_high: "533ca5a3-bb3d-47cd-84b9-06023c2dc8f8",
  onc_hyper_prot_low:  "559ce5a7-75e3-43ee-ae4b-53f4fa08d862",
  onc_hyper_prot_high: "fa6921ec-7faf-4dd2-9b1a-4feb9e5d61fa",
  onc_hyper_note1:     "d6c0dde1-b87a-4fd1-9ebb-8a4e59f8b1df",

  onc_stressed_kcal_low:  "301ca76e-9eb0-48dc-91b2-fa6d560b533e",
  onc_stressed_kcal_high: "17dd2de5-62ec-4464-a114-56174d4de3a9",
  onc_stressed_prot_low:  "5b00a2e4-f4f1-4d0f-ac20-52750a17680d",
  onc_stressed_prot_high: "8aa8cabd-6c74-4cdf-b803-b09a754107c4",
  onc_stressed_note1:     "448e95d7-b6bf-4c17-a5eb-d6607ad3dfbc",
  onc_stressed_note2:     "f42532fd-4000-43d8-8809-97afa8f0f0d1",

  onc_highprot_kcal_low:  "dd18dc49-196b-499f-ba7a-dc9e6c4e90b8",
  onc_highprot_kcal_high: "aa0db56a-2fcc-4971-bfc2-eb0ba253c4fc",
  onc_highprot_prot_low:  "a8a6225a-cab8-40c5-9885-95937280bf2c",
  onc_highprot_prot_high: "ea6e8764-5f1e-433b-9f94-7f4bb3f499d6",

  // ─── HSCT ───────────────────────────────────────────────────────────────
  hsct_root:     "346d743a-acb5-47f0-af38-5578c0524cf0",
  hsct_adult:    "06a49714-ff65-4950-abdd-8785f9f033d5",
  hsct_active:   "e9d09f74-4f37-4195-a4c2-d0ec420d742f",
  hsct_recovery: "3e4ad0cf-1562-45df-bb12-c580b6d84bce",

  hsct_active_kcal_low:  "050eb090-26ea-4efe-b9bc-a126397405e6",
  hsct_active_kcal_high: "18817bf9-87c1-4663-a915-c2dd6ff962c9",
  hsct_active_prot_low:  "998e6128-3ba4-40bc-8eb6-44891b419bfd",
  hsct_active_prot_high: "e6a808f1-a09c-4256-bce6-e4abbbc7869e",
  hsct_active_note1:     "7e4e7e69-106f-473d-9f26-ba9154b1ae30",
  hsct_active_note2:     "7b891b1f-d5a9-4e7f-b5d4-142a1e53b7f1",

  hsct_rec_kcal_low:  "6b9aad4d-dd2f-446f-89ea-ce6b967eaefb",
  hsct_rec_kcal_high: "91a397ef-f16c-46f7-8b5f-4890e59d1622",
  hsct_rec_prot_low:  "199eeb05-4f65-4c06-856d-469edaedce1a",
  hsct_rec_prot_high: "2a99fd29-40ff-47aa-a65f-1351e62e91ab",

  // ─── Short Bowel Syndrome ───────────────────────────────────────────────
  sbs_root:      "c3f9ba15-2cf7-4672-8626-c5579d00440d",
  sbs_adult:     "6d48af54-5561-49af-82ef-94d9bf86e877",
  sbs_standard:  "8a409298-88b7-4229-8b8c-b45cedd1f331",

  sbs_kcal_low:  "69bde7d3-d680-4892-89bf-88d78f0c101c",
  sbs_kcal_high: "ba2c5f22-573e-4f6e-a258-8524c533c10a",
  sbs_prot_low:  "a735e894-886f-4ea3-afe9-eda53ab477cd",
  sbs_prot_high: "e0adeb03-fc88-4f42-b5bd-77eb983f4472",
  sbs_note1:     "bedece10-aeb0-4f89-8014-7e8008291bda",
  sbs_note2:     "f10ec614-6d46-4940-b651-55cde1eacb5b",
  sbs_note3:     "6ed705c0-1cac-4b65-b405-1a4331e9635b",
  sbs_note4:     "66c48862-6c62-4c7a-a2e9-acc0dc603546",
  sbs_note5:     "b51ee193-38d8-4151-a699-9125ccea51f5",

  // ─── Cystic Fibrosis ────────────────────────────────────────────────────
  cf_root:      "9e24255f-6cdb-4549-a6e0-6b043b41e2ba",
  cf_adult:     "9abce5b8-9674-4c60-b981-54b7c335a87d",
  cf_bedbound:  "af819e81-5a0e-4c23-ac1c-bee60b77cb06",
  cf_sedentary: "7867cb88-b255-4143-9c47-36336788114c",
  cf_active:    "d4870952-8c5b-44c7-a899-661270e2bbea",

  cf_bb_kcal_low:  "d82aefea-9dca-4b8b-8ae5-12ae2d2256bc",
  cf_bb_kcal_high: "6bfdd92a-7bb0-4be7-9514-bdaef078c309",
  cf_bb_prot_low:  "1493a6ca-d56a-48e8-b8da-a87e9e8ed785",
  cf_bb_prot_high: "035afe82-3f81-4f61-97da-d395c26425a1",

  cf_sed_kcal_low:  "13cdcffe-b2f4-489a-9b0d-d799b9e70bbb",
  cf_sed_kcal_high: "0626e3ef-151d-4a71-9695-9033ef09e115",
  cf_sed_prot_low:  "ea8884ad-f911-45b5-a74e-5c8d8da3758d",
  cf_sed_prot_high: "8b21768d-4e3d-43b9-84c9-e483ccb5bd1a",

  cf_act_kcal_low:  "13e64a4a-cbaf-4ee6-8820-3389ef05ff78",
  cf_act_kcal_high: "e111be60-1cd5-4271-ae3c-3ee5e740a0b7",
  cf_act_prot_low:  "685848cf-f1c8-4aa0-9d93-4b69baa15e97",
  cf_act_prot_high: "dd7f3550-d4cd-482b-b5e5-9c7c60cc9249",
  cf_note1:         "7ced931e-f1c1-445e-9d24-df327572285b",
  cf_note2:         "43cd7daf-5a85-4811-a5ac-0b2143b4eb6b",

  // ─── Sickle Cell Disease ────────────────────────────────────────────────
  scd_root:   "5874273c-98ca-4530-a612-e87bd0a7ca3f",
  scd_adult:  "dffbfdd7-a6f6-46c1-9f7f-21b88c2f57e0",
  scd_stable: "1ed8e5c2-e6e2-455d-bacc-7d1a5660f7e3",
  scd_voc:    "a00f7e36-b324-486e-b092-423a91703eaa",

  scd_stable_kcal_low:  "1e9db64f-8324-4e9c-bc75-35897cf2b7b7",
  scd_stable_kcal_high: "57a6d579-ddb0-439b-8f9f-afe45a12bf76",
  scd_stable_prot_low:  "5bc85602-0ac6-41ba-b77c-e555cc57dc0a",
  scd_stable_prot_high: "d96c0d19-e8ad-4268-bc29-3f04701de5e5",
  scd_stable_note1:     "8542b637-9d96-4d9a-a061-4020f0a3d5b1",

  scd_voc_kcal_low:  "03648a47-03e3-4f6d-915d-ebfd03b65038",
  scd_voc_kcal_high: "26ade534-cf3f-4156-8563-9a96cf3990e8",
  scd_voc_prot_low:  "b6d9a360-713a-4434-99c1-7717bdd89ae7",
  scd_voc_prot_high: "cb962985-2c1a-488a-94c9-c8c92d58252d",
  scd_voc_note1:     "dd78fc91-48b0-4c43-a302-4cc017df162a",

  // ─── Pressure Injuries ──────────────────────────────────────────────────
  pi_root:      "5457889b-2760-4ef8-adb9-db2dbc9ca62f",
  pi_adult:     "6b34af9c-7025-4eec-9225-9a28d465e598",
  pi_stage1_2:  "51d6a728-8618-40e2-822b-30089e8c579d",
  pi_stage3_4:  "66b1563c-1525-4fe2-a65b-a87010cebcf9",

  pi_stage1_2_kcal_low:  "433665d1-3b7b-44b1-9577-ce70019cc386",
  pi_stage1_2_kcal_high: "1c7afdb6-79d6-4d73-9972-263cb43114ac",
  pi_stage1_2_prot_low:  "ac659d5a-7d09-4253-ba55-a3b97d219329",
  pi_stage1_2_prot_high: "09c4317a-bf68-4b30-80e2-5527c100193f",

  pi_stage3_4_kcal_low:  "298d6f05-1e8f-483f-a12d-8d233c769d3f",
  pi_stage3_4_kcal_high: "2f7daa5a-652e-4e48-913b-ea6813c156f9",
  pi_stage3_4_prot_low:  "93d49076-0053-492b-bf75-582cf0b504d6",
  pi_stage3_4_prot_high: "47ac3bae-27e1-4b56-b6c7-4718e2a50fa6",
  pi_stage3_4_note1:     "20e24a34-ab29-40f3-b4aa-497d187de32b",

  // ─── Severe Malnutrition ────────────────────────────────────────────────
  mal_root:       "2d81ae3d-c457-4169-a056-7f27b34d2645",
  mal_adult:      "0350fa76-dec0-4cbc-a3c5-ec43b05764a1",
  mal_refeeding:  "c2bda023-6358-4d25-9739-865d5623a5fd",

  mal_kcal_low:  "252c9422-e159-4e2e-a9ff-670e69d65449",
  mal_kcal_high: "af411b35-ca4e-4545-9af9-daf57e65b975",
  mal_prot_low:  "bd3278d5-a73b-4e99-b748-bdfe90aa1b8d",
  mal_prot_high: "eb8e291f-281f-459f-a912-ee69ebda2c4c",
  mal_note1:     "05e1d743-7069-406a-bd3e-5b35149523b7",
  mal_note2:     "5459469d-dca1-4f49-9f7b-6801130f4733",

  // ─── Obesity / Metabolic Syndrome ───────────────────────────────────────
  obe_root:   "a09b0c7b-e25d-469a-9877-cf077e4ce81d",
  obe_adult:  "fbbc2782-0337-4d11-b410-c09fbed53234",
  obe_stable: "6c29f425-e35e-49cc-a1a5-3dfc978d0099",

  obe_kcal_low:  "be586e65-c215-491e-920c-4aaecd6ae599",
  obe_kcal_high: "1d91ad57-24dd-48aa-9532-a83bddbcaedd",
  obe_prot_low:  "d121b0c5-98e7-499a-8eb0-faf3617f497f",
  obe_prot_high: "b4031f5-6bd4-4a67-a879-2fe7b18bd517",
  obe_note1:     "e38f2d9e-47ff-403e-ae4f-4a808a4da7f0",
  obe_note2:     "fb52cb03-484b-43fb-9844-04b92b328f9a",

  // ─── Pregnancy ──────────────────────────────────────────────────────────
  preg_root:  "987e18e1-8952-4cfb-8fd9-7a3522401b0a",
  preg_adult: "abbfc9b6-5730-4ad2-950a-010f3f0ddfc5",
  preg_t1:    "25735c60-6af0-4009-8413-d0dfa26bf432",
  preg_t2:    "52f91d82-bd76-4ec4-8e0c-a553722edd64",
  preg_t3:    "a5bc2b60-d92a-477a-8415-aa9197710217",

  preg_t1_kcal_low:  "5a1fbfb1-9935-4143-bb8d-042e8f4278be",
  preg_t1_kcal_high: "28e9265f-3712-4c36-9f92-57409663cd0d",
  preg_t1_prot:      "7493bbab-7359-4db2-82f3-041826ced1ee",
  preg_t1_note1:     "8b49ac02-22cc-4732-bdc7-b9359358b06b",

  preg_t2_kcal_low:  "baebf926-d4b9-4ffb-a936-90652bc08ea9",
  preg_t2_kcal_high: "219687f9-95cc-4c62-a46b-19424e36b403",
  preg_t2_prot:      "be554101-4f80-4640-9e88-83b7431e0437",
  preg_t2_note1:     "0ec3b0a1-b162-49d5-905c-f7ac1883fc21",

  preg_t3_kcal_low:  "78632d49-ecaf-4c29-80fd-ad8d9d3dce03",
  preg_t3_kcal_high: "af80d3fa-695a-4d8e-8211-fac283f0b65c",
  preg_t3_prot:      "61be8ea2-72e2-44be-93ad-ab5a61e06af6",
  preg_t3_note1:     "7b3fbdd7-870b-4f4e-aaf0-ca7e65e73cc8",

  // ─── Breastfeeding ──────────────────────────────────────────────────────
  bf_root:  "c61dd0fb-7306-43a0-91d5-e96556e13199",
  bf_adult: "b6294ebb-a34b-4f9a-b372-f7f01a8000d1",
  bf_early: "53eff777-6d44-4260-b822-274ee1741577",
  bf_late:  "96949fcf-2f5d-4816-8d8e-31ce82eefcf0",

  bf_early_kcal_low:    "73900f04-e62f-41b8-a469-991880019f30",
  bf_early_kcal_high:   "2e0a9cd8-d659-4003-9663-54a0a0629a12",
  bf_early_prot:        "fa72ed7f-fc31-43b2-bd5f-2e87c3743a1b",
  bf_early_note1:       "b0894a59-86e4-4015-af11-fc85c8e24962",
  bf_early_energy_note: "b3e2c280-df3e-4c3e-b8f0-4e101a24ae98",

  bf_late_kcal_low:    "f4a6435a-c6fe-41b0-8b34-40d8a03fec4c",
  bf_late_kcal_high:   "addf8617-b2e4-4eec-862d-eb1db04e857a",
  bf_late_prot:        "99fe1ae8-8468-4df5-a2e7-8f8146c69e38",
  bf_late_note1:       "7f9f2f67-504a-4aa4-aed8-0afa5247cc7a",
  bf_late_energy_note: "927ff6c7-66a5-4b31-9eae-1aba7609df94",

  // ─── Healthy / Preventive ───────────────────────────────────────────────
  hl_root:     "5bc044bb-79db-47d2-baf9-755566b0a4de",
  hl_adult:    "5eb912d3-5d27-46ce-87e4-90ad15696243",
  hl_standard: "96ea4c26-1037-4686-b7b4-69daca988b2d",

  hl_kcal_low:  "64dc591b-da1b-437a-a8fb-7bdf20a7cd1b",
  hl_kcal_high: "800b2933-2566-4bd3-851d-2afd90847662",
  hl_prot_low:  "231efb52-272b-4efa-8b2b-c8d919ee10a0",
  hl_prot_high: "ba6849da-6d1e-4870-a8c9-b82109c5ff9e",
  hl_note1:     "a1a1e6e8-9c72-4009-92b9-45e92ab8e067",

  // ─── Pediatric Critical Illness ─────────────────────────────────────────
  crit_ill_peds:          "726d5ac3-e334-4539-8ad0-8f1bdf63ef6f",
  crit_ill_peds_std:      "1aaef0ac-0b89-4a6e-8422-280dfcf57256",
  crit_ill_peds_kcal_low:  "baf23319-c034-44ec-97df-f8b6b00b5d84",
  crit_ill_peds_kcal_high: "84f5a423-110c-414a-a9f5-a6c0a5669d5a",
  crit_ill_peds_prot_low:  "e1fab089-850e-46b5-a835-d30310e5a1c0",
  crit_ill_peds_prot_high: "6cb5527a-f529-4555-aa39-e58d055e7d58",
  crit_ill_peds_note1:     "4fa2ec45-8f58-4ed6-9f30-3f3a07cf0fcd",
  crit_ill_peds_note2:     "fab16151-2943-4509-a59a-cfe2b482681b",
  crit_ill_peds_note3:     "6cd62141-2485-4da3-8a7b-54fd2dd6d707",

  // ─── Pediatric AKI ──────────────────────────────────────────────────────
  aki_peds:          "e29f7671-3f0b-4c99-a17b-968c203a1059",
  aki_peds_nodial:   "c1fb9e39-f436-4ec1-bdf5-9b7fba42e09f",
  aki_peds_dial:     "874fa806-a184-4dc7-bbde-ecd849909791",

  aki_peds_nodial_kcal_low:  "ffd52992-609d-4a48-8797-5fd32190129a",
  aki_peds_nodial_kcal_high: "b6da99ea-7c1d-422b-9d97-83fd2e314ef6",
  aki_peds_nodial_prot_low:  "0248807f-a3ac-4929-a05c-8741fcd87e40",
  aki_peds_nodial_prot_high: "953d3626-c674-4bcf-80a8-9c84d9418b64",
  aki_peds_nodial_note1:     "2a7b0811-c0da-4c1c-ab16-4bed22d937c7",
  aki_peds_nodial_note2:     "b30a63f7-23b1-421b-a053-f0248afbe70f",

  aki_peds_dial_kcal_low:  "a30b83e8-0bc3-410e-9b9b-14f2163c87f2",
  aki_peds_dial_kcal_high: "c7525de9-35e7-46db-a7af-70896dfab4b5",
  aki_peds_dial_prot_low:  "b033e75e-2e95-4a2b-88ba-10ad7b64a92e",
  aki_peds_dial_prot_high: "67817ee7-0f74-4c1e-894e-f744b9f1aa91",
  aki_peds_dial_note1:     "8448fba3-2854-4d8a-8889-d272a53021e2",
  aki_peds_dial_note2:     "a1fe2d29-85a1-453f-bc9e-146a72d0fea9",
  aki_peds_dial_note3:     "91db2f8d-4dda-4240-b2cd-74708d3f50ae",

  // ─── Pediatric Acute Pancreatitis ───────────────────────────────────────
  pancreatitis_peds:          "0998af20-31a5-4997-b8fe-29fd3fb860ff",
  pancreatitis_peds_std:      "94e66888-626e-4ba0-8058-86baaf970379",
  pancreatitis_peds_kcal_low:  "85053fae-0288-4fe4-a882-00373834dad5",
  pancreatitis_peds_kcal_high: "9d408951-d02f-4a23-b73c-da7770f59d68",
  pancreatitis_peds_prot_low:  "f38aabe7-040e-4897-9034-92ebb1a7590a",
  pancreatitis_peds_prot_high: "4a639421-51da-4fc3-85b6-61af7a2c022f",
  pancreatitis_peds_note1:     "4144ff66-0662-47b0-96d6-561149cb1415",
  pancreatitis_peds_note2:     "b3e897de-8766-4153-82a9-2cf23ec00a94",

  // ─── Pediatric Burns ────────────────────────────────────────────────────
  burns_peds:       "c43ce3e0-cc59-4d38-b87e-77e9c8bf5cf1",
  burns_peds_child: "3121a94c-cb6e-4059-ab34-c9c09d970648",
  burns_peds_adol:  "7ce3e26f-d58c-4829-9871-5685d8abe40e",

  burns_peds_child_kcal_low:  "2a035851-d26a-4dd8-bbd8-b9193898f817",
  burns_peds_child_kcal_high: "4b3ab06f-43c2-4b79-aeca-f996a57954cc",
  burns_peds_child_prot_low:  "a763d4d4-d4ad-4137-bd55-1b3145b1cf4d",
  burns_peds_child_prot_high: "0d29f5a3-bc1d-4fab-aada-7bfb5cd9b57f",
  burns_peds_child_note1:     "f3753381-4302-46b1-ad94-de6413ed908a",
  burns_peds_child_note2:     "401b7115-8234-4e70-a4e2-19e32506fa70",

  burns_peds_adol_kcal_low:  "224d6d16-1146-4984-b2b7-7fc27c21a5f3",
  burns_peds_adol_kcal_high: "5f99bce1-ddfb-43eb-9d2d-dca621c08c59",
  burns_peds_adol_prot_low:  "9a73781d-e628-415d-bbbd-6d6d35a5e458",
  burns_peds_adol_prot_high: "81430256-b167-4756-835d-fa01009b0ab2",
  burns_peds_adol_note1:     "3a754426-8e6b-4eec-aa0d-97022da79cbb",
  burns_peds_adol_note2:     "8991636e-84db-46f7-8055-67d566ad6c9a",

  // ─── Pediatric Oncology ─────────────────────────────────────────────────
  onc_peds:             "ad5b4337-3fba-4819-95d6-9c9ba7367fe6",
  onc_peds_std:         "0f21ee1b-b88c-41ba-b18d-8e8730897456",
  onc_peds_undernourished: "e2906a23-365a-4d6f-bede-e5dc49f3e9ff",

  onc_peds_std_kcal_low:  "24a0c70a-1dc9-4250-8e8d-430b5ffafc5a",
  onc_peds_std_kcal_high: "42247cee-1da2-43fb-8e3f-3a18ec39b972",
  onc_peds_std_prot_low:  "e376a3c5-59d4-4566-a996-6795ea992c7f",
  onc_peds_std_prot_high: "39476f27-ec47-42a9-baad-4ae701b098ed",
  onc_peds_std_note1:     "42526d84-4f83-4c93-96f2-6ece0a80e008",
  onc_peds_std_note2:     "99ba77fe-b5a4-47ec-9bd9-8b2758432f4a",
  onc_peds_std_note3:     "f7313962-edd8-4e46-955c-aec84711b44d",

  onc_peds_und_kcal_low:  "73ee35e3-bc11-4bf0-a8d6-57203c32e8d2",
  onc_peds_und_kcal_high: "71da6252-ff2b-4c73-bcd3-cfedd31fff70",
  onc_peds_und_prot_low:  "6761962d-ced1-40c7-a152-19e75a67b5c7",
  onc_peds_und_prot_high: "7c1e0e0d-29c0-4f51-a0af-268ccad161ca",
  onc_peds_und_note1:     "867ba2ed-03fe-48cb-b53b-fd4c5dbc460d",
  onc_peds_und_note2:     "f1d4e708-503a-4676-873b-d1f05a60f3c5",
  onc_peds_und_note3:     "3ec7f65f-e8d4-4d87-a23d-d7faa9d4776d",

  // ─── Pediatric CKD Stages 3–5 ───────────────────────────────────────────
  ckd_peds_3_5:      "d4aceb86-2310-4e90-9d1e-116eb5fda6d9",
  ckd_peds_3_5_std:  "edab2db9-554e-410d-8f11-01a4c8ac1414",

  ckd_peds_3_5_kcal_low:  "910f4644-8673-4460-b6fe-2f215ef41fc1",
  ckd_peds_3_5_kcal_high: "afbb0a20-40b7-4767-bf30-d8088fe88f17",
  ckd_peds_3_5_prot_low:  "35631421-2c97-485a-a875-0329e03c234b",
  ckd_peds_3_5_prot_high: "29812ee8-b3bb-4b8a-bda1-edba94111a31",
  ckd_peds_3_5_note1:     "5e5ef9aa-2461-422e-97c3-cb4aa6cfc852",
  ckd_peds_3_5_note2:     "6276a68f-62bd-4d0c-b426-098b9f7fd91e",
  ckd_peds_3_5_note3:     "3070aac7-fb9a-4e07-86fa-b4698f370d70",

  // ─── Pediatric CKD Stage 5D ─────────────────────────────────────────────
  ckd_peds_5d: "c3a78cf1-f0de-4170-93d3-938822600a1a",
  ckd_peds_hd: "c1ee2df2-12d3-4bf7-82dc-366924a42a66",
  ckd_peds_pd: "76dbd945-f501-48c0-be91-df3d878f66ef",

  ckd_peds_hd_kcal_low:  "2f6f4b23-aeac-475c-b80b-851c5099e5be",
  ckd_peds_hd_kcal_high: "572da029-15b7-4297-a26c-47220c693081",
  ckd_peds_hd_prot_low:  "a5878e20-93b1-4f0a-a3ea-bcb16358dd94",
  ckd_peds_hd_prot_high: "4b34236a-c898-4a54-8806-619e3cbc0b84",
  ckd_peds_hd_note1:     "1846ecd7-f65a-4375-a313-ffb92e9cc6cd",
  ckd_peds_hd_note2:     "70501dd0-5366-40d5-9293-a9c57c53a4cf",

  ckd_peds_pd_kcal_low:  "1b30d80d-cba8-4b90-ad86-2c15abfaa4a5",
  ckd_peds_pd_kcal_high: "8168fa9f-8fc5-465f-870b-51f368a5ec78",
  ckd_peds_pd_prot_low:  "697a0899-4648-45cf-9fde-d371e52ad533",
  ckd_peds_pd_prot_high: "f96b48df-9c11-43a6-b4b1-62e8d8240e0b",
  ckd_peds_pd_note1:     "ab6ff7fb-96e4-4174-946e-dfbee80eec46",
  ckd_peds_pd_note2:     "09f534cf-d208-4d0e-bc58-a7dd6206f301",

  // ─── Pediatric Kidney Transplant ────────────────────────────────────────
  kidney_transplant_peds:        "d03304cc-827e-4b3a-b64e-1dfd197549bb",
  kidney_transplant_peds_acute:  "950c862b-b059-40aa-8c41-f44e04a47cea",
  kidney_transplant_peds_chron:  "66a05667-8379-420b-9d51-6234df4a0269",

  kidney_transplant_peds_acute_kcal_low:  "b381af92-eb08-45e0-95e6-65cc404c7744",
  kidney_transplant_peds_acute_kcal_high: "d683869e-10e5-4e29-b68a-441be9d324dc",
  kidney_transplant_peds_acute_prot_low:  "48bce0a6-3695-41d5-a45b-15b9261c7527",
  kidney_transplant_peds_acute_prot_high: "909a8533-21c2-4b16-ad65-36f77bed2423",
  kidney_transplant_peds_acute_note1:     "e7298919-465e-403a-a902-0d7c18dc827e",

  kidney_transplant_peds_chron_kcal_low:  "50e80e0c-5d1e-492a-9d8a-21f031f65670",
  kidney_transplant_peds_chron_kcal_high: "d1a7c02d-a27e-4af7-becc-a475fd45a645",
  kidney_transplant_peds_chron_prot_low:  "3805ade1-34be-4351-9b0f-522200c3bcb9",
  kidney_transplant_peds_chron_prot_high: "68ac4949-f03a-45ee-8a97-41937d256f2b",
  kidney_transplant_peds_chron_note1:     "5a80f5df-b03e-4aaf-a0f1-4ee571d91191",

  // ─── Pediatric Cirrhosis ────────────────────────────────────────────────
  cirrhosis_peds:        "86d269fc-231f-4088-8725-2916f70e1718",
  cirrhosis_peds_std:    "6dfbeaa6-11cb-4b04-bf6a-17f934b9a5e2",

  cirrhosis_peds_kcal_low:  "26e77c65-cf72-410f-89a6-09b960d2e82a",
  cirrhosis_peds_kcal_high: "f980828e-903b-4a6d-a49e-4c51c9919376",
  cirrhosis_peds_prot_low:  "8d1abd8d-bdf9-4a0f-b663-bbf3ac345a00",
  cirrhosis_peds_prot_high: "b9cce6d0-6cb3-4b26-b3e7-daae13a95bc2",
  cirrhosis_peds_note1:     "cda1f53c-0fa0-47a4-b185-5c5b85773a4a",
  cirrhosis_peds_note2:     "05b0fae3-5741-4d3b-883f-45e3a5a50222",
  cirrhosis_peds_note3:     "4116e4da-06d4-40f9-ab77-ca0344c9ff97",

  // ─── Pediatric Liver Transplant ─────────────────────────────────────────
  liver_transplant_peds:        "6ce006ae-1019-42b6-93f0-ce62f98c50a1",
  liver_transplant_peds_acute:  "2038c018-d24d-4f6f-83a6-abce5c0577c3",
  liver_transplant_peds_chron:  "e6a0b7bf-60a8-4923-a2a7-3414bbb5e393",

  liver_transplant_peds_acute_kcal_low:  "82ca6df3-2275-47bf-8f87-cf11f5f6ca47",
  liver_transplant_peds_acute_kcal_high: "1724d2c2-7653-4b30-bdae-463fe0c2f965",
  liver_transplant_peds_acute_prot_low:  "43c4a944-9358-48ec-815c-a9b6edcc4ad6",
  liver_transplant_peds_acute_prot_high: "b0780c14-a0af-42ee-a4de-30d70ddf25b5",
  liver_transplant_peds_acute_note1:     "a4ae36ed-212b-4304-b7af-414f9df89d72",
  liver_transplant_peds_acute_note2:     "4f54e4d7-7482-45fa-ba64-7f15554209a0",

  liver_transplant_peds_chron_kcal_low:  "4dd4d90e-ffba-41d5-90ab-7799684911d9",
  liver_transplant_peds_chron_kcal_high: "1e6d91df-947d-41ec-a3a2-24aa861eec06",
  liver_transplant_peds_chron_prot_low:  "2e0e5352-3d0b-4c2b-9c4d-784a22cc01a7",
  liver_transplant_peds_chron_prot_high: "f4afba0e-bd73-4648-a31f-6d88d1524341",
  liver_transplant_peds_chron_note1:     "84966a70-6a58-4344-bff6-956050fddbe7",

  // ─── Pediatric Trauma ───────────────────────────────────────────────────
  trauma_peds:      "cbc51ef8-e782-40e0-a4ea-edb5da177fef",
  trauma_peds_std:  "d93cb3e9-455e-4a48-8c49-cffd692e9a6c",
  trauma_peds_open: "41bca267-5b08-4064-a913-476262c5c22e",

  trauma_peds_std_kcal_low:  "6bb3d53e-1455-4274-985f-1d66543aab57",
  trauma_peds_std_kcal_high: "65788740-d012-4b2a-9c89-707afd10564a",
  trauma_peds_std_prot_low:  "30b7eafc-96e0-4df0-a7ed-4e98ad5c46f6",
  trauma_peds_std_prot_high: "df6c347b-f698-42a0-9a80-b54be6e0e7ef",
  trauma_peds_std_note1:     "c5403f7c-1ff1-496a-84c8-775d61492d93",

  trauma_peds_open_kcal_low:  "71cacb12-bcac-4a4d-9f51-9e6beb8d012c",
  trauma_peds_open_kcal_high: "c0f4cfea-904b-4bc1-a589-f0053696223f",
  trauma_peds_open_prot_low:  "c5ec31f3-feef-4986-a195-ee6a0d78b1c9",
  trauma_peds_open_prot_high: "69912894-98c8-4b90-9516-2747fe5c8dd3",
  trauma_peds_open_note1:     "2b4a915b-f44e-4d2d-b33e-a13d41c7e4c4",

  // ─── Pediatric MASLD / MASH ─────────────────────────────────────────────
  masld_mash_peds:     "3303b5ce-6b8d-4642-8872-6732339926a0",
  masld_mash_peds_std: "beb9da51-efa8-4abb-a174-4ab38ea250c6",

  masld_mash_peds_kcal_low:  "62618e0b-686c-493e-a6d6-d97bb6ce491c",
  masld_mash_peds_kcal_high: "55621165-ba64-45b0-9f55-a711c825e19b",
  masld_mash_peds_prot_low:  "49f01a23-2225-4d70-a877-75e057c29658",
  masld_mash_peds_prot_high: "9eb85490-1678-4467-9d9a-27e18848005e",
  masld_mash_peds_note1:     "9132d7cc-d98f-4e79-acb9-f690d2fccee5",
  masld_mash_peds_note2:     "64a5bfca-28de-4a4a-b27b-35aa173e9789",

  // ─── Pediatric COPD ─────────────────────────────────────────────────────
  copd_peds:     "57d7acc5-20d4-4621-9667-fee4c83852d8",
  copd_peds_std: "0fba0d78-f9ca-43bc-8c0a-983e85aa6c86",

  copd_peds_kcal_low:  "9526f201-df58-4c54-aaf3-e79bc4309369",
  copd_peds_kcal_high: "169cf883-67b8-4258-b185-bee464e694b7",
  copd_peds_prot_low:  "2e868038-6339-4456-bfb9-58141e7b5ea7",
  copd_peds_prot_high: "a4aab3f5-2cf2-483e-8144-21bf4b9d921b",
  copd_peds_note1:     "56eed5a6-1c1f-419a-84a5-2a07e005aff2",
  copd_peds_note2:     "c9802973-f823-4cf0-a3b7-f7e4cf4641bf",

  // ─── Pediatric Heart Failure ────────────────────────────────────────────
  heart_failure_peds:     "31490243-c9fc-4d30-850b-490dfe76b352",
  heart_failure_peds_std: "526ddb38-f2cb-40c9-a96b-6820cea7e801",

  heart_failure_peds_kcal_low:  "bc8fe19c-ad98-4756-ab62-04fb1e7dc501",
  heart_failure_peds_kcal_high: "3a2ff6e1-b68a-4835-b75c-73a9665eeb8d",
  heart_failure_peds_prot_low:  "186426e4-a710-4eba-900a-1a96cfc51454",
  heart_failure_peds_prot_high: "8774f102-80ef-4c2f-a533-9959f22a6426",
  heart_failure_peds_note1:     "cbdd4f95-dfee-4603-a4fd-de7a3898f57b",
  heart_failure_peds_note2:     "9d4bfe66-d30a-484d-9a57-1e760ebb7ae4",

  // ─── Pediatric Stroke ───────────────────────────────────────────────────
  stroke_peds:     "a4b71009-0772-4a78-b6d5-87c225913b28",
  stroke_peds_std: "54316d83-9afd-484b-a71d-184ca16faecf",

  stroke_peds_kcal_low:  "4d28060f-162a-4f36-b51b-6bbb1bbb451f",
  stroke_peds_kcal_high: "05da586b-bf90-4d7d-878e-72feb82ad706",
  stroke_peds_prot_low:  "e7a5aa03-56bc-4d2d-acec-1dd5c915e460",
  stroke_peds_prot_high: "58c00db7-5159-46f1-a85b-2dd54a554dad",
  stroke_peds_note1:     "824cb0d0-7854-432f-b37b-5179891ebefb",
  stroke_peds_note2:     "bb60e669-1244-4c4e-a808-299234a86413",

  // ─── Pediatric Pressure Injuries ────────────────────────────────────────
  pi_peds:          "c2fb8d88-7568-4d25-bb0a-573650a41e07",
  pi_peds_stage1_2: "119cf3de-c34e-498b-8995-a673b142378d",
  pi_peds_stage3_4: "c9ab5420-3a58-49ef-a45c-8609e914956f",

  pi_peds_stage1_2_kcal_low:  "cb955f13-7286-4201-b4c6-d9623f32fb35",
  pi_peds_stage1_2_kcal_high: "e3757e6d-daa0-406f-94f8-59e4c7460789",
  pi_peds_stage1_2_prot_low:  "c378bc43-5f05-4156-a34b-2d04075e1fb4",
  pi_peds_stage1_2_prot_high: "0c5e2072-0464-4340-858b-aebcefb23bc2",
  pi_peds_stage1_2_note1:     "067561b6-62a8-45fb-a27e-cc61096c8a8e",
  pi_peds_stage1_2_note2:     "368402dc-6602-4564-95b9-a7911a124251",

  pi_peds_stage3_4_kcal_low:  "c7306fcd-07bf-48b4-affd-b31f92426440",
  pi_peds_stage3_4_kcal_high: "f39d89e5-8942-4bd3-9e02-74a341654253",
  pi_peds_stage3_4_prot_low:  "5561a6eb-a6f5-43f1-ac4d-c29c6c7a15d0",
  pi_peds_stage3_4_prot_high: "2e4e2999-bde8-48ad-a49a-cd9d8b0f9f24",
  pi_peds_stage3_4_note1:     "fa1c39dc-90a1-423c-822b-d98785670000",
  pi_peds_stage3_4_note2:     "c957e757-c470-4fa6-8c5a-f7b582555cda",

  // ─── Pediatric Sickle Cell Disease ──────────────────────────────────────
  scd_peds:        "5e3624da-8ba6-492f-bb3e-c564b6e10078",
  scd_peds_stable: "cbe20c80-ef2d-4067-b118-f84731cbbeae",
  scd_peds_voc:    "96af551c-63d5-4b3b-a48c-243d76095914",

  scd_peds_stable_kcal:     "425d4225-f13e-4f9d-8664-05fd534081de",
  scd_peds_stable_prot_low:  "1d4059bd-fd42-45d4-a26f-db7a8ba0b15a",
  scd_peds_stable_prot_high: "86905836-02ca-4777-9823-ef562ec19e3f",
  scd_peds_stable_note1:     "827ea02e-3d01-4a21-8d0d-6afad765b0e7",
  scd_peds_stable_note2:     "a01445ee-4743-4433-a2b3-2fd497d40ad0",

  scd_peds_voc_kcal_low:  "8870cb63-8ef3-447e-92e6-209ce6986d99",
  scd_peds_voc_kcal_high: "b2367bc2-9496-4d3f-a106-e473b92484c6",
  scd_peds_voc_prot_low:  "027ab33f-7232-4a95-b095-0ca89b5b44bb",
  scd_peds_voc_prot_high: "8316dffc-d9b6-41b7-8bf4-3ef56fe693eb",
  scd_peds_voc_note1:     "226fa22e-1c1e-442f-bed6-1b62dcbfee6e",

  // ─── Pediatric HSCT ─────────────────────────────────────────────────────
  hsct_peds:       "3d45ec45-65ca-44a1-9cde-22ab66419b7c",
  hsct_peds_infant:"1331f96a-abd6-4617-a7a4-556a12cc0e3a",
  hsct_peds_child: "bf9b5db8-7a45-477d-ab1e-d2ef47a040ac",
  hsct_peds_older: "29bcc7e2-6e53-4132-b1a8-e6a36aebd1f3",

  hsct_peds_infant_kcal_low:  "8f18e4a4-7ae0-439d-ac80-e8c3dfa7f156",
  hsct_peds_infant_kcal_high: "72b22e46-fbde-4dc3-982c-bbe7a00efb6d",
  hsct_peds_infant_prot_low:  "8a42db4c-83ff-4917-8f26-9af41a16d8cc",
  hsct_peds_infant_prot_high: "eee0b0d6-989b-405d-8498-525ed159b5be",
  hsct_peds_infant_note1:     "414cf6b3-2e3c-40c3-adab-7d04a5a8a8c9",
  hsct_peds_infant_note2:     "6e79cde4-434a-4ece-b01a-50684ca6c3de",

  hsct_peds_child_kcal_low:  "0ac7af2d-2450-4db6-86a1-27d598acf371",
  hsct_peds_child_kcal_high: "6eeb2e55-c0c1-439f-9416-0e704661b1c4",
  hsct_peds_child_prot_low:  "d8131f3e-d4bb-416b-836f-814d32197934",
  hsct_peds_child_prot_high: "7c8e48dc-6226-426d-a296-153c48a1cbc6",
  hsct_peds_child_note1:     "546f8903-6df3-407a-90a8-d8f574aee5db",
  hsct_peds_child_note2:     "c362bbd3-c99b-4b4c-8922-2763e4bd9468",

  hsct_peds_older_kcal_low:  "3fe7cf79-a694-45ee-b84f-27123c655658",
  hsct_peds_older_kcal_high: "c493eb83-156a-491f-b6dd-66e4dc3d9006",
  hsct_peds_older_prot_low:  "14ef97c7-17fd-45d5-8d24-f8769964d31f",
  hsct_peds_older_prot_high: "b2bf84dd-bbc2-4167-a204-7dc99b572fd5",
  hsct_peds_older_note1:     "8fe0722a-79fa-44b9-a9c4-a49a0ba2dfca",
  hsct_peds_older_note2:     "81ff5864-f65e-446f-8c9c-a01a7203107f",

  // ─── Pediatric Short Bowel Syndrome ─────────────────────────────────────
  sbs_peds:        "36ee40d0-89f6-4c2e-b4cc-af732c58f31e",
  sbs_peds_pndep:  "4472e312-4215-4d37-95bf-b33633f77c2c",
  sbs_peds_entaut: "9097be1e-a214-489b-9280-384a8ade5a44",

  sbs_peds_pndep_kcal_low:  "82d93e71-8c42-49a9-9d4d-61caed745070",
  sbs_peds_pndep_kcal_high: "2b4fd224-637e-48c5-8c25-0708f98ca267",
  sbs_peds_pndep_prot_low:  "b928bbe9-ae08-41e5-9b8e-c08c33fea921",
  sbs_peds_pndep_prot_high: "a5b1bcca-041a-4adb-a160-77f9126a0af7",
  sbs_peds_pndep_note1:     "12b9687b-f909-4197-9d6c-5d3a1711014e",

  sbs_peds_entaut_kcal_low:  "a342d3e6-02bd-418f-9ebe-c78c96f58b3e",
  sbs_peds_entaut_kcal_high: "98cf4094-4e1e-4f7f-bed1-199f32df3dc5",
  sbs_peds_entaut_prot_low:  "1d2d1d89-6686-4eb7-a500-44d72859286f",
  sbs_peds_entaut_prot_high: "98c83dbe-d186-4179-862a-dfa6f8b954a8",
  sbs_peds_entaut_note1:     "865af20f-e508-4197-b501-86acd57ec893",
  sbs_peds_entaut_note2:     "af262d97-6ec5-43e6-b292-ea79d683da09",
  sbs_peds_entaut_note3:     "2ffd6d18-d825-4ae3-8444-163c397d0f67",
  sbs_peds_entaut_note4:     "705ac2dd-8550-48a3-9c1a-3186599d2222",

  // ─── Pediatric Cystic Fibrosis ──────────────────────────────────────────
  cf_peds:          "f7ae56e6-d54a-4bea-92c5-a7a95f6b0a8b",
  cf_peds_bedbound: "2d24fadd-2a78-4f0a-a6f9-73eefa369949",
  cf_peds_sedentary:"21fc4ddd-7dea-4bd6-b4c9-cc5d722a2cc8",
  cf_peds_active:   "6af04445-4fa7-409e-a0d1-11fd60d281a1",

  cf_peds_bb_kcal_low:  "76385e58-18f0-465f-8b20-957c89927460",
  cf_peds_bb_kcal_high: "f13c0a8c-1ab2-4f8a-b86c-52f7551a4b78",
  cf_peds_bb_prot_low:  "fb89e947-296f-4259-a809-6b5f2f29078c",
  cf_peds_bb_prot_high: "be55d2e9-f858-4f43-9979-b46d052ef90f",

  cf_peds_sed_kcal_low:  "ca0792c6-8951-485e-a37f-a4da7d445da5",
  cf_peds_sed_kcal_high: "0c3fdd59-4f88-4fa6-8583-84ed43d749e7",
  cf_peds_sed_prot_low:  "4d8d14fc-1a53-4cd3-95a2-11cf05662998",
  cf_peds_sed_prot_high: "8ba51bd0-0629-48f3-a07b-bf57a477dfc4",

  cf_peds_act_kcal_low:  "75fc5a96-61d5-4f1b-a170-09f8a4ba4fad",
  cf_peds_act_kcal_high: "212334a7-d9ec-44f5-b6ee-9211201bb780",
  cf_peds_act_prot_low:  "d5403cc6-53b5-488a-bc2d-92c5618949fb",
  cf_peds_act_prot_high: "688f463f-4ada-400f-9424-6ca96a848dca",
  cf_peds_note1:         "7cf4aa50-7b06-453b-af79-07e42590b595",
  cf_peds_note2:         "782c75ea-61f5-4231-a296-3d73e8705fa3",

  // ─── Pediatric Healthy / Preventive ─────────────────────────────────────
  hl_peds:           "e26de056-b39d-4a71-a2ce-8b84d076e6ed",
  hl_peds_normal:    "f0915c04-2c47-4256-ad95-f4bc51adf9ed",
  hl_peds_overweight:"95fa1de9-8dea-44ea-9284-1821c788d5cf",

  hl_peds_norm_kcal_low:  "896b6dc7-ef35-4edb-88aa-e93c8b3e389a",
  hl_peds_norm_kcal_high: "560683d4-0f95-4e3a-85eb-892ff9f89577",
  hl_peds_norm_prot_low:  "6fb4f7e4-d3ae-4758-9e31-069c5cebced7",
  hl_peds_norm_prot_high: "57db5597-94bc-4862-a896-5c04f38fc340",
  hl_peds_norm_note1:     "bb5c0da4-8ac1-4676-9954-fdd6f2dc912f",
  hl_peds_overweight_note1: "a3da2207-96f8-4d4c-a678-20abce14c0a3",

  // ─── Pediatric Severe Malnutrition ──────────────────────────────────────
  mal_peds:         "54ad18ab-00a1-4303-9aa1-f084699eab32",
  mal_peds_catchup: "7b29e6d2-8509-400f-94e3-79b22e131c04",

  mal_peds_kcal_low:  "f84a2a34-7bff-4a9d-8202-172aff6eb984",
  mal_peds_kcal_high: "f2cdd064-8804-4fe3-8a22-cdeccb03c1e0",
  mal_peds_prot_low:  "666fd3b1-170f-4ffa-9f46-2f77d5bbc8c2",
  mal_peds_prot_high: "a178fae6-0098-47bd-aa49-beec5151174b",
  mal_peds_note1:     "d1be457c-ebf7-4efa-8441-5d73fede1401",

  // ─── Pediatric Obesity ──────────────────────────────────────────────────
  obe_peds:        "9bc7f2c5-e2e0-4b0b-a8e9-2ced757e94c9",
  obe_peds_stable: "0e8441ba-9b12-434b-aa7e-5ae27fb59498",
  obe_peds_note1:  "6f04866f-20f2-4dc4-8392-d0f848560cd0",
  obe_peds_note2:  "b3cc9d57-f7eb-4724-a871-9fb57cfdeeec",

  // ─── BPD ────────────────────────────────────────────────────────────────
  bpd_root:     "3b59ffca-d2e2-4a44-abda-74fba81ffc4d",
  bpd_peds:     "044bc5c9-519c-41a0-98f3-860a7af1bc64",
  bpd_peds_std: "446f43bd-e272-4489-98af-17673e4c17a5",

  bpd_peds_kcal_low:  "b3c58e65-9352-4bd2-b1b5-88abb808faeb",
  bpd_peds_kcal_high: "1ea88091-c54d-4bde-871f-7281bf2dd6d0",
  bpd_peds_prot_low:  "d62c8e44-43e4-4efd-89fa-ac90b98ee95d",
  bpd_peds_prot_high: "d1e06a0e-6088-4263-b69d-e477daa701d6",
  bpd_peds_note1:     "012769ea-ac9a-46e5-86fa-1f0d1119f33e",
  bpd_peds_note2:     "4515b9f9-7f0f-4bcc-9cc5-58091470c19e",
  bpd_peds_note3:     "63cbdc68-ed26-4869-b5ec-cb7aba80251d",
  bpd_peds_note4:     "1e79e085-553e-4e53-bf20-14035582e150",

  // ─── Adolescent Pregnancy ───────────────────────────────────────────────
  preg_peds:    "65155b24-253c-427a-af8f-c40c05a25e1f",
  preg_peds_t1: "1e2b0c8d-4d76-43de-9c5f-b9bc3bc2aca2",
  preg_peds_t2: "d6d2e78a-f421-421b-8560-2dd52d99b2ae",
  preg_peds_t3: "eb6abd08-691f-45ac-9c08-9726678f1834",

  preg_peds_t1_kcal_low:  "0fcda228-fad4-48a6-a29d-3fdace4708a6",
  preg_peds_t1_kcal_high: "bafb3af4-2c58-460e-bc91-5e9b3f42033f",
  preg_peds_t1_prot:      "f1d4e708-503a-4676-87b3-d1f05a60f3c5",

  preg_peds_t2_kcal_low:  "1881deb8-615c-4bf5-8cfa-ab45a3615675",
  preg_peds_t2_kcal_high: "a54eae3a-5aef-464d-a2f7-30c799c4f29d",
  preg_peds_t2_prot:      "c2117951-6bbb-4d32-8cf5-2d700d29d311",

  preg_peds_t3_kcal_low:  "3b915fe0-77ae-4636-bb5d-318c07700d76",
  preg_peds_t3_kcal_high: "83bc4493-9e14-43e6-85a0-e9074aa14b73",
  preg_peds_t3_prot:      "b8fe5586-6218-4aaa-ad69-fd2e1ab46e57",
  preg_peds_note1:        "4b4482a1-0c63-4f56-a265-52c2b24b8f3a",

  // ─── Adolescent Breastfeeding ───────────────────────────────────────────
  bf_peds:       "1aca0ad1-246e-4ab0-94d2-13263903475c",
  bf_peds_early: "bb2fbf7b-daa6-4fe2-afd4-9f6ad829406c",
  bf_peds_late:  "f2a46a23-3bf3-4a3c-85a5-39559b75f472",

  bf_peds_early_kcal_low:  "d89cbd90-9e47-4026-a0de-8ac4032af63a",
  bf_peds_early_kcal_high: "b193acdb-000d-48f5-84a1-b2068fdc5a3a",
  bf_peds_early_prot_low:  "70d75885-2c72-4baa-8620-ed8a2401792a",
  bf_peds_early_prot_high: "9aae5ae4-94c8-4786-b5fe-f372afa9478c",
  bf_peds_early_note1:     "41aa9271-7476-4ae7-a862-07eaab4cd84c",

  bf_peds_late_kcal_low:  "558853e8-6e98-451b-9e16-6ce71b773633",
  bf_peds_late_kcal_high: "42f0e367-6f6f-4c72-b124-219d7fb0b4d6",
  bf_peds_late_prot_low:  "028972ca-b677-4cc5-bbb5-b273f6d7b866",
  bf_peds_late_prot_high: "70501486-6440-4bbc-a446-47798bb9cb59",
  bf_peds_late_note1:     "d4171cc0-e5a2-4ab9-b7ce-afa692f4b2f4",

  // ─── Extra Inputs ───────────────────────────────────────────────────────
  crit_ill_lt30_isMechVent:  "3d32ef74-06ac-4e48-8df0-7cc5de0cde00",
  crit_ill_lt30_tempMax:     "3d32ef74-06ac-4e48-8df0-7cc5de0cde01",
  crit_ill_lt30_ve:          "3d32ef74-06ac-4e48-8df0-7cc5de0cde02",
  crit_ill_30_50_isMechVent: "3d32ef74-06ac-4e48-8df0-7cc5de0cde03",
  crit_ill_30_50_tempMax:    "3d32ef74-06ac-4e48-8df0-7cc5de0cde04",
  crit_ill_30_50_ve:         "3d32ef74-06ac-4e48-8df0-7cc5de0cde05",
  crit_ill_gt50_isMechVent:  "3d32ef74-06ac-4e48-8df0-7cc5de0cde06",
  crit_ill_gt50_tempMax:     "3d32ef74-06ac-4e48-8df0-7cc5de0cde07",
  crit_ill_gt50_ve:          "3d32ef74-06ac-4e48-8df0-7cc5de0cde08",

  cf_bb_fev1Pct:                "cf819e81-5a0e-4c23-ac1c-bee60b77c001",
  cf_bb_isPancreaticSufficient:  "cf819e81-5a0e-4c23-ac1c-bee60b77c002",
  cf_bb_cfa:                    "cf819e81-5a0e-4c23-ac1c-bee60b77c003",
  cf_sed_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c004",
  cf_sed_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c005",
  cf_sed_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c006",
  cf_act_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c007",
  cf_act_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c008",
  cf_act_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c009",
  cf_peds_bb_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c010",
  cf_peds_bb_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c011",
  cf_peds_bb_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c012",
  cf_peds_sed_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c013",
  cf_peds_sed_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c014",
  cf_peds_sed_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c015",
  cf_peds_act_fev1Pct:               "cf819e81-5a0e-4c23-ac1c-bee60b77c016",
  cf_peds_act_isPancreaticSufficient: "cf819e81-5a0e-4c23-ac1c-bee60b77c017",
  cf_peds_act_cfa:                   "cf819e81-5a0e-4c23-ac1c-bee60b77c018",

  burns_toronto_tbsaPct:         "b80bb86c-41b4-4b91-a2b2-d16e98ab3f05",
  burns_toronto_pbd:             "b80bb86c-41b4-4b91-a2b2-d16e98ab3f06",
  burns_toronto_caloricIntake:   "b80bb86c-41b4-4b91-a2b2-d16e98ab3f07",
  burns_toronto_coreTemp:        "b80bb86c-41b4-4b91-a2b2-d16e98ab3f08",
  burns_peds_child_tbsaPct:      "b80bb86c-41b4-4b91-a2b2-d16e98ab3f09",
  burns_peds_child_pbd:          "b80bb86c-41b4-4b91-a2b2-d16e98ab3f10",
  burns_peds_child_caloricIntake:"b80bb86c-41b4-4b91-a2b2-d16e98ab3f11",
  burns_peds_child_coreTemp:     "b80bb86c-41b4-4b91-a2b2-d16e98ab3f12",
  burns_peds_adol_tbsaPct:       "b80bb86c-41b4-4b91-a2b2-d16e98ab3f13",
  burns_peds_adol_pbd:           "b80bb86c-41b4-4b91-a2b2-d16e98ab3f14",
  burns_peds_adol_caloricIntake: "b80bb86c-41b4-4b91-a2b2-d16e98ab3f15",
  burns_peds_adol_coreTemp:      "b80bb86c-41b4-4b91-a2b2-d16e98ab3f16",

  trauma_open_exudateVolumeL:      "eb75700e-abee-481a-8972-a68120ab3f01",
  trauma_peds_open_exudateVolumeL: "eb75700e-abee-481a-8972-a68120ab3f02",

  scd_stable_hgb:     "1ed8e5c2-e6e2-455d-bacc-7d1a5660f001",
  scd_voc_hgb:        "1ed8e5c2-e6e2-455d-bacc-7d1a5660f002",
  scd_peds_stable_hgb:"1ed8e5c2-e6e2-455d-bacc-7d1a5660f003",
  scd_peds_voc_hgb:   "1ed8e5c2-e6e2-455d-bacc-7d1a5660f004",

  heart_failure_pal: "18d65d08-bca2-460a-9a3e-1bfa24456f01",

  ckd_hd_urineOutputMlDay:      "ab94dc5b-4e2b-45b7-b373-df1ea3139f01",
  ckd_pd_urineOutputMlDay:      "ab94dc5b-4e2b-45b7-b373-df1ea3139f02",
  ckd_peds_hd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f03",
  ckd_peds_pd_urineOutputMlDay: "ab94dc5b-4e2b-45b7-b373-df1ea3139f04",

  pi_stage1_2_targetKcal:      "51d6a728-8618-40e2-822b-30089e8c5f01",
  pi_stage3_4_targetKcal:      "51d6a728-8618-40e2-822b-30089e8c5f02",
  pi_peds_stage1_2_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f03",
  pi_peds_stage3_4_targetKcal: "51d6a728-8618-40e2-822b-30089e8c5f04",

  aki_no_dial_urineOutputMlDay:   "ef67362f-7406-4399-9a0d-3f4d60606f01",
  aki_hd_urineOutputMlDay:        "ef67362f-7406-4399-9a0d-3f4d60606f02",
  aki_crrt_urineOutputMlDay:      "ef67362f-7406-4399-9a0d-3f4d60606f03",
  aki_peds_nodial_urineOutputMlDay:"ef67362f-7406-4399-9a0d-3f4d60606f04",
  aki_peds_dial_urineOutputMlDay:  "ef67362f-7406-4399-9a0d-3f4d60606f05",

  onc_peds_std_isUndernourished: "0f21ee1b-b88c-41ba-b18d-8e8730897f01",
  onc_peds_und_isUndernourished: "0f21ee1b-b88c-41ba-b18d-8e8730897f02",

  sbs_std_hasPreservedColon:        "8a409298-88b7-4229-8b8c-b45cedd1f001",
  sbs_std_remainingBowelShort:      "8a409298-88b7-4229-8b8c-b45cedd1f002",
  sbs_std_growthSuboptimal:         "8a409298-88b7-4229-8b8c-b45cedd1f003",
  sbs_peds_pndep_hasPreservedColon: "8a409298-88b7-4229-8b8c-b45cedd1f004",
  sbs_peds_pndep_remainingBowelShort:"8a409298-88b7-4229-8b8c-b45cedd1f005",
  sbs_peds_pndep_growthSuboptimal:  "8a409298-88b7-4229-8b8c-b45cedd1f006",
  sbs_peds_entaut_hasPreservedColon:"8a409298-88b7-4229-8b8c-b45cedd1f007",
  sbs_peds_entaut_remainingBowelShort:"8a409298-88b7-4229-8b8c-b45cedd1f008",
  sbs_peds_entaut_growthSuboptimal: "8a409298-88b7-4229-8b8c-b45cedd1f009",
} as const;

export type SeedId = keyof typeof SEED_IDS;