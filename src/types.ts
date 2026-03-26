export interface Project {
  id: number;
  year: string;
  site_location?: string;
}

export interface Report {
  id?: number;
  project_id: number;
  item_id: number;
  status: 'tick' | 'cross' | 'na' | null;
  comments: string;
  technician_name: string;
  date: string;
  signature: string;
  attachments?: string; // JSON string in DB, parsed as Attachment[] in UI
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface InspectionItem {
  id: number;
  title: string;
  description?: string;
  hasAttachment?: boolean;
  attachmentLabel?: string;
  hasConductTest?: boolean;
  hardText?: string;
}

export const INSPECTION_ITEMS: InspectionItem[] = [
  {
    id: 1,
    title: "Conduct 6 Monthly Safety Electrical Maintenance Inspections and Testing",
    hardText: "Refer to 6 Monthly Inspections for results",
  },
  {
    id: 2,
    title: "Conduct appliance and lead testing",
    description: "Conduct appliance and lead testing throughout Lunch Rooms, Batch Control Room, Office appliances and leads to ensure testing is current",
    hardText: "Refer to PAT results",
    hasAttachment: true,
    attachmentLabel: "Attach PAT Results",
  },
  {
    id: 3,
    title: "Conduct Earth testing",
    description: "Conduct Earth Electrode to the General Mass of Earth resistance, Main Earth conductor resistance, Structural and sub circuit earth continuity testing",
    hasConductTest: true,
  },
  {
    id: 4,
    title: "Annual Emergency Light Testing",
    description: "Perform a 6 and 12-monthly inspection by first conducting a visual check for physical damage and ensuring all diffusers are clean for maximum output. Verify that all operational \"Charge\" LEDs are illuminated and test the functionality of all test buttons and manual switches where fitted. Execute a 90-minute discharge test to ensure every unit remains operational for the full duration, noting that AS/NZS 2293.2 requires a 90-minute run-down for all units regardless of age. Any luminaire that fails to meet the 90-minute threshold must be repaired or replaced, and all results must be documented in the site’s compliance logbook.",
    hasAttachment: true,
    attachmentLabel: "Attach PDF",
  },
  {
    id: 5,
    title: "Test Power Factor Correction Capacitors",
    description: "Disconnect power for 24 hours to allow capacitors to discharge. Clean or replace filters. Check operation of fans. Blow and/or vacuum dust from cabinet. Check all connections. Restore power and perform Self Test on controller and record pass or fail result.",
    hasConductTest: true,
    hardText: "Don't test individual capacitors, and measure phase current due to Holcim policies regarding live work. Instead use the testing function on the PFC Controller",
  },
  {
    id: 6,
    title: "Electrical motor testing",
    description: "Key production and essential services motors shall be tested at regular intervals. Tests shall include for motor full load and no load amps and voltage per phase. Phase to phase and phase to earth insulation resistance at 1000V (Megger test >1M)",
    hasConductTest: true,
  },
  {
    id: 7,
    title: "Check All Motor Overload Settings",
    hasConductTest: true,
  },
  {
    id: 8,
    title: "Check all fixed electric welders",
    description: "If present on site",
  },
  {
    id: 9,
    title: "Review site single line diagram",
    hasConductTest: true,
  },
  {
    id: 10,
    title: "Arc Flash Risk Verification",
  },
];
