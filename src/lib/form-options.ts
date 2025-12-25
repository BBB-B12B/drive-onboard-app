import type { SearchableSelectOption } from "@/components/ui/searchable-select";

type AddressNode = {
  value: string;
  label: string;
  subDistricts: Array<{
    value: string;
    label: string;
  }>;
};

type ProvinceNode = {
  value: string;
  label: string;
  districts: AddressNode[];
};

const BASE_JOB_POSITIONS: SearchableSelectOption[] = [
  { value: "driver", label: "พนักงานขับรถ" },
];

const BASE_RACE_OPTIONS: SearchableSelectOption[] = [
  { value: "ไทย", label: "ไทย" },
  { value: "จีน", label: "จีน" },
  { value: "มลายู", label: "มลายู" },
  { value: "ลาว", label: "ลาว" },
  { value: "กะเหรี่ยง", label: "กะเหรี่ยง" },
];

const BASE_NATIONALITY_OPTIONS: SearchableSelectOption[] = [
  { value: "ไทย", label: "ไทย" },
  { value: "พม่า", label: "พม่า" },
  { value: "ลาว", label: "ลาว" },
  { value: "กัมพูชา", label: "กัมพูชา" },
  { value: "เวียดนาม", label: "เวียดนาม" },
];

const BASE_RELIGION_OPTIONS: SearchableSelectOption[] = [
  { value: "พุทธ", label: "ศาสนาพุทธ" },
  { value: "คริสต์", label: "ศาสนาคริสต์" },
  { value: "อิสลาม", label: "ศาสนาอิสลาม" },
  { value: "ฮินดู", label: "ศาสนาฮินดู" },
  { value: "ซิกข์", label: "ศาสนาซิกข์" },
];

const THAI_PROVINCES: ProvinceNode[] = [
  {
    value: "กรุงเทพมหานคร",
    label: "กรุงเทพมหานคร",
    districts: [
      {
        value: "พระนคร",
        label: "เขตพระนคร",
        subDistricts: [
          { value: "บวรนิเวศ", label: "แขวงบวรนิเวศ" },
          { value: "วังบูรพาภิรมย์", label: "แขวงวังบูรพาภิรมย์" },
          { value: "ศาลเจ้าพ่อเสือ", label: "แขวงศาลเจ้าพ่อเสือ" },
        ],
      },
      {
        value: "ดินแดง",
        label: "เขตดินแดง",
        subDistricts: [
          { value: "ดินแดง", label: "แขวงดินแดง" },
          { value: "สามเสนใน", label: "แขวงสามเสนใน" },
          { value: "รัชดาภิเษก", label: "แขวงรัชดาภิเษก" },
        ],
      },
      {
        value: "บางนา",
        label: "เขตบางนา",
        subDistricts: [
          { value: "บางนา", label: "แขวงบางนา" },
          { value: "บางจาก", label: "แขวงบางจาก" },
          { value: "สำโรงเหนือ", label: "แขวงสำโรงเหนือ" },
        ],
      },
    ],
  },
  {
    value: "เชียงใหม่",
    label: "เชียงใหม่",
    districts: [
      {
        value: "เมืองเชียงใหม่",
        label: "อำเภอเมืองเชียงใหม่",
        subDistricts: [
          { value: "ศรีภูมิ", label: "ตำบลศรีภูมิ" },
          { value: "พระสิงห์", label: "ตำบลพระสิงห์" },
          { value: "ช้างม่อย", label: "ตำบลช้างม่อย" },
        ],
      },
      {
        value: "สันทราย",
        label: "อำเภอสันทราย",
        subDistricts: [
          { value: "สันทรายหลวง", label: "ตำบลสันทรายหลวง" },
          { value: "หนองแหย่ง", label: "ตำบลหนองแหย่ง" },
          { value: "สันนาเม็ง", label: "ตำบลสันนาเม็ง" },
        ],
      },
      {
        value: "หางดง",
        label: "อำเภอหางดง",
        subDistricts: [
          { value: "หางดง", label: "ตำบลหางดง" },
          { value: "สบแม่ข่า", label: "ตำบลสบแม่ข่า" },
          { value: "หนองควาย", label: "ตำบลหนองควาย" },
        ],
      },
    ],
  },
  {
    value: "ชลบุรี",
    label: "ชลบุรี",
    districts: [
      {
        value: "เมืองชลบุรี",
        label: "อำเภอเมืองชลบุรี",
        subDistricts: [
          { value: "บ้านโขด", label: "ตำบลบ้านโขด" },
          { value: "มะขามหย่ง", label: "ตำบลมะขามหย่ง" },
          { value: "บ้านสวน", label: "ตำบลบ้านสวน" },
        ],
      },
      {
        value: "บางละมุง",
        label: "อำเภอบางละมุง",
        subDistricts: [
          { value: "หนองปรือ", label: "ตำบลหนองปรือ" },
          { value: "นาเกลือ", label: "ตำบลนาเกลือ" },
          { value: "ห้วยใหญ่", label: "ตำบลห้วยใหญ่" },
        ],
      },
      {
        value: "ศรีราชา",
        label: "อำเภอศรีราชา",
        subDistricts: [
          { value: "ศรีราชา", label: "ตำบลศรีราชา" },
          { value: "ทุ่งสุขลา", label: "ตำบลทุ่งสุขลา" },
          { value: "สุรศักดิ์", label: "ตำบลสุรศักดิ์" },
        ],
      },
    ],
  },
  {
    value: "ขอนแก่น",
    label: "ขอนแก่น",
    districts: [
      {
        value: "เมืองขอนแก่น",
        label: "อำเภอเมืองขอนแก่น",
        subDistricts: [
          { value: "ในเมือง", label: "ตำบลในเมือง" },
          { value: "โนนท่อน", label: "ตำบลโนนท่อน" },
          { value: "สาวะถี", label: "ตำบลสาวะถี" },
        ],
      },
      {
        value: "บ้านไผ่",
        label: "อำเภอบ้านไผ่",
        subDistricts: [
          { value: "บ้านไผ่", label: "ตำบลบ้านไผ่" },
          { value: "หนองน้ำใส", label: "ตำบลหนองน้ำใส" },
          { value: "หัวหนอง", label: "ตำบลหัวหนอง" },
        ],
      },
      {
        value: "ชุมแพ",
        label: "อำเภอชุมแพ",
        subDistricts: [
          { value: "ชุมแพ", label: "ตำบลชุมแพ" },
          { value: "หนองเขียด", label: "ตำบลหนองเขียด" },
          { value: "นาสีนวล", label: "ตำบลนาสีนวล" },
        ],
      },
    ],
  },
  {
    value: "ภูเก็ต",
    label: "ภูเก็ต",
    districts: [
      {
        value: "เมืองภูเก็ต",
        label: "อำเภอเมืองภูเก็ต",
        subDistricts: [
          { value: "ตลาดใหญ่", label: "ตำบลตลาดใหญ่" },
          { value: "ตลาดเหนือ", label: "ตำบลตลาดเหนือ" },
          { value: "รัษฎา", label: "ตำบลรัษฎา" },
        ],
      },
      {
        value: "กะทู้",
        label: "อำเภอกะทู้",
        subDistricts: [
          { value: "กะทู้", label: "ตำบลกะทู้" },
          { value: "ป่าตอง", label: "ตำบลป่าตอง" },
          { value: "กมลา", label: "ตำบลกมลา" },
        ],
      },
      {
        value: "ถลาง",
        label: "อำเภอถลาง",
        subDistricts: [
          { value: "เทพกระษัตรี", label: "ตำบลเทพกระษัตรี" },
          { value: "ศรีสุนทร", label: "ตำบลศรีสุนทร" },
          { value: "ป่าคลอก", label: "ตำบลป่าคลอก" },
        ],
      },
    ],
  },
];

const OTHER_OPTION: SearchableSelectOption = {
  value: "__other__",
  label: "อื่นๆ",
};

export const jobPositionOptions = BASE_JOB_POSITIONS;

export const raceOptions = [...BASE_RACE_OPTIONS];

export const nationalityOptions = [...BASE_NATIONALITY_OPTIONS];

export const religionOptions = [...BASE_RELIGION_OPTIONS];

export const provinceOptions: SearchableSelectOption[] = [
  ...THAI_PROVINCES.map((province) => ({
    value: province.value,
    label: province.label,
  })),
];

export const otherOption = OTHER_OPTION;

export function withOtherOption(
  options: SearchableSelectOption[],
  currentValue?: string | null
): SearchableSelectOption[] {
  const enriched = [...options];
  if (currentValue && currentValue !== OTHER_OPTION.value) {
    const exists = enriched.some((option) => option.value === currentValue);
    if (!exists) {
      enriched.push({
        value: currentValue,
        label: currentValue,
      });
    }
  }
  enriched.push(OTHER_OPTION);
  return enriched;
}

export function getDistrictOptions(
  provinceValue?: string
): SearchableSelectOption[] {
  if (!provinceValue) return [];
  const province =
    THAI_PROVINCES.find((item) => item.value === provinceValue) ??
    THAI_PROVINCES.find((item) => item.label === provinceValue);
  if (!province) return [];
  return province.districts.map((district) => ({
    value: district.value,
    label: district.label,
  }));
}

export function getSubDistrictOptions(
  provinceValue?: string,
  districtValue?: string
): SearchableSelectOption[] {
  if (!provinceValue || !districtValue) return [];
  const province =
    THAI_PROVINCES.find((item) => item.value === provinceValue) ??
    THAI_PROVINCES.find((item) => item.label === provinceValue);
  if (!province) return [];
  const district =
    province.districts.find((item) => item.value === districtValue) ??
    province.districts.find((item) => item.label === districtValue);
  if (!district) return [];
  return district.subDistricts.map((subDistrict) => ({
    value: subDistrict.value,
    label: subDistrict.label,
  }));
}

