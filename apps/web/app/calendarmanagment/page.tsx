"use client";

import Image from "next/image";
import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import "../calendarmanagment/calendarmanagment.css";
import Sidebar from "../../components/sidebar/Sidebar";
import Header from "../../components/header/Header";
import AddEventPage from "../add-event/page";

const calendarTitleIconSrc = "/assets/calendar-icons/calendargradient.svg";
const studentExportIconSrc = "/assets/calendar-icons/download.svg";

const icons = {
  bulkUpload: "/assets/calendar-icons/upload.svg",
  export: "/assets/calendar-icons/download.svg",
  add: "/assets/calendar-icons/plus.svg",
  chevronDown: "/assets/calendar-icons/arrowdown.svg",
  chevronLeft: "/assets/calendar-icons/arrowleft.svg",
  chevronRight: "/assets/calendar-icons/arrowright.svg",
  calendar: "/assets/calendar-icons/calendar.svg",
  alarm: "/assets/calendar-icons/alarm-clock.svg",
  location: "/assets/calendar-icons/pin.svg",
  attendees: "/assets/calendar-icons/usergroup.svg",
  more: "/assets/calendar-icons/more.svg",
  download: "/assets/calendar-icons/download.svg",
  uploadFile: "/assets/calendar-icons/upload.svg",
};

type CalendarView = "month" | "week" | "day";
type EventStatus = "Published" | "Saved" | "Scheduled" | "Paused" | "Closed";

type CalendarLogin = {
  loggedIn?: boolean;
  role?: string;
  displayRole?: string;
  tenantType?: string;
  displayTenant?: string;
};

type CalendarEvent = {
  id: number;
  backendId?: string;
  title: string;
  date: string;
  day: number;
  month: number;
  year: number;
  start: string;
  end: string;
  location: string;
  attendees: number;
  status: EventStatus;
  color: string;
  tenant?: string;
  role?: string;
  department?: string;
  audience?: string;
  eventTitle?: string;
  eventSubtitle?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  priority?: string;
  description?: string;
  attachment?: string;
  scheduledPublishAt?: string;
  reminderSentAt?: string;
  createdBy?: string;
  localOwner?: string;
};

/* ========================================
   BACKEND EVENT TYPES / MAPPING
   Backend-only addition. Existing UI and
   calendar logic remain unchanged.
======================================== */

type BackendEventStatus =
  | "SAVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PAUSED"
  | "CLOSED";

type BackendEvent = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  priority?: string | null;
  attachment?: string | null;
  status: BackendEventStatus;
  scheduledPublishAt?: string | null;
  createdBy?: string | null;
  audiences?: Array<{
    id: string;
    audienceId: string;
    audienceType?: string | null;
  }>;
};

function backendEventNumericId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function backendStatusToCalendarStatus(
  status: BackendEventStatus
): EventStatus {
  const statusMap: Record<BackendEventStatus, EventStatus> = {
    SAVED: "Saved",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    PAUSED: "Paused",
    CLOSED: "Closed",
  };

  return statusMap[status];
}


function eventCreatorLabel(createdBy?: string) {
  const normalized = (createdBy || "")
    .replace(/^calendar-/i, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .toUpperCase();

  if (normalized.startsWith("SUPER ADMIN")) return "Super Admin";
  if (normalized.startsWith("PLATFORM ADMIN")) return "Platform Admin";
  if (
    normalized.startsWith("TENANT ADMIN") ||
    normalized.startsWith("INSTITUTE ADMIN")
  ) {
    return "Institute Admin";
  }
  if (normalized.startsWith("COORDINATOR")) return "Coordinator";
  if (normalized.startsWith("FACULTY")) return "Faculty";
  if (
    normalized.startsWith("LEARNER") ||
    normalized.startsWith("STUDENT")
  ) {
    return "Student";
  }

  return (createdBy || "").trim();
}

function backendEventToCalendarEvent(
  event: BackendEvent
): CalendarEvent {
  const startDateTime = new Date(event.startDate);
  const endDateTime = new Date(event.endDate);

  const formatDateValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return {
    id: backendEventNumericId(event.id),
    backendId: event.id,
    title: event.title,
    eventTitle: event.title,
    eventSubtitle: event.subtitle || "",
    subtitle: event.subtitle || "",
    date: startDateTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    day: startDateTime.getDate(),
    month: startDateTime.getMonth(),
    year: startDateTime.getFullYear(),
    start: event.startTime || formatTime(startDateTime),
    end: event.endTime || formatTime(endDateTime),
    startDate: formatDateValue(startDateTime),
    endDate: formatDateValue(endDateTime),
    startTime: event.startTime || formatTime(startDateTime),
    endTime: event.endTime || formatTime(endDateTime),
    location: event.location || "TBA",
    attendees: 0,
    status: backendStatusToCalendarStatus(event.status),
    color: "#2D55D7",
    tenant:
      event.audiences
        ?.filter((item) => item.audienceType === "TARGET")
        .map((item) => item.audienceId.split("::")[0])
        .filter(Boolean)
        .join(", ") ||
      event.audiences?.find((item) => item.audienceType === "TENANT")?.audienceId,
    role:
      event.audiences
        ?.filter((item) => item.audienceType === "TARGET")
        .map((item) => item.audienceId.split("::")[1])
        .filter(Boolean)
        .join(", ") ||
      event.audiences?.find((item) => item.audienceType === "ROLE")?.audienceId,
    audience:
      event.audiences?.map((item) => item.audienceId).join(", ") || undefined,
    priority: event.priority || undefined,
    attachment: event.attachment || undefined,
    scheduledPublishAt: event.scheduledPublishAt || undefined,
    description: event.description || "",
    createdBy: event.createdBy || undefined,
  };
}

function parseStoredAttachment(value?: string) {
  const raw = (value || "").trim();

  if (!raw) {
    return {
      originalName: "",
      storedName: "",
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      originalName?: string;
      storedName?: string;
    };

    if (parsed?.storedName) {
      return {
        originalName: parsed.originalName || parsed.storedName,
        storedName: parsed.storedName,
      };
    }
  } catch {
    // Backward-compatible old filename-only attachment.
  }

  return {
    originalName: raw,
    storedName: "",
  };
}

async function downloadEventAttachment(attachment?: string) {
  const parsed = parseStoredAttachment(attachment);

  if (!parsed.storedName) {
    alert(
      "This is an older filename-only attachment. The actual file was not uploaded to the backend."
    );
    return;
  }

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("calendar_access_token") || ""
      : "";

  if (!token) {
    alert("Backend login token is missing. Please sign in again.");
    return;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const response = await fetch(
    `${apiUrl}/events/attachments/${encodeURIComponent(parsed.storedName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    alert("Unable to download the attachment file.");
    return;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = parsed.originalName || "attachment";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Keep the Blob URL alive briefly so the browser can finish placing the
  // file in its Downloads list. We do not navigate to or open the file.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

const initialEvents: CalendarEvent[] = [];

const tenants = ["All Tenants", "University & College", "Skill Academy", "Bootcamp", "Corporate", "Government", "NGO"];
const roles = ["All Roles", "Platform Admin", "Institute Admin", "Coordinator", "Faculty", "Student"];
const statuses = ["All Status", "Published", "Saved", "Scheduled", "Paused", "Closed"];

type DepartmentDivision = {
  label: string;
  departments: string[];
};

const tenantFilterData: Record<
  string,
  {
    roles: string[];
    statuses: string[];
    departmentDivisions: DepartmentDivision[];
  }
> = {
  "All Tenants": {
    roles: [
      "Platform Admin",
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [],
  },

  "University & College": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "BE / B.Tech",
        departments: [
          "Computer Science & Engineering",
          "Information Science & Engineering",
          "Information Technology",
          "Artificial Intelligence & Machine Learning",
          "Artificial Intelligence & Data Science",
          "Data Science",
          "Cybersecurity",
          "Electronics & Communication Engineering",
          "Electrical & Electronics Engineering",
          "Electronics & Instrumentation Engineering",
          "Telecommunication Engineering",
          "Mechanical Engineering",
          "Mechatronics Engineering",
          "Automobile Engineering",
          "Civil Engineering",
          "Construction Technology",
          "Chemical Engineering",
          "Industrial Engineering",
          "Production Engineering",
          "Aerospace Engineering",
          "Aeronautical Engineering",
          "Biomedical Engineering",
          "Biotechnology",
        ],
      },
      {
        label: "BCA / MCA & Computer Applications",
        departments: [
          "Computer Applications",
          "Software Applications",
          "Web Technologies",
          "Mobile Application Development",
          "Cloud Applications",
          "Database Systems",
          "Data Analytics",
        ],
      },
      {
        label: "BBA / MBA & Management",
        departments: [
          "Business Administration",
          "Management Studies",
          "Human Resource Management",
          "Marketing Management",
          "Finance Management",
          "Operations Management",
          "International Business",
          "Business Analytics",
          "Entrepreneurship",
        ],
      },
      {
        label: "B.Com / Commerce & Finance",
        departments: [
          "Commerce",
          "Accounting & Finance",
          "Banking & Insurance",
          "Taxation",
          "Economics",
          "Financial Markets",
        ],
      },
      {
        label: "BA / Humanities & Social Sciences",
        departments: [
          "English",
          "Languages",
          "History",
          "Political Science",
          "Sociology",
          "Psychology",
          "Social Work",
          "Journalism & Mass Communication",
          "Humanities & Social Sciences",
        ],
      },
      {
        label: "B.Sc / M.Sc & Sciences",
        departments: [
          "Mathematics",
          "Statistics",
          "Physics",
          "Chemistry",
          "Biological Sciences",
          "Life Sciences",
          "Microbiology",
          "Biochemistry",
          "Environmental Science",
          "Geology",
          "Geography",
        ],
      },
      {
        label: "Architecture, Planning & Design",
        departments: [
          "Architecture",
          "Planning",
          "Design",
          "Interior Design",
          "Product Design",
        ],
      },
      {
        label: "Law",
        departments: [
          "Law",
          "Corporate Law",
          "Constitutional Law",
          "Criminal Law",
          "International Law",
        ],
      },
      {
        label: "Education",
        departments: [
          "Education",
          "Teacher Education",
          "Special Education",
          "Educational Technology",
        ],
      },
      {
        label: "Agriculture & Allied Sciences",
        departments: [
          "Agriculture",
          "Horticulture",
          "Forestry",
          "Food Technology",
          "Agricultural Engineering",
        ],
      },
      {
        label: "Health & Medical Sciences",
        departments: [
          "Medicine",
          "Dentistry",
          "Pharmacy",
          "Nursing",
          "Physiotherapy",
          "Allied Health Sciences",
          "Public Health",
        ],
      },
      {
        label: "University Administration & Support",
        departments: [
          "Research & Development",
          "Examination Department",
          "Admissions",
          "Academic Affairs",
          "Student Affairs",
          "Placement & Career Services",
          "Training & Development",
          "Library & Learning Resources",
          "Sports & Physical Education",
          "International Relations",
          "Alumni Relations",
          "Innovation & Incubation",
          "Quality Assurance / IQAC",
        ],
      },
    ],
  },

  "Skill Academy": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "Software & Application Development",
        departments: [
          "Software Development",
          "Full Stack Development",
          "Frontend Development",
          "Backend Development",
          "Mobile App Development",
          "Web Development",
        ],
      },
      {
        label: "Data, AI & Analytics",
        departments: [
          "Data Science",
          "Artificial Intelligence & Machine Learning",
          "Generative AI",
          "Data Analytics",
          "Business Analytics",
        ],
      },
      {
        label: "Cloud, DevOps & Infrastructure",
        departments: [
          "Cloud Computing",
          "DevOps",
          "Networking",
          "Database Administration",
        ],
      },
      {
        label: "Cybersecurity & Testing",
        departments: [
          "Cybersecurity",
          "Quality Assurance & Testing",
          "Automation Testing",
        ],
      },
      {
        label: "Design & Creative",
        departments: [
          "UI/UX Design",
          "Graphic Design",
          "Product Design",
        ],
      },
      {
        label: "Business & Management",
        departments: [
          "Business & Management",
          "Project Management",
          "Product Management",
          "Human Resources",
          "Entrepreneurship",
        ],
      },
      {
        label: "Marketing, Sales & Customer Skills",
        departments: [
          "Digital Marketing",
          "Content Marketing",
          "Social Media Marketing",
          "Sales",
          "Customer Service",
        ],
      },
      {
        label: "Finance & BFSI",
        departments: [
          "Finance & Accounting",
          "Banking & Financial Services",
        ],
      },
      {
        label: "Communication & Professional Skills",
        departments: [
          "Communication Skills",
          "Soft Skills",
          "Leadership & Management",
          "Aptitude & Reasoning",
          "English & Language Skills",
        ],
      },
      {
        label: "Industry & Vocational Skills",
        departments: [
          "Healthcare Skills",
          "Retail Skills",
          "Hospitality Skills",
          "Logistics & Supply Chain",
          "Manufacturing Skills",
          "Electrical Skills",
          "Electronics Skills",
          "Automotive Skills",
          "Construction Skills",
          "Vocational Training",
        ],
      },
      {
        label: "Certification, Career & Learner Support",
        departments: [
          "Certification Programs",
          "Corporate Training",
          "Trainer Development",
          "Learner Support",
          "Assessment & Certification",
          "Career Readiness",
          "Placement Training",
        ],
      },
    ],
  },

  "Bootcamp": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "Full Stack Engineering",
        departments: [
          "Full Stack Development",
          "MERN Stack Development",
          "MEAN Stack Development",
          "Java Full Stack",
          ".NET Full Stack",
          "Python Full Stack",
        ],
      },
      {
        label: "Frontend Engineering",
        departments: [
          "Frontend Development",
          "React Development",
          "Angular Development",
          "Vue Development",
        ],
      },
      {
        label: "Backend Engineering",
        departments: [
          "Backend Development",
          "Node.js Development",
          "Java Development",
          "Python Development",
          "Database & SQL",
        ],
      },
      {
        label: "Mobile Development",
        departments: [
          "Mobile App Development",
          "Android Development",
          "iOS Development",
          "Flutter Development",
        ],
      },
      {
        label: "Data & Artificial Intelligence",
        departments: [
          "Data Science",
          "Data Analytics",
          "Artificial Intelligence & Machine Learning",
          "Generative AI",
          "Deep Learning",
        ],
      },
      {
        label: "Cloud & DevOps",
        departments: [
          "Cloud Computing",
          "AWS",
          "Microsoft Azure",
          "Google Cloud",
          "DevOps",
          "Site Reliability Engineering",
        ],
      },
      {
        label: "Cybersecurity & Emerging Technology",
        departments: [
          "Cybersecurity",
          "Ethical Hacking",
          "Network Security",
          "Blockchain",
          "Web3",
        ],
      },
      {
        label: "Quality Engineering",
        departments: [
          "Quality Assurance & Testing",
          "Automation Testing",
        ],
      },
      {
        label: "Product & Design",
        departments: [
          "UI/UX Design",
          "Product Management",
          "Business Analysis",
          "Digital Marketing",
        ],
      },
      {
        label: "Coding & Interview Preparation",
        departments: [
          "Technical Interview Preparation",
          "Data Structures & Algorithms",
          "Competitive Programming",
          "Coding Challenges",
        ],
      },
      {
        label: "Projects, Mentoring & Career",
        departments: [
          "Projects & Capstone",
          "Career & Placement",
          "Mentoring & Learner Support",
        ],
      },
    ],
  },

  "Corporate": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "People & Human Resources",
        departments: [
          "Human Resources",
          "Talent Acquisition",
          "Learning & Development",
          "Employee Engagement",
          "Administration",
        ],
      },
      {
        label: "Technology & Engineering",
        departments: [
          "Information Technology",
          "IT Support",
          "Information Security",
          "Cybersecurity",
          "Software Engineering",
          "Product Engineering",
          "Product Management",
          "Research & Development",
          "Data & Analytics",
          "Artificial Intelligence",
        ],
      },
      {
        label: "Finance, Accounts & Risk",
        departments: [
          "Finance",
          "Accounts",
          "Audit",
          "Taxation",
          "Treasury",
          "Risk Management",
        ],
      },
      {
        label: "Sales, Marketing & Growth",
        departments: [
          "Sales",
          "Marketing",
          "Digital Marketing",
          "Business Development",
        ],
      },
      {
        label: "Customer Functions",
        departments: [
          "Customer Success",
          "Customer Support",
        ],
      },
      {
        label: "Operations & Supply Chain",
        departments: [
          "Operations",
          "Business Operations",
          "Supply Chain",
          "Procurement",
          "Logistics",
          "Warehouse",
        ],
      },
      {
        label: "Manufacturing & Quality",
        departments: [
          "Manufacturing",
          "Production",
          "Quality Assurance",
          "Quality Control",
        ],
      },
      {
        label: "Legal, Compliance & Governance",
        departments: [
          "Legal",
          "Compliance",
          "Corporate Governance",
        ],
      },
      {
        label: "Strategy & Program Management",
        departments: [
          "Strategy",
          "Project Management Office",
          "Innovation",
        ],
      },
      {
        label: "Facilities, Safety & Administration",
        departments: [
          "Facilities",
          "Health & Safety",
          "Administration",
        ],
      },
      {
        label: "Communications & Social Impact",
        departments: [
          "Corporate Communications",
          "Public Relations",
          "CSR",
        ],
      },
      {
        label: "Training",
        departments: [
          "Learning & Development",
          "Training",
        ],
      },
    ],
  },

  "Government": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "Administration & Governance",
        departments: [
          "General Administration",
          "Personnel & Human Resources",
          "Policy & Governance",
          "Public Grievance",
          "Public Relations",
          "Training & Capacity Building",
        ],
      },
      {
        label: "Finance, Revenue & Audit",
        departments: [
          "Finance",
          "Accounts",
          "Treasury",
          "Audit",
          "Revenue",
          "Land Records",
        ],
      },
      {
        label: "Digital Government & Technology",
        departments: [
          "Information Technology",
          "E-Governance",
          "Cybersecurity",
          "Science & Technology",
        ],
      },
      {
        label: "Education & Skill Development",
        departments: [
          "Education",
          "Higher Education",
          "School Education",
          "Skill Development",
          "Youth Affairs & Sports",
        ],
      },
      {
        label: "Health & Social Welfare",
        departments: [
          "Health & Family Welfare",
          "Public Health",
          "Social Welfare",
          "Women & Child Development",
        ],
      },
      {
        label: "Rural & Urban Development",
        departments: [
          "Rural Development",
          "Urban Development",
          "Municipal Administration",
          "Panchayat Raj",
          "Housing",
        ],
      },
      {
        label: "Agriculture & Environment",
        departments: [
          "Agriculture",
          "Horticulture",
          "Animal Husbandry",
          "Forestry",
          "Environment",
          "Water Resources",
          "Irrigation",
        ],
      },
      {
        label: "Infrastructure & Transport",
        departments: [
          "Public Works",
          "Infrastructure",
          "Transport",
          "Roads & Highways",
        ],
      },
      {
        label: "Industry, Labour & Economy",
        departments: [
          "Industries & Commerce",
          "MSME",
          "Labour & Employment",
          "Food & Civil Supplies",
          "Tourism",
          "Culture",
        ],
      },
      {
        label: "Citizen & Public Services",
        departments: [
          "Citizen Services",
          "Public Grievance",
          "Public Relations",
        ],
      },
      {
        label: "Law, Compliance & Regulatory",
        departments: [
          "Law & Legal Affairs",
          "Regulatory & Compliance",
          "Audit",
        ],
      },
      {
        label: "Disaster & Emergency Management",
        departments: [
          "Disaster Management",
          "Emergency Services",
        ],
      },
      {
        label: "Planning, Monitoring & Evaluation",
        departments: [
          "Planning",
          "Planning & Development",
          "Monitoring & Evaluation",
        ],
      },
    ],
  },

  "NGO": {
    roles: [
      "Institute Admin",
      "Coordinator",
      "Faculty",
      "Student",
    ],
    statuses,
    departmentDivisions: [
      {
        label: "Programs & Projects",
        departments: [
          "Programs",
          "Program Management",
          "Project Management",
          "Field Operations",
        ],
      },
      {
        label: "Community & Field Engagement",
        departments: [
          "Community Outreach",
          "Community Development",
          "Beneficiary Services",
        ],
      },
      {
        label: "Volunteer Management",
        departments: [
          "Volunteer Management",
          "Volunteer Training",
        ],
      },
      {
        label: "Fundraising & Donor Engagement",
        departments: [
          "Fundraising",
          "Donor Relations",
        ],
      },
      {
        label: "Partnerships & Grants",
        departments: [
          "Grant Management",
          "Partnerships",
          "Corporate Partnerships",
        ],
      },
      {
        label: "Monitoring, Evaluation & Impact",
        departments: [
          "Monitoring & Evaluation",
          "Monitoring, Evaluation & Learning",
          "Impact Assessment",
        ],
      },
      {
        label: "Research, Advocacy & Policy",
        departments: [
          "Research",
          "Advocacy",
          "Policy",
        ],
      },
      {
        label: "Communications & Media",
        departments: [
          "Communications",
          "Media & Public Relations",
          "Digital Communications",
        ],
      },
      {
        label: "People & Administration",
        departments: [
          "Human Resources",
          "Administration",
        ],
      },
      {
        label: "Finance, Procurement & Logistics",
        departments: [
          "Finance",
          "Accounts",
          "Procurement",
          "Logistics",
        ],
      },
      {
        label: "Technology & Data",
        departments: [
          "Information Technology",
          "Data Management",
        ],
      },
      {
        label: "Legal, Compliance & Safeguarding",
        departments: [
          "Legal",
          "Compliance",
          "Safeguarding",
          "Child Protection",
          "Gender & Inclusion",
        ],
      },
      {
        label: "Education, Health & Livelihood Programs",
        departments: [
          "Education Programs",
          "Health Programs",
          "Livelihood Programs",
          "Skill Development Programs",
          "Women Empowerment",
          "Child Welfare",
          "Youth Development",
          "Disability Inclusion",
        ],
      },
      {
        label: "Environment & Community Development",
        departments: [
          "Environment & Sustainability",
          "Rural Development",
          "Urban Community Programs",
        ],
      },
      {
        label: "Humanitarian & Relief",
        departments: [
          "Disaster Relief",
          "Humanitarian Response",
          "Food & Nutrition",
          "Water, Sanitation & Hygiene",
          "Training & Capacity Building",
        ],
      },
    ],
  },
};

function Icon({ src, alt = "", size = 18 }: { src: string; alt?: string; size?: number }) {
  return <Image src={src} alt={alt} width={size} height={size} aria-hidden={alt ? undefined : true} />;
}


type FilterDropdownProps = {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

function FilterDropdown({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: FilterDropdownProps) {
  return (
    <div className={`filterDropdown ${open ? "open" : ""}`}>
      <button
        type="button"
        className="filterDropdownField"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="filterDropdownText">
          <span className="filterDropdownLabel">{label}</span>
          <span className="filterDropdownValue">{value.startsWith("All ") ? label : value}</span>
        </span>
        <span className="filterDropdownChevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="filterDropdownMenu" role="listbox" aria-label={label}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={`filterDropdownOption ${selected ? "selected" : ""}`}
                key={option}
                onClick={() => onSelect(option)}
              >
                <span className="filterRadio" aria-hidden="true">
                  <span className="filterRadioOuter" />
                  {!selected && <span className="filterRadioInner" />}
                  {selected && (
                    <span className="filterRadioCheck">
                      <span className="filterTick" />
                    </span>
                  )}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CheckboxFilterDropdownProps = {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  disabled?: boolean;
  className?: string;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

function CheckboxFilterDropdown({
  label,
  value,
  options,
  open,
  disabled = false,
  className = "",
  onToggle,
  onSelect,
}: CheckboxFilterDropdownProps) {
  return (
    <div
      className={`filterDropdown checkboxFilterDropdown ${className} ${
        open ? "open" : ""
      } ${disabled ? "disabled" : ""}`}
    >
      <button
        type="button"
        className="filterDropdownField"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={onToggle}
      >
        <span className="filterDropdownText">
          <span className="filterDropdownLabel">{label}</span>
          <span className="filterDropdownValue">
            {value || label}
          </span>
        </span>
        <span className="filterDropdownChevron" aria-hidden="true" />
      </button>

      {open && !disabled && (
        <div
          className="filterDropdownMenu departmentCheckMenu"
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => {
            const checked = value === option;

            return (
              <label
                className={`departmentCheckRow ${
                  checked ? "selected" : ""
                }`}
                key={option}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onSelect(option)}
                />
                <span className="departmentCheckText">
                  {option}
                </span>
              </label>
            );
          })}

          {!options.length && (
            <div className="departmentEmptyMessage">
              No options available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function daysForMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const previousLast = new Date(year, month, 0).getDate();
  const cells: { day: number; current: boolean; date: Date }[] = [];

  for (let i = first.getDay() - 1; i >= 0; i--) {
    const d = previousLast - i;
    cells.push({ day: d, current: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next, current: false, date: new Date(year, month + 1, next++) });
  }
  return cells;
}

function BodyPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}


function getCalendarEventDateRange(event: CalendarEvent) {
  const parseLocalDate = (value?: string) => {
    const raw = (value || "").trim();
    if (!raw) return null;

    let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  };

  const eventCellDate = new Date(event.year, event.month, event.day);

  const start =
    parseLocalDate(event.startDate) ??
    parseLocalDate(event.date) ??
    eventCellDate;

  const end =
    parseLocalDate(event.endDate) ??
    start;

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  eventCellDate.setHours(0, 0, 0, 0);

  const actualStart =
    eventCellDate.getTime() < start.getTime() ? eventCellDate : start;

  return actualStart <= end
    ? { start: actualStart, end }
    : { start: end, end: actualStart };
}

export default function CalendarManagementPage() {
  const router = useRouter();
  const [login, setLogin] = useState<CalendarLogin | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1));
  const [view, setView] = useState<CalendarView>("month");
  const [tenant, setTenant] = useState("All Tenants");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [department, setDepartment] = useState("All Departments");
  const [selectedDepartmentDivision, setSelectedDepartmentDivision] = useState("");
  const [openFilter, setOpenFilter] = useState<
    "tenant" | "division" | "department" | "role" | "status" | null
  >(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"All" | EventStatus | "My Events">("All");
  // IMPORTANT: Server and first client render must start with the same data.
  // Reading localStorage inside the useState initializer causes a hydration mismatch.
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openMenuSource, setOpenMenuSource] = useState<"calendar" | "schedule" | null>(null);
  const [mobileEventIndex, setMobileEventIndex] = useState(0);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const mobileEventTouchStartX = useRef<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState("");
  const [exportYear, setExportYear] = useState("2026");
  const [exportDropdown, setExportDropdown] = useState<"month" | "year" | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date(2026, 8, 7));
  const [weekDate, setWeekDate] = useState(new Date(2026, 8, 13));
  const [dayDate, setDayDate] = useState(new Date(2026, 8, 19));
  const [dayPopup, setDayPopup] = useState<{ day: number; event: CalendarEvent } | null>(null);
  const [dayEventList, setDayEventList] = useState<{ day: number; events: CalendarEvent[] } | null>(null);
  const [reminderEvent, setReminderEvent] = useState<CalendarEvent | null>(null);
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderSentEvent, setReminderSentEvent] = useState<CalendarEvent | null>(null);
  const [cancelEvent, setCancelEvent] = useState<CalendarEvent | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Publish Event popup state
  const [publishEvent, setPublishEvent] = useState<CalendarEvent | null>(null);
  const [publishOrganizer, setPublishOrganizer] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishAudienceSelected, setPublishAudienceSelected] = useState(false);
  const [publishAudienceOpen, setPublishAudienceOpen] = useState(false);
  const [publishAudienceType, setPublishAudienceType] = useState<
    "Default" | "Specific Tenant" | "Specific Actor"
  >("Default");
  const [publishFlyout, setPublishFlyout] = useState<"tenant" | "actor" | null>(null);
  const [publishTenant, setPublishTenant] = useState("");
  const [publishActor, setPublishActor] = useState("");
  const [publishTargets, setPublishTargets] = useState<Array<{ tenant: string; actor: string }>>([]);

  // Auto Publish popup state
  const [autoPublishEvent, setAutoPublishEvent] = useState<CalendarEvent | null>(null);
  const [autoPublishDate, setAutoPublishDate] = useState("");
  const [autoPublishCalendarOpen, setAutoPublishCalendarOpen] = useState(false);
  const [autoPublishCalendarMonth, setAutoPublishCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [autoPublishHour, setAutoPublishHour] = useState("");
  const [autoPublishMinute, setAutoPublishMinute] = useState("");
  const [autoPublishTimeOpen, setAutoPublishTimeOpen] = useState(false);
  const [autoPublishError, setAutoPublishError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedLogin = window.localStorage.getItem("calendar_dummy_login");

    if (!storedLogin) return;

    try {
      const parsedLogin = JSON.parse(storedLogin) as CalendarLogin;
      setLogin(parsedLogin);

      const tenantLabelByType: Record<string, string> = {
        UNIVERSITY: "University & College",
        UNIVERSITY_COLLEGE: "University & College",
        SKILL_ACADEMY: "Skill Academy",
        BOOTCAMP: "Bootcamp",
        CORPORATE: "Corporate",
        GOVERNMENT: "Government",
        NGO: "NGO",
      };

      const signedInTenant =
        parsedLogin.displayTenant ||
        tenantLabelByType[parsedLogin.tenantType || ""] ||
        "All Tenants";

      if (
        parsedLogin.role === "TENANT_ADMIN" ||
        parsedLogin.role === "COORDINATOR" ||
        parsedLogin.role === "FACULTY" ||
        parsedLogin.role === "LEARNER"
      ) {
        setTenant(signedInTenant);
        setDepartment("All Departments");
        setSelectedDepartmentDivision("");
      }

      if (parsedLogin.role === "LEARNER") {
        setRole("Student");
        setStatus("All Status");
        setScheduleTab("All");
        setOpenFilter(null);
        setOpenMenu(null);
      }
    } catch {
      setLogin(null);
    }
  }, []);

  const isStudentView = login?.role === "LEARNER";

  const isTenantScopedRole =
    login?.role === "TENANT_ADMIN" ||
    login?.role === "COORDINATOR" ||
    login?.role === "FACULTY";

  const canReceiveAssignedSchedules =
    login?.role === "SUPER_ADMIN" ||
    login?.role === "PLATFORM_ADMIN" ||
    login?.role === "TENANT_ADMIN" ||
    login?.role === "COORDINATOR" ||
    login?.role === "FACULTY";

  const signedInAudienceRole = (() => {
    switch (login?.role) {
      case "SUPER_ADMIN":
        return "super admin";
      case "PLATFORM_ADMIN":
        return "platform admin";
      case "TENANT_ADMIN":
        return "institute admin";
      case "COORDINATOR":
        return "coordinator";
      case "FACULTY":
        return "faculty";
      case "LEARNER":
        return "student";
      default:
        return "";
    }
  })();

  const tenantLabelByType: Record<string, string> = {
    UNIVERSITY: "University & College",
    UNIVERSITY_COLLEGE: "University & College",
    SKILL_ACADEMY: "Skill Academy",
    BOOTCAMP: "Bootcamp",
    CORPORATE: "Corporate",
    GOVERNMENT: "Government",
    NGO: "NGO",
  };

  const signedInTenant =
    login?.displayTenant ||
    tenantLabelByType[login?.tenantType || ""] ||
    "All Tenants";

  const showTenantFilter =
    login?.role === "SUPER_ADMIN" ||
    login?.role === "PLATFORM_ADMIN";

  // The filter data points come from the active tenant first, then the
  // signed-in role hierarchy is applied on top of those tenant data points.
  const activeFilterTenant =
    isTenantScopedRole || isStudentView
      ? signedInTenant
      : tenant;

  const currentTenantFilterData =
    tenantFilterData[activeFilterTenant] ||
    tenantFilterData["All Tenants"];

  const availableRoleOptions = (() => {
    const tenantRoles = currentTenantFilterData.roles;

    const allowOnly = (allowedRoles: string[]) => [
      "All Roles",
      ...tenantRoles.filter((item) => allowedRoles.includes(item)),
    ];

    switch (login?.role) {
      case "SUPER_ADMIN":
        return [
          "All Roles",
          ...tenantRoles,
        ];

      case "PLATFORM_ADMIN":
        return allowOnly([
          "Institute Admin",
          "Coordinator",
          "Faculty",
          "Student",
        ]);

      case "TENANT_ADMIN":
        return allowOnly([
          "Coordinator",
          "Faculty",
          "Student",
        ]);

      case "COORDINATOR":
        return allowOnly([
          "Faculty",
          "Student",
        ]);

      case "FACULTY":
        return allowOnly([
          "Student",
        ]);

      default:
        return roles;
    }
  })();

  const availableStatusOptions = currentTenantFilterData.statuses;
  const availableDepartmentDivisions =
    currentTenantFilterData.departmentDivisions;

  const availableDivisionOptions =
    availableDepartmentDivisions.map((division) => division.label);

  const selectedDivisionData =
    availableDepartmentDivisions.find(
      (division) => division.label === selectedDepartmentDivision
    ) || null;

  const availableDepartmentOptions =
    selectedDivisionData?.departments || [];

  // Learner/Student remains read-only. Other signed-in roles can use
  // the filter row, with Role options restricted by the hierarchy above.
  const hideCalendarFilters = isStudentView;

  const studentTenant = login?.displayTenant || "All Tenants";

  const studentCalendarTitle =
    studentTenant && studentTenant !== "All Tenants"
      ? `${studentTenant} Calendar`
      : "Calendar";

  const studentCalendarSubtitle =
    studentTenant === "Corporate"
      ? "View Your Work Schedules And Upcoming Events."
      : studentTenant === "Bootcamp"
        ? "View Your Sessions, Schedules And Upcoming Events."
        : studentTenant === "Skill Academy"
          ? "View Your Courses, Schedules And Upcoming Events."
          : "View Your Classes, Schedules And Upcoming Events.";

  const calendarPageTitle = (() => {
    if (isStudentView) return studentCalendarTitle;

    switch (login?.role) {
      case "SUPER_ADMIN":
        return "Calendar Management - All Tenants";

      case "PLATFORM_ADMIN":
        return "Platform Admin Calendar - All Tenants";

      case "TENANT_ADMIN":
        return `${signedInTenant} Calendar - Institute Admin`;

      case "COORDINATOR":
        return `${signedInTenant} Calendar - Coordinator`;

      case "FACULTY":
        return `${signedInTenant} Calendar - Faculty`;

      default:
        return signedInTenant && signedInTenant !== "All Tenants"
          ? `${signedInTenant} Calendar`
          : "Calendar Management";
    }
  })();

  const calendarPageSubtitle = (() => {
    if (isStudentView) return studentCalendarSubtitle;

    switch (login?.role) {
      case "SUPER_ADMIN":
        return "Manage Calendars, Schedules And Events Across All Tenants.";

      case "PLATFORM_ADMIN":
        return "Manage Calendars, Schedules And Events Across All Tenants.";

      case "TENANT_ADMIN":
        return `Manage Calendars, Schedules And Events For ${signedInTenant}.`;

      case "COORDINATOR":
        return `Coordinate Calendars, Schedules And Events For ${signedInTenant}.`;

      case "FACULTY":
        return `Manage Teaching Schedules, Sessions And Events For ${signedInTenant}.`;

      default:
        return signedInTenant && signedInTenant !== "All Tenants"
          ? `Manage Calendars, Schedules And Events For ${signedInTenant}.`
          : "Manage Calendars, Schedules And Events.";
    }
  })();

  const saveEvents = (nextEvents: CalendarEvent[]) => {
    window.localStorage.setItem("calendar:events", JSON.stringify(nextEvents));
    return nextEvents;
  };

  const patchBackendEvent = async (
    event: CalendarEvent,
    data: Record<string, unknown>
  ) => {
    if (!event.backendId) return null;

    const token = window.localStorage.getItem("calendar_access_token");
    if (!token) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/events/${event.backendId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to update backend event:", response.status);
      return null;
    }

    return (await response.json()) as BackendEvent;
  };

  const deleteBackendEvent = async (event: CalendarEvent) => {
    const token = window.localStorage.getItem("calendar_access_token");

    if (!token) {
      console.error("Delete failed: missing calendar_access_token");
      return false;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    try {
      let response: Response;

      if (event.backendId) {
        response = await fetch(`${apiUrl}/events/${event.backendId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        const startDate =
          event.startDate ||
          `${event.year}-${String(event.month + 1).padStart(2, "0")}-${String(
            event.day
          ).padStart(2, "0")}`;

        response = await fetch(`${apiUrl}/events/by-details`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: event.title,
            startDate,
            startTime: event.startTime || event.start,
          }),
        });
      }

      if (response.status === 404) {
        // The DB row is already gone, so the UI can safely remove it.
        return true;
      }

      if (!response.ok) {
        console.error(
          "Failed to delete backend event:",
          response.status,
          await response.text()
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete backend event:", error);
      return false;
    }
  };

  // Load persisted events only after hydration is complete.
  useEffect(() => {
    const storedEvents = window.localStorage.getItem("calendar:events");
    if (!storedEvents) return;

    try {
      const parsed = JSON.parse(storedEvents) as CalendarEvent[];
      if (Array.isArray(parsed)) {
        setEvents(parsed);
      }
    } catch {
      // Keep initialEvents if stored data is invalid.
    }
  }, []);

  /* ========================================
     LOAD EVENTS FROM BACKEND
     Backend-only addition. No UI changes.
  ======================================== */

  useEffect(() => {
    const loadBackendEvents = async () => {
      const token = window.localStorage.getItem("calendar_access_token");

      // Keep all existing local calendar behavior when no backend token exists.
      if (!token) return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const response = await fetch(`${apiUrl}/events`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error(
            "Failed to load backend calendar events:",
            response.status
          );
          return;
        }

        const backendEvents = (await response.json()) as BackendEvent[];

        if (!Array.isArray(backendEvents)) return;

        const mappedEvents = backendEvents.map(backendEventToCalendarEvent);

        /*
         * EVENT PERSISTENCE FIX
         *
         * Do NOT replace the complete frontend event list every 5 seconds.
         * The backend GET /events can be audience-scoped for the signed-in user.
         * Replacing the entire state with that response was removing a newly
         * created Institute Admin / Coordinator / Faculty event from the UI
         * whenever the polling request did not return that event.
         *
         * Instead:
         *   1. Backend events remain the source of truth when they are returned.
         *   2. Existing locally-created events that are not in the current
         *      backend response are preserved.
         *   3. Matching events are de-duplicated by backendId first and by
         *      title/date/time as a fallback.
         */
        setEvents((previousEvents) => {
          /*
           * PERMANENT EVENT PERSISTENCE
           *
           * Reused events are allowed to have the same date/time and must
           * remain as separate records. Therefore we never de-duplicate by
           * title/date/time.
           *
           * Backend events are matched ONLY by backendId. Existing frontend
           * metadata (for example reminderSentAt) is preserved when the
           * backend polling refresh returns the same event.
           */
          const previousByBackendId = new Map<string, CalendarEvent>();

          previousEvents.forEach((event) => {
            if (event.backendId) {
              previousByBackendId.set(event.backendId, event);
            }
          });

          const mergedBackendEvents = mappedEvents.map((backendEvent) => {
            if (!backendEvent.backendId) {
              return backendEvent;
            }

            const existingEvent = previousByBackendId.get(
              backendEvent.backendId
            );

            if (!existingEvent) {
              return backendEvent;
            }

            return {
              ...existingEvent,
              ...backendEvent,
              reminderSentAt:
                existingEvent.reminderSentAt ||
                backendEvent.reminderSentAt,
              localOwner: existingEvent.localOwner,
            };
          });

          const returnedBackendIds = new Set(
            mappedEvents
              .map((event) => event.backendId)
              .filter((value): value is string => Boolean(value))
          );

          const preservedExistingEvents = previousEvents.filter((event) => {
            if (event.backendId && returnedBackendIds.has(event.backendId)) {
              return false;
            }

            return true;
          });

          const nextEvents = [
            ...mergedBackendEvents,
            ...preservedExistingEvents,
          ];

          window.localStorage.setItem(
            "calendar:events",
            JSON.stringify(nextEvents)
          );

          return nextEvents;
        });
      } catch (error) {
        console.error("Failed to load backend calendar events:", error);
      }
    };

    void loadBackendEvents();

    // Recipient pages must fetch newly-published assignments from PostgreSQL,
    // not wait for a full page reload. Refresh on window focus and periodically.
    const handleFocus = () => {
      void loadBackendEvents();
    };

    window.addEventListener("focus", handleFocus);

    const refreshTimer = window.setInterval(() => {
      void loadBackendEvents();
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const getEventEndDateTime = (event: CalendarEvent) => {
    const rawDate = (event.endDate || event.startDate || event.date || "").trim();
    const rawTime = (event.endTime || event.end || "").trim();

    if (!rawDate || !rawTime) return null;

    let year = event.year;
    let month = event.month;
    let day = event.day;

    let dateMatch = rawDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      year = Number(dateMatch[1]);
      month = Number(dateMatch[2]) - 1;
      day = Number(dateMatch[3]);
    } else {
      dateMatch = rawDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dateMatch) {
        day = Number(dateMatch[1]);
        month = Number(dateMatch[2]) - 1;
        year = Number(dateMatch[3]);
      } else {
        const parsedDate = new Date(rawDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          year = parsedDate.getFullYear();
          month = parsedDate.getMonth();
          day = parsedDate.getDate();
        }
      }
    }

    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!timeMatch) return null;

    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    const endDateTime = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(endDateTime.getTime()) ? null : endDateTime;
  };

  // Published events stay in the calendar until the user explicitly
  // changes their status or deletes them. They are no longer auto-closed
  // when the event end date/time passes.

  // Convert Scheduled events to Published automatically when their
  // scheduled date/time is reached. The check also works after a reload
  // because scheduledPublishAt is persisted with calendar:events.
  useEffect(() => {
    const publishDueEvents = () => {
      const now = Date.now();

      setEvents((previousEvents) => {
        let changed = false;

        const nextEvents = previousEvents.map((event) => {
          if (
            event.status === "Scheduled" &&
            event.scheduledPublishAt &&
            new Date(event.scheduledPublishAt).getTime() <= now
          ) {
            changed = true;
            void patchBackendEvent(event, {
              status: "PUBLISHED",
              scheduledPublishAt: null,
            });
            return {
              ...event,
              status: "Published" as EventStatus,
              scheduledPublishAt: undefined,
            };
          }

          return event;
        });

        if (changed) {
          window.localStorage.setItem("calendar:events", JSON.stringify(nextEvents));
          return nextEvents;
        }

        return previousEvents;
      });
    };

    publishDueEvents();
    const intervalId = window.setInterval(publishDueEvents, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const savedEvent = window.localStorage.getItem("calendar:new-event");
    if (!savedEvent) return;

    try {
      const parsedEvent = JSON.parse(savedEvent) as CalendarEvent;
      const eventWithDepartment: CalendarEvent = {
        ...parsedEvent,
        department:
          parsedEvent.department ||
          (department !== "All Departments" ? department : undefined),
      };

      setEvents((previousEvents) => {
        const alreadyExists = previousEvents.some(
          (event) => event.id === eventWithDepartment.id
        );
        const nextEvents = alreadyExists
          ? previousEvents
          : [...previousEvents, eventWithDepartment];

        return saveEvents(nextEvents);
      });

      setCurrentDate(
        new Date(eventWithDepartment.year, eventWithDepartment.month, 1)
      );
      setScheduleDate(
        new Date(
          eventWithDepartment.year,
          eventWithDepartment.month,
          eventWithDepartment.day
        )
      );
      setSelectedDay(null);
      setScheduleTab("All");
      setStatus("All Status");
    } finally {
      window.localStorage.removeItem("calendar:new-event");
    }
  }, []);


  useEffect(() => {
    const storedResult = window.localStorage.getItem("calendar:event-result");
    if (!storedResult) return;

    try {
      const result = JSON.parse(storedResult) as {
        mode: "edit" | "delete";
        sourceEventId?: number | null;
        event?: CalendarEvent;
      };

      if (result.mode === "delete" && result.sourceEventId) {
        setEvents((previousEvents) => {
          const eventToDelete = previousEvents.find(
            (event) => event.id === result.sourceEventId
          );

          if (eventToDelete) {
            void deleteBackendEvent(eventToDelete);
          }

          const nextEvents = previousEvents.filter(
            (event) => event.id !== result.sourceEventId
          );

          return saveEvents(nextEvents);
        });
        return;
      }

      if (
        result.mode === "edit" &&
        result.sourceEventId &&
        result.event
      ) {
        setEvents((previousEvents) => {
          const nextEvents = previousEvents.map((event) =>
            event.id === result.sourceEventId
              ? { ...event, ...result.event!, id: event.id }
              : event
          );

          return saveEvents(nextEvents);
        });

        setCurrentDate(
          new Date(result.event.year, result.event.month, 1)
        );
        setScheduleDate(
          new Date(result.event.year, result.event.month, result.event.day)
        );
        setSelectedDay(null);
        setScheduleTab("All");
        setStatus("All Status");
      }
    } finally {
      window.localStorage.removeItem("calendar:event-result");
    }
  }, []);

  const monthCells = useMemo(() => daysForMonth(currentDate), [currentDate]);
  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const weekDays = useMemo(() => {
    const start = new Date(weekDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [weekDate]);

  const weekTitle = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];

    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return `${start.toLocaleString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${start.toLocaleString("en-US", { month: "short" })} ${start.getDate()} - ${end.toLocaleString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
  }, [weekDays]);

  const weekHours = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => hour),
    []
  );

  const formatWeekHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${String(hour).padStart(2, "0")} AM`;
    if (hour === 12) return "12 PM";
    return `${String(hour - 12).padStart(2, "0")} PM`;
  };

  const getWeekEventHour = (event: CalendarEvent) => {
    const value = (event.startTime || event.start || "").trim();
    const match = value.match(/^(\d{1,2})(?::\d{2})?\s*(am|pm)?$/i);

    if (!match) return -1;

    let hour = Number(match[1]);
    const meridiem = match[2]?.toLowerCase();

    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return hour;
  };

  const moveWeek = (amount: number) => {
    setWeekDate((previous) => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

  const dayTitle = useMemo(() => {
    const start = new Date(dayDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      return `${start.toLocaleString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${start.toLocaleString("en-US", { month: "short" })} ${start.getDate()} - ${end.toLocaleString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
  }, [dayDate]);

  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "long" });

  const dayEventsForHour = (hour: number) =>
    visibleEvents.filter(
      (event) =>
        event.year === dayDate.getFullYear() &&
        event.month === dayDate.getMonth() &&
        event.day === dayDate.getDate() &&
        getWeekEventHour(event) === hour
    );

  const moveDay = (amount: number) => {
    setDayDate((previous) => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount);
      return next;
    });
  };



  const visibleEvents = useMemo(() => {
    const normalizeTenant = (value?: string) => {
      const raw = (value || "").trim().toUpperCase();

      const aliases: Record<string, string> = {
        ALL: "ALL TENANTS",
        ALL_TENANTS: "ALL TENANTS",
        "ALL TENANTS": "ALL TENANTS",
        UNIVERSITY: "UNIVERSITY & COLLEGE",
        UNIVERSITY_COLLEGE: "UNIVERSITY & COLLEGE",
        "UNIVERSITY & COLLEGE": "UNIVERSITY & COLLEGE",
        SKILL_ACADEMY: "SKILL ACADEMY",
        "SKILL ACADEMY": "SKILL ACADEMY",
        BOOTCAMP: "BOOTCAMP",
        CORPORATE: "CORPORATE",
        GOVERNMENT: "GOVERNMENT",
        NGO: "NGO",
      };

      return aliases[raw] || raw.replace(/_/g, " ");
    };

    const normalizeRole = (value?: string) => {
      const raw = (value || "").trim().toLowerCase();

      if (!raw) return "";
      if (raw.includes("super admin")) return "super admin";
      if (raw.includes("platform admin")) return "platform admin";
      if (raw.includes("institute admin") || raw.includes("tenant admin")) return "institute admin";
      if (raw.includes("coordinator")) return "coordinator";
      if (raw.includes("faculty")) return "faculty";
      if (
        raw.includes("student") ||
        raw.includes("learner") ||
        raw.includes("employee") ||
        raw.includes("trainee")
      ) {
        return "student";
      }

      if (raw.includes("default") || raw.includes("all")) return "all";
      return raw;
    };

    const activeTenant =
      isStudentView || isTenantScopedRole
        ? signedInTenant
        : tenant;

    const normalizedActiveTenant = normalizeTenant(activeTenant);
    const selectedRole = normalizeRole(role);

    return events.filter((event) => {
      const statusMatch = status === "All Status" || event.status === status;
      const isMySchedulesTab = scheduleTab === "My Events";
      const tabMatch =
        scheduleTab === "All" ||
        isMySchedulesTab ||
        event.status === scheduleTab;
      const dayMatch = selectedDay === null || event.day === selectedDay;

      const eventDepartment = (event.department || "").trim();
      const departmentMatch =
        department === "All Departments" ||
        eventDepartment === department;

      const normalizedEventTenant = normalizeTenant(event.tenant);

      // Institute Admin / Coordinator / Faculty are permanently scoped to the
      // tenant selected during sign in. Super Admin / Platform Admin use the
      // Tenant dropdown. Existing events without tenant metadata stay visible
      // as shared/general events.
      const tenantMatch =
        normalizedActiveTenant === "ALL TENANTS" ||
        !event.tenant ||
        normalizedEventTenant === normalizedActiveTenant ||
        normalizedEventTenant === "ALL TENANTS";

      const eventRoleSource = event.role || event.audience || "";
      const normalizedEventRole = normalizeRole(eventRoleSource);

      const exactAssignedTenantMatch =
        !!event.tenant &&
        normalizedEventTenant === normalizeTenant(signedInTenant);

      const exactAssignedRoleMatch =
        !!event.role &&
        !!signedInAudienceRole &&
        normalizedEventRole === signedInAudienceRole;

      // A received event belongs to this user only when the published
      // Tenant + Actor pair matches this signed-in tenant and role.
      // New multi-pair Publish stores pairs as "Tenant::Actor".
      // Keep the old TENANT + ROLE matching too for existing events.
      const exactTargetPairMatch = (event.audience || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.includes("::"))
        .some((item) => {
          const [targetTenant = "", targetRole = ""] = item.split("::");

          return (
            normalizeTenant(targetTenant) === normalizeTenant(signedInTenant) &&
            normalizeRole(targetRole) === signedInAudienceRole
          );
        });

      // Default publish has no audience rows/metadata, so it is for everyone.
      // Specific publish must match one exact Tenant + Actor target pair.
      // Keep the old TENANT + ROLE match for older saved events.
      const isDefaultPublishedAudience =
        !event.tenant &&
        !event.role &&
        !(event.audience || "").trim();

      const exactReceivedAudienceMatch =
        isDefaultPublishedAudience ||
        exactTargetPairMatch ||
        (exactAssignedTenantMatch && exactAssignedRoleMatch);

      const roleMatch =
        isStudentView
          ? exactReceivedAudienceMatch
          : isMySchedulesTab
            ? true
            : (
                role === "All Roles" ||
                !normalizedEventRole ||
                normalizedEventRole === selectedRole ||
                normalizedEventRole === "all"
              );

      const exactSignedInUserId = (() => {
        if (!login?.role) return "";

        if (login.role === "SUPER_ADMIN") return "calendar-SUPER_ADMIN";
        if (login.role === "PLATFORM_ADMIN") return "calendar-PLATFORM_ADMIN";

        const tenantTypeFromDisplay: Record<string, string> = {
          "University & College": "UNIVERSITY_COLLEGE",
          "Skill Academy": "SKILL_ACADEMY",
          Bootcamp: "BOOTCAMP",
          Corporate: "CORPORATE",
          Government: "GOVERNMENT",
          NGO: "NGO",
        };

        const creatorTenantType =
          login.tenantType ||
          tenantTypeFromDisplay[login.displayTenant || ""] ||
          "";

        return creatorTenantType
          ? `calendar-${login.role}-${creatorTenantType}`
          : `calendar-${login.role}`;
      })();

      const normalizedCreatedBy = (event.createdBy || "")
        .trim()
        .toUpperCase();

      const normalizedExactSignedInUserId = exactSignedInUserId
        .trim()
        .toUpperCase();

      const normalizedLoginRole = (login?.role || "")
        .trim()
        .toUpperCase();

      const creatorRoleToken = normalizedCreatedBy
        .replace(/^CALENDAR-/, "")
        .split("-")[0] || "";

      const creatorTenantToken = normalizedCreatedBy
        .replace(/^CALENDAR-/, "")
        .split("-")
        .slice(1)
        .join("_");

      const normalizedSignedTenantForCreator = (() => {
        const tenantTypeFromDisplay: Record<string, string> = {
          "University & College": "UNIVERSITY_COLLEGE",
          "Skill Academy": "SKILL_ACADEMY",
          Bootcamp: "BOOTCAMP",
          Corporate: "CORPORATE",
          Government: "GOVERNMENT",
          NGO: "NGO",
        };

        return (
          login?.tenantType ||
          tenantTypeFromDisplay[login?.displayTenant || ""] ||
          ""
        )
          .trim()
          .toUpperCase();
      })();

      const exactCreatorMatch =
        !!normalizedCreatedBy &&
        !!normalizedExactSignedInUserId &&
        normalizedCreatedBy === normalizedExactSignedInUserId;

      const actorCreatorMatch =
        !!normalizedCreatedBy &&
        !!normalizedLoginRole &&
        creatorRoleToken === normalizedLoginRole &&
        (
          login?.role === "SUPER_ADMIN" ||
          login?.role === "PLATFORM_ADMIN" ||
          !normalizedSignedTenantForCreator ||
          creatorTenantToken === normalizedSignedTenantForCreator
        );

      const localOwner = login?.role
        ? `${login.role}::${login.tenantType || ""}`
        : "";
      const isCreatedBySignedInUser =
        exactCreatorMatch || actorCreatorMatch ||
        (!!localOwner && event.localOwner === localOwner);

      // Add / Reuse writes into local state immediately. Before the next
      // backend refresh there may be no createdBy value yet. Such an event
      // is still owned by the current calendar screen and must stay visible
      // in the right-side schedule list.
      const isLocallyManagedEvent = !event.createdBy;

      // GET /events is already audience-filtered by the backend:
      // Default => everyone; TARGET => exact Tenant + Actor recipient.
      // My Events shows published events received from somebody else.
      const receivedScheduleMatch =
        !isMySchedulesTab ||
        (
          event.status === "Published" &&
          !isCreatedBySignedInUser
        );

      // IMPORTANT:
      // Once an event has an explicit TENANT + ROLE audience, it must not leak
      // into another signed-in actor's All/Published/etc. views.
      // The publisher/creator can still see and manage the event they created.
      const normalizedCreator = (event.createdBy || "")
        .replace(/^calendar-/i, "")
        .replace(/[-_]+/g, " ")
        .trim()
        .toLowerCase();

      const creatorRole =
        normalizedCreator.includes("super admin")
          ? "super admin"
          : normalizedCreator.includes("platform admin")
            ? "platform admin"
            : normalizedCreator.includes("tenant admin") ||
                normalizedCreator.includes("institute admin")
              ? "institute admin"
              : normalizedCreator.includes("coordinator")
                ? "coordinator"
                : normalizedCreator.includes("faculty")
                  ? "faculty"
                  : normalizedCreator.includes("learner") ||
                      normalizedCreator.includes("student")
                    ? "student"
                    : "";

      const createdBySignedInRole =
        !!creatorRole &&
        !!signedInAudienceRole &&
        creatorRole === signedInAudienceRole;

      const hasExplicitAudience = !!event.tenant && !!event.role;

      const audienceAccessMatch =
        isCreatedBySignedInUser ||
        exactReceivedAudienceMatch;

      // The backend GET /events already returns only events this signed-in
      // user is allowed to receive. Therefore a received Published event must
      // remain visible in:
      //   1. My Events
      //   2. Published
      //   3. All
      //   4. Calendar views
      //
      // Do not apply the sender-side Tenant/Role dropdown filters again to a
      // received event. With multiple TARGET pairs event.tenant/event.role can
      // contain comma-joined values, which previously hid valid recipients.
      const isReceivedPublishedEvent =
        event.status === "Published" &&
        !isCreatedBySignedInUser &&
        exactReceivedAudienceMatch;

      if (isMySchedulesTab) {
        return isReceivedPublishedEvent && dayMatch;
      }

      if (
        isReceivedPublishedEvent &&
        (scheduleTab === "All" || scheduleTab === "Published")
      ) {
        return statusMatch && tabMatch && dayMatch;
      }

      // Never hide the creator's own Add / Reuse / Publish event merely
      // because it was assigned to another Tenant + Actor.
      // Also keep a just-created local event visible until backend refresh.
      if (isCreatedBySignedInUser || isLocallyManagedEvent) {
        return statusMatch && tabMatch && dayMatch && departmentMatch;
      }

      return (
        statusMatch &&
        tabMatch &&
        dayMatch &&
        departmentMatch &&
        tenantMatch &&
        roleMatch &&
        receivedScheduleMatch &&
        audienceAccessMatch
      );
    });
  }, [
    events,
    status,
    scheduleTab,
    selectedDay,
    department,
    isStudentView,
    isTenantScopedRole,
    signedInTenant,
    tenant,
    role,
    signedInAudienceRole,
  ]);

  useEffect(() => {
    setMobileEventIndex((currentIndex) => {
      if (visibleEvents.length === 0) return 0;
      return Math.min(currentIndex, visibleEvents.length - 1);
    });
    setOpenMenu(null);
  }, [visibleEvents.length, scheduleTab, status, selectedDay, tenant, role]);

  const moveMonth = (amount: number) =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + amount, 1));

  const moveScheduleDate = (amount: number) => {
    setScheduleDate((prev) => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() + amount);
      return nextDate;
    });
  };

  const scheduleDateLabel = scheduleDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
  });

  const clearFilters = () => {
    setTenant(isTenantScopedRole ? signedInTenant : "All Tenants");
    setRole("All Roles");
    setStatus("All Status");
    setDepartment("All Departments");
    setSelectedDepartmentDivision("");
    setScheduleTab("All");
    setSelectedDay(null);
    setOpenFilter(null);
  };

  const toggleEventPause = (event: CalendarEvent) => {
    const nextStatus = event.status === "Paused" ? "PUBLISHED" : "PAUSED";
    void patchBackendEvent(event, { status: nextStatus });

    setEvents((previousEvents) => {
      const nextEvents = previousEvents.map((item) =>
        item.id === event.id
          ? {
              ...item,
              status: (item.status === "Paused" ? "Published" : "Paused") as EventStatus,
            }
          : item
      );

      return saveEvents(nextEvents);
    });

    setOpenMenu(null);
  };

  const openCancelEventModal = (event: CalendarEvent) => {
    setOpenMenu(null);
    setCancelEvent(event);
    setCancelReason("");
  };

  const closeCancelEventModal = () => {
    setCancelEvent(null);
    setCancelReason("");
  };

  const confirmCancelPublishedEvent = () => {
    if (!cancelEvent) return;

    void patchBackendEvent(cancelEvent, { status: "CLOSED" });

    setEvents((previousEvents) => {
      const nextEvents = previousEvents.map((item) =>
        item.id === cancelEvent.id
          ? { ...item, status: "Closed" as EventStatus }
          : item
      );

      return saveEvents(nextEvents);
    });

    closeCancelEventModal();
  };

  const handleAddEvent = () => {
    setOpenMenu(null);
    window.localStorage.removeItem("calendar:event-action");
    window.localStorage.removeItem("calendar:selected-event");
    window.localStorage.removeItem("calendar:reuse-event");
    setEventFormOpen(true);
  };

  const handleAddEventForDate = (date: Date) => {
    setOpenMenu(null);
    setDayPopup(null);
    setSelectedDay(date.getDate());
    setScheduleDate(new Date(date));

    window.localStorage.removeItem("calendar:event-action");
    window.localStorage.removeItem("calendar:selected-event");
    window.localStorage.removeItem("calendar:reuse-event");

    // Pass only the clicked calendar date to the existing Add Event form.
    window.localStorage.setItem(
      "calendar:add-event-date",
      JSON.stringify({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
      })
    );

    setEventFormOpen(true);
  };

  const openEventForm = (event: CalendarEvent, mode: "edit" | "reuse") => {
    setOpenMenu(null);

    if (mode === "edit") {
      // IMPORTANT:
      // AddEventPage reads this exact key.
      // Store the exact event whose Edit button was clicked.
      window.localStorage.setItem(
        "calendar:event-action",
        JSON.stringify({
          mode: "edit",
          event,
        })
      );

      setEventFormOpen(true);
      return;
    }

    // REUSE: use the same reliable transfer key as Edit.
    window.localStorage.removeItem("calendar:reuse-event");
    window.localStorage.setItem(
      "calendar:event-action",
      JSON.stringify({
        mode: "reuse",
        event,
      })
    );

    setEventFormOpen(true);
  };

  const closeEmbeddedEventForm = () => {
    setEventFormOpen(false);
    setOpenMenu(null);
    window.localStorage.removeItem("calendar:event-action");
    window.localStorage.removeItem("calendar:selected-event");
    window.localStorage.removeItem("calendar:reuse-event");
  };

  const completeEmbeddedEventForm = async () => {
    const storedResult = window.localStorage.getItem("calendar:event-result");
    const storedNewEvent = window.localStorage.getItem("calendar:new-event");

    if (storedResult) {
      try {
        const result = JSON.parse(storedResult) as {
          mode: "edit" | "delete";
          sourceEventId?: number | null;
          backendId?: string | null;
          event?: CalendarEvent;
        };

        if (result.mode === "delete" && result.sourceEventId) {
          const eventToDelete = events.find(
            (event) => event.id === result.sourceEventId
          );

          const backendId = result.backendId || eventToDelete?.backendId;

          if (backendId) {
            const token = window.localStorage.getItem("calendar_access_token");
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

            if (!token) {
              console.error("Cannot delete backend event: missing access token.");
              return;
            }

            const response = await fetch(`${apiUrl}/events/${backendId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok && response.status !== 404) {
              console.error("Failed to delete backend event:", response.status);
              return;
            }
          }

          setEvents((previousEvents) => {
            const nextEvents = previousEvents.filter(
              (event) => event.id !== result.sourceEventId
            );
            return saveEvents(nextEvents);
          });
        } else if (
          result.mode === "edit" &&
          result.sourceEventId &&
          result.event
        ) {
          setEvents((previousEvents) => {
            const nextEvents = previousEvents.map((event) =>
              event.id === result.sourceEventId
                ? { ...event, ...result.event!, id: event.id }
                : event
            );
            return saveEvents(nextEvents);
          });
        }
      } finally {
        window.localStorage.removeItem("calendar:event-result");
      }
    }

    if (storedNewEvent) {
      try {
        const parsedEvent = JSON.parse(storedNewEvent) as CalendarEvent;
        const eventWithDepartment: CalendarEvent = {
          ...parsedEvent,
          localOwner: login?.role
            ? `${login.role}::${login.tenantType || ""}`
            : parsedEvent.localOwner,
          department:
            parsedEvent.department ||
            (department !== "All Departments" ? department : undefined),
        };

        setEvents((previousEvents) => {
          const alreadyExists = previousEvents.some(
            (event) => event.id === eventWithDepartment.id
          );
          const nextEvents = alreadyExists
            ? previousEvents
            : [...previousEvents, eventWithDepartment];

          return saveEvents(nextEvents);
        });

        setCurrentDate(
          new Date(eventWithDepartment.year, eventWithDepartment.month, 1)
        );
        setScheduleDate(
          new Date(
            eventWithDepartment.year,
            eventWithDepartment.month,
            eventWithDepartment.day
          )
        );
        setSelectedDay(null);
        setScheduleTab("All");
        setStatus("All Status");
      } finally {
        window.localStorage.removeItem("calendar:new-event");
      }
    }

    setEventFormOpen(false);
    setOpenMenu(null);
  };

  const publishTenants = [
    "University & College",
    "Skill Academy",
    "Bootcamp",
    "Corporate",
  ];

  // Keep the backend actor values unchanged, but show tenant-friendly
  // actor names in the Publish form.
  //
  // Backend values:
  // Institute Admins / Coordinators / Faculty / Students
  //
  // Example Corporate labels:
  // Corporate Admin / L&D Coordinator / Trainer / Employee
  const publishActors = (() => {
    switch (login?.role) {
      case "SUPER_ADMIN":
      case "PLATFORM_ADMIN":
      case "TENANT_ADMIN":
      case "COORDINATOR":
      case "FACULTY":
        return [
          "Institute Admins",
          "Coordinators",
          "Faculty",
          "Students",
        ];
      default:
        return [];
    }
  })();

  const getPublishActorLabel = (tenantName: string, actor: string) => {
    const normalizedTenant = (tenantName || "").trim();

    const tenantActorLabels: Record<string, Record<string, string>> = {
      "University & College": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Institute Admin",
        "Coordinators": "Coordinator",
        "Faculty": "Faculty",
        "Students": "Student",
      },

      "Skill Academy": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Academy Admin",
        "Coordinators": "Program Coordinator",
        "Faculty": "Trainer",
        "Students": "Learner",
      },

      "Bootcamp": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Bootcamp Admin",
        "Coordinators": "Cohort Coordinator",
        "Faculty": "Instructor",
        "Students": "Learner",
      },

      "Corporate": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Corporate Admin",
        "Coordinators": "L&D Coordinator",
        "Faculty": "Trainer",
        "Students": "Employee",
      },
    };

    const defaultLabels: Record<string, string> = {
      "Platform Admins": "Platform Admin",
      "Institute Admins": "Institute Admin",
      "Coordinators": "Coordinator",
      "Faculty": "Faculty",
      "Students": "Student",
    };

    return (
      tenantActorLabels[normalizedTenant]?.[actor] ||
      defaultLabels[actor] ||
      actor
    );
  };

  const activePublishTenantForLabels =
    publishTenant ||
    (isTenantScopedRole ? signedInTenant : "");

  const isGlobalPublishActor = (actor: string) =>
    actor === "Platform Admins";

  const isTenantScopedPublisher =
    login?.role === "TENANT_ADMIN" ||
    login?.role === "COORDINATOR" ||
    login?.role === "FACULTY";

  const openPublishModal = (event: CalendarEvent) => {
    setOpenMenu(null);
    setPublishEvent(event);
    setPublishOrganizer("");
    setPublishError("");
    setPublishAudienceSelected(false);

    // Every Publish popup opens as a fresh publish action.
    // Do not display recipients from an earlier publish in this popup.
    // The backend still keeps the already-published recipients for THIS event,
    // and a new specific Tenant + Actor selection is added to that same event.
    setPublishAudienceOpen(false);
    setPublishAudienceType("Default");
    setPublishFlyout(null);
    setPublishTenant("");
    setPublishActor("");
    setPublishTargets([]);
  };

  const closePublishModal = () => {
    setPublishEvent(null);
    setPublishOrganizer("");
    setPublishError("");
    setPublishAudienceSelected(false);
    setPublishAudienceOpen(false);
    setPublishAudienceType("Default");
    setPublishFlyout(null);
    setPublishTenant("");
    setPublishActor("");
    setPublishTargets([]);
  };

  const selectPublishAudience = (
    value: "Default" | "Specific Tenant" | "Specific Actor"
  ) => {
    setPublishError("");
    setPublishAudienceSelected(true);
    setPublishAudienceType(value);
    setPublishTenant("");
    setPublishActor("");

    if (value === "Default") {
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      setPublishTargets([]);
      return;
    }

    if (value === "Specific Tenant") {
      // Tenant is a scope only. The actual receiver is selected next.
      setPublishAudienceOpen(true);
      setPublishFlyout("tenant");
      return;
    }

    // Specific Actor: choose receiver first.
    setPublishAudienceOpen(true);
    setPublishFlyout("actor");
  };

  const addPublishTarget = (targetTenant: string, targetActor: string) => {
    setPublishTargets((previous) => {
      const exists = previous.some(
        (item) =>
          item.tenant === targetTenant &&
          item.actor === targetActor
      );

      return exists
        ? previous
        : [...previous, { tenant: targetTenant, actor: targetActor }];
    });
  };

  const selectPublishTenant = (value: string) => {
    setPublishError("");
    setPublishTenant(value);

    // Actor-first flow for Super Admin / Platform Admin.
    if (publishActor) {
      addPublishTarget(value, publishActor);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

    // Tenant-first flow: choose the receiving actor next.
    setPublishAudienceType("Specific Tenant");
    setPublishAudienceOpen(true);
    setPublishFlyout("actor");
  };

  const selectPublishActor = (value: string) => {
    setPublishError("");
    setPublishActor(value);

    // Platform Admin is global, so no tenant dropdown is needed.
    if (isGlobalPublishActor(value)) {
      addPublishTarget("All Tenants", value);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

    // Institute Admin / Coordinator / Faculty are already tenant-scoped.
    // Their own signed-in tenant is applied automatically.
    if (isTenantScopedPublisher) {
      if (!signedInTenant || signedInTenant === "All Tenants") {
        setPublishError("Unable to identify the signed-in tenant.");
        return;
      }

      addPublishTarget(signedInTenant, value);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

    // If tenant was selected first, finish the target now.
    if (publishTenant) {
      addPublishTarget(publishTenant, value);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

    // Super Admin / Platform Admin choosing a tenant-scoped actor
    // must now choose which tenant receives the event.
    setPublishAudienceOpen(true);
    setPublishFlyout("tenant");
  };

  const confirmPublishEvent = async () => {
    if (!publishEvent) return;

    if (!publishAudienceSelected) {
      setPublishError("Please select Audience before publishing.");
      return;
    }

    if (
      publishAudienceType !== "Default" &&
      publishTargets.length === 0
    ) {
      setPublishError("Please select the receiving Actor before publishing.");
      return;
    }

    setPublishError("");

    const currentPublishEvent = publishEvent;
    const currentAudienceType = publishAudienceType;
    const currentTargets = [...publishTargets];

    const audience =
      currentAudienceType === "Default"
        ? "Default"
        : currentTargets
            .map(
              (item) =>
                `${item.tenant} - ${getPublishActorLabel(item.tenant, item.actor)}`
            )
            .join(", ");

    const backendAudiences = currentTargets.map((item) => ({
      audienceId: `${item.tenant}::${item.actor}`,
      audienceType: "TARGET",
    }));

    const updatedBackendEvent = await patchBackendEvent(currentPublishEvent, {
      status: "PUBLISHED",
      scheduledPublishAt: null,
      // Default = everyone for THIS event.
      // Specific = the Tenant + Actor pair(s) selected in this fresh popup.
      // The backend owns recipient history for this event and must merge
      // new TARGET rows only with this event's existing TARGET rows.
      audiences:
        currentAudienceType === "Default"
          ? []
          : backendAudiences,
    });

    if (!updatedBackendEvent) {
      return;
    }

    const mappedUpdatedEvent = backendEventToCalendarEvent(updatedBackendEvent);

    setEvents((previousEvents) => {
      const nextEvents = previousEvents.map((event) =>
        event.id === currentPublishEvent.id ||
        event.backendId === currentPublishEvent.backendId
          ? {
              ...event,
              ...mappedUpdatedEvent,
              id: event.id,
              createdBy: mappedUpdatedEvent.createdBy || event.createdBy,
              localOwner: login?.role
                ? `${login.role}::${login.tenantType || ""}`
                : event.localOwner,
              audience:
                mappedUpdatedEvent.audience ||
                audience ||
                currentAudienceType,
            }
          : event
      );

      return saveEvents(nextEvents);
    });

    // Fetch again after every publish so repeated/second/multiple publishes
    // always use the latest DB audience rows.
    const token = window.localStorage.getItem("calendar_access_token");

    if (token) {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const response = await fetch(`${apiUrl}/events`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.ok) {
          const backendEvents = (await response.json()) as BackendEvent[];

          if (Array.isArray(backendEvents)) {
            const mappedEvents = backendEvents.map(backendEventToCalendarEvent);

            /*
             * Do not replace the whole calendar after Publish.
             * GET /events can be audience-scoped, so replacing all events here
             * was removing reused/local/reminder-sent events immediately after
             * a publish. Merge only matching backendIds and preserve everything
             * else.
             */
            setEvents((previousEvents) => {
              const previousByBackendId = new Map<string, CalendarEvent>();

              previousEvents.forEach((event) => {
                if (event.backendId) {
                  previousByBackendId.set(event.backendId, event);
                }
              });

              const mergedBackendEvents = mappedEvents.map((backendEvent) => {
                if (!backendEvent.backendId) {
                  return backendEvent;
                }

                const existingEvent = previousByBackendId.get(
                  backendEvent.backendId
                );

                if (!existingEvent) {
                  return backendEvent;
                }

                return {
                  ...existingEvent,
                  ...backendEvent,
                  reminderSentAt:
                    existingEvent.reminderSentAt ||
                    backendEvent.reminderSentAt,
                  localOwner: existingEvent.localOwner,
                };
              });

              const returnedBackendIds = new Set(
                mappedEvents
                  .map((event) => event.backendId)
                  .filter((value): value is string => Boolean(value))
              );

              const preservedExistingEvents = previousEvents.filter((event) => {
                if (event.backendId && returnedBackendIds.has(event.backendId)) {
                  return false;
                }

                return true;
              });

              const nextEvents = [
                ...mergedBackendEvents,
                ...preservedExistingEvents,
              ];

              window.localStorage.setItem(
                "calendar:events",
                JSON.stringify(nextEvents)
              );

              return nextEvents;
            });
          }
        }
      } catch (error) {
        console.error("Failed to refresh events after publish:", error);
      }
    }

    setScheduleTab("All");
    setStatus("All Status");
    setSelectedDay(null);
    closePublishModal();
  };

  const handleAutoPublish = () => {
    if (!publishEvent) return;

    if (!publishAudienceSelected) {
      setPublishError("Please select Audience before scheduling publish.");
      return;
    }

    if (
      publishAudienceType !== "Default" &&
      publishTargets.length === 0
    ) {
      setPublishError("Please select the Tenant and Actor before scheduling publish.");
      return;
    }

    setPublishError("");

    setAutoPublishEvent(publishEvent);
    setAutoPublishDate("");
    setAutoPublishCalendarOpen(false);
    setAutoPublishCalendarMonth(() => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    setAutoPublishHour("");
    setAutoPublishMinute("");
    setAutoPublishTimeOpen(false);
    setAutoPublishError("");

    // Close only the Publish form. Keep its audience selections in state
    // so Save Schedule can apply them to this same event.
    setPublishAudienceOpen(false);
    setPublishFlyout(null);
    setPublishEvent(null);
  };

  const closeAutoPublishModal = () => {
    setAutoPublishEvent(null);
    setAutoPublishDate("");
    setAutoPublishCalendarOpen(false);
    setAutoPublishHour("");
    setAutoPublishMinute("");
    setAutoPublishTimeOpen(false);
    setAutoPublishError("");
  };

  const autoPublishCalendarCells = useMemo(() => {
    const year = autoPublishCalendarMonth.getFullYear();
    const month = autoPublishCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: 42 }, (_, index) => {
      if (index < firstDay) {
        const day = daysInPreviousMonth - firstDay + index + 1;
        const date = new Date(year, month - 1, day);
        return { day, date, currentMonth: false };
      }

      if (index >= firstDay + daysInMonth) {
        const day = index - firstDay - daysInMonth + 1;
        const date = new Date(year, month + 1, day);
        return { day, date, currentMonth: false };
      }

      const day = index - firstDay + 1;
      return {
        day,
        date: new Date(year, month, day),
        currentMonth: true,
      };
    });
  }, [autoPublishCalendarMonth]);

  const formatAutoPublishDateValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const formatAutoPublishDateDisplay = (value: string) => {
    if (!value) return "dd-mm-yyyy";
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  };

  const selectAutoPublishDate = (date: Date) => {
    setAutoPublishDate(formatAutoPublishDateValue(date));
    setAutoPublishCalendarMonth(
      new Date(date.getFullYear(), date.getMonth(), 1)
    );
    setAutoPublishCalendarOpen(false);
    setAutoPublishError("");
  };

  const saveAutoPublishSchedule = () => {
    if (!autoPublishEvent) return;

    if (!autoPublishDate || autoPublishHour === "" || autoPublishMinute === "") {
      setAutoPublishError("Please select publish date and time.");
      return;
    }

    const scheduledDate = new Date(
      `${autoPublishDate}T${autoPublishHour.padStart(2, "0")}:${autoPublishMinute.padStart(2, "0")}:00`
    );

    if (Number.isNaN(scheduledDate.getTime())) {
      setAutoPublishError("Please select a valid date and time.");
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      setAutoPublishError("Please select a future date and time.");
      return;
    }

    const audience =
      publishAudienceType === "Default"
        ? "Default"
        : publishTargets
            .map(
              (item) =>
                `${item.tenant} - ${getPublishActorLabel(item.tenant, item.actor)}`
            )
            .join(", ");

    const backendAudiences = publishTargets.map((item) => ({
      audienceId: `${item.tenant}::${item.actor}`,
      audienceType: "TARGET",
    }));

    void patchBackendEvent(autoPublishEvent, {
      status: "SCHEDULED",
      scheduledPublishAt: scheduledDate.toISOString(),
      // Default = everyone. Clear any previous TENANT/ROLE targeting.
      audiences:
        publishAudienceType === "Default"
          ? []
          : backendAudiences,
    });

    setEvents((previousEvents) => {
      const nextEvents = previousEvents.map((event) =>
        event.id === autoPublishEvent.id
          ? {
              ...event,
              status: "Scheduled" as EventStatus,
              scheduledPublishAt: scheduledDate.toISOString(),
              audience: audience || publishAudienceType,
              tenant:
                publishAudienceType === "Default"
                  ? undefined
                  : publishTargets.map((item) => item.tenant).join(", ") || undefined,
              role:
                publishAudienceType === "Default"
                  ? undefined
                  : publishTargets.map((item) => item.actor).join(", ") || undefined,
            }
          : event
      );

      return saveEvents(nextEvents);
    });

    closeAutoPublishModal();
  };

  const formatReminderDate = (event: CalendarEvent) =>
    `${String(event.day).padStart(2, "0")}-${String(event.month + 1).padStart(2, "0")}-${event.year}`;

  const getReminderAudience = (event: CalendarEvent) => {
    if (event.audience) return event.audience;

    const audienceTenant =
      event.tenant ||
      (tenant !== "All Tenants" ? tenant : "University & College");

    const audienceRole =
      event.role ||
      (role !== "All Roles" ? role : "Institute Admin");

    return `${audienceTenant}, ${audienceRole}`;
  };

  const openReminderModal = (event: CalendarEvent) => {
    setOpenMenu(null);
    setReminderDescription("");
    setReminderEvent(event);
  };

  const closeReminderModal = () => {
    setReminderEvent(null);
    setReminderDescription("");
  };

  const sendReminder = () => {
    if (!reminderEvent) return;

    // Backend reminder API can be connected here later.
    // reminderEvent + reminderDescription contain the selected dynamic values.
    const sentEvent = reminderEvent;

    setReminderEvent(null);
    setReminderDescription("");
    setReminderSentEvent(sentEvent);
    if (reminderEvent) {
      setEvents((previousEvents) => {
        const nextEvents = previousEvents.map((item) =>
          item.id === reminderEvent.id
            ? { ...item, reminderSentAt: new Date().toISOString() }
            : item
        );

        return saveEvents(nextEvents);
      });
    }

  };

  const closeReminderSentPopup = () => {
    setReminderSentEvent(null);
  };

  const exportMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const exportYears = Array.from(
    new Set([
      ...events.map((event) => String(event.year)),
      String(new Date().getFullYear()),
      "2026",
    ])
  ).sort((a, b) => Number(a) - Number(b));

  const escapePdfText = (value: string | number) =>
    String(value)
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const buildPdfBlob = (selectedEvents: CalendarEvent[], monthLabel: string, yearLabel: string) => {
    const pageWidth = 842;
    const pageHeight = 595;
    const left = 28;
    const top = 548;
    const rowHeight = 24;
    const columns = [
      { label: "Title", width: 190 },
      { label: "Date", width: 110 },
      { label: "Start", width: 85 },
      { label: "End", width: 85 },
      { label: "Location", width: 150 },
      { label: "Attendees", width: 85 },
      { label: "Status", width: 85 },
    ];

    const objects: string[] = [];
    const addObject = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const fontObject = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontObject = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    const pageObjectNumbers: number[] = [];
    const contentObjectNumbers: number[] = [];
    const rowsPerPage = 17;
    const chunks: CalendarEvent[][] = [];

    for (let i = 0; i < selectedEvents.length; i += rowsPerPage) {
      chunks.push(selectedEvents.slice(i, i + rowsPerPage));
    }
    if (!chunks.length) chunks.push([]);

    chunks.forEach((chunk, pageIndex) => {
      let stream = "q\n";
      stream += `BT /F2 18 Tf ${left} ${pageHeight - 34} Td (${escapePdfText(`Calendar Events - ${monthLabel} ${yearLabel}`)}) Tj ET\n`;

      let y = top;
      let x = left;

      stream += "0.90 g\n";
      stream += `${left} ${y - rowHeight + 5} ${columns.reduce((sum, c) => sum + c.width, 0)} ${rowHeight} re f\n`;
      stream += "0 g\n";

      columns.forEach((column) => {
        stream += `BT /F2 9 Tf ${x + 5} ${y - 12} Td (${escapePdfText(column.label)}) Tj ET\n`;
        x += column.width;
      });

      y -= rowHeight;

      chunk.forEach((event) => {
        x = left;
        const values = [
          event.title,
          event.date,
          event.start,
          event.end,
          event.location,
          event.attendees,
          event.status,
        ];

        values.forEach((value, columnIndex) => {
          const maxChars = Math.max(7, Math.floor(columns[columnIndex].width / 5.8));
          const text = String(value).length > maxChars
            ? `${String(value).slice(0, maxChars - 3)}...`
            : String(value);

          stream += `${x} ${y - rowHeight + 5} ${columns[columnIndex].width} ${rowHeight} re S\n`;
          stream += `BT /F1 8 Tf ${x + 5} ${y - 12} Td (${escapePdfText(text)}) Tj ET\n`;
          x += columns[columnIndex].width;
        });

        y -= rowHeight;
      });

      stream += `BT /F1 8 Tf ${pageWidth - 90} 18 Td (Page ${pageIndex + 1}) Tj ET\nQ`;

      const contentObject = addObject(
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
      );
      contentObjectNumbers.push(contentObject);

      const pageObject = addObject("");
      pageObjectNumbers.push(pageObject);
    });

    const pagesObject = addObject("");
    const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

    pageObjectNumbers.forEach((pageObject, index) => {
      objects[pageObject - 1] =
        `<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /Font << /F1 ${fontObject} 0 R /F2 ${boldFontObject} 0 R >> >> ` +
        `/Contents ${contentObjectNumbers[index]} 0 R >>`;
    });

    objects[pagesObject - 1] =
      `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const downloadCalendarPdf = () => {
    setExportMessage("");

    if (!exportMonth) {
      setExportMessage("Please select a month.");
      return;
    }

    const monthIndex = exportMonths.indexOf(exportMonth);
    const yearNumber = Number(exportYear);

    const scheduledEvents = events.filter(
      (event) => event.month === monthIndex && event.year === yearNumber
    );

    if (!scheduledEvents.length) {
      setExportMessage(`No events are scheduled for ${exportMonth} ${exportYear}.`);
      return;
    }

    const pdfBlob = buildPdfBlob(scheduledEvents, exportMonth, exportYear);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calendar-${exportMonth.toLowerCase()}-${exportYear}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const downloadTemplate = () => {
    const csv = "title,date,start,end,location,attendees,status\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "calendar-upload-template.csv"; a.click();
    URL.revokeObjectURL(url);
    setBulkOpen(false);
  };

  const uploadCsv = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear the input immediately so the same browser change event cannot be
    // processed twice while the async upload is still running.
    e.target.value = "";

    const reader = new FileReader();

    reader.onload = async () => {
      /*
       * BULK UPLOAD DATE/TIME SAFETY FIX
       *
       * Keep the existing CSV/template/backend/schedule flow exactly the same,
       * but normalize common CSV/Excel date and time formats before calling
       * Date.toISOString(). This prevents "RangeError: Invalid time value".
       */
      const parseCsvDate = (value: string) => {
        const raw = (value || "").trim().replace(/^"|"$/g, "");
        if (!raw) return null;

        let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (match) {
          const parsed = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
          );

          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (match) {
          const parsed = new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
          );

          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        const fallback = new Date(raw);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      };

      const normalizeCsvTime = (
        value: string,
        fallback: string
      ) => {
        const raw = (value || "")
          .trim()
          .replace(/^"|"$/g, "")
          .replace(/\./g, ":")
          .replace(/\s+/g, " ");

        if (!raw) return fallback;

        // Excel can export a time as a fraction of a day, e.g. 0.5 = 12:00.
        if (/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(raw)) {
          const fraction = Number(raw);

          if (Number.isFinite(fraction) && fraction >= 0 && fraction <= 1) {
            const totalMinutes = Math.round(fraction * 24 * 60) % (24 * 60);
            const hour = Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;

            return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
              2,
              "0"
            )}`;
          }
        }

        // 24-hour values: 9:30, 09:30, 09:30:00
        let match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (match) {
          const hour = Number(match[1]);
          const minute = Number(match[2]);

          if (
            Number.isInteger(hour) &&
            Number.isInteger(minute) &&
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
          ) {
            return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
              2,
              "0"
            )}`;
          }

          return fallback;
        }

        // 12-hour values: 9 AM, 9:30 AM, 09:30AM, 09:30:00 PM
        match = raw.match(
          /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)$/i
        );

        if (match) {
          let hour = Number(match[1]);
          const minute = Number(match[2] || "00");
          const meridiem = match[3].toLowerCase();

          if (
            !Number.isInteger(hour) ||
            !Number.isInteger(minute) ||
            hour < 1 ||
            hour > 12 ||
            minute < 0 ||
            minute > 59
          ) {
            return fallback;
          }

          if (meridiem === "pm" && hour < 12) hour += 12;
          if (meridiem === "am" && hour === 12) hour = 0;

          return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
            2,
            "0"
          )}`;
        }

        return fallback;
      };

      const toBackendIso = (
        dateValue: string,
        timeValue: string
      ) => {
        const dateMatch = dateValue.match(
          /^(\d{4})-(\d{2})-(\d{2})$/
        );

        const timeMatch = timeValue.match(
          /^(\d{2}):(\d{2})$/
        );

        if (!dateMatch || !timeMatch) {
          return null;
        }

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2]);

        const localDateTime = new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          0,
          0
        );

        // Reject impossible calendar values such as 2026-02-31.
        if (
          Number.isNaN(localDateTime.getTime()) ||
          localDateTime.getFullYear() !== year ||
          localDateTime.getMonth() !== month - 1 ||
          localDateTime.getDate() !== day ||
          localDateTime.getHours() !== hour ||
          localDateTime.getMinutes() !== minute
        ) {
          return null;
        }

        return localDateTime.toISOString();
      };

      const csvLines = String(reader.result || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/)
        .slice(1);

      const parsed = csvLines
        .map((line, index) => {
          const [
            title,
            rawDate,
            rawStart,
            rawEnd,
            location,
            attendees,
            rawStatus,
          ] = line
            .split(",")
            .map((x) => x.trim().replace(/^"|"$/g, ""));

          const dateObj = parseCsvDate(rawDate || "");

          if (!title || !dateObj) {
            return null;
          }

          const start = normalizeCsvTime(rawStart || "", "10:00");
          let end = normalizeCsvTime(rawEnd || "", "11:00");

          // If the imported end time is invalid/equal/earlier, keep the row
          // usable by moving the end time one hour after start where possible.
          const startMinutes =
            Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
          let endMinutes =
            Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));

          if (endMinutes <= startMinutes) {
            const adjustedEndMinutes = Math.min(
              startMinutes + 60,
              23 * 60 + 59
            );

            end = `${String(Math.floor(adjustedEndMinutes / 60)).padStart(
              2,
              "0"
            )}:${String(adjustedEndMinutes % 60).padStart(2, "0")}`;

            endMinutes = adjustedEndMinutes;
          }

          return {
            id: Date.now() + index,
            title,
            date: dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            day: dateObj.getDate(),
            month: dateObj.getMonth(),
            year: dateObj.getFullYear(),
            start,
            end,
            startTime: start,
            endTime: end,
            startDate: `${dateObj.getFullYear()}-${String(
              dateObj.getMonth() + 1
            ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
            endDate: `${dateObj.getFullYear()}-${String(
              dateObj.getMonth() + 1
            ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
            location: location || "TBA",
            attendees: Number(attendees) || 0,
            status:
              rawStatus?.toLowerCase() === "published"
                ? ("Published" as const)
                : ("Saved" as const),
            color: "#2d4cc8",
          };
        })
        .filter((event): event is NonNullable<typeof event> => Boolean(event));

      // Remove duplicate rows inside the same CSV before any POST request.
      const uniqueParsed = parsed.filter((event, index, allEvents) => {
        const key =
          `${event.title}|${event.year}-${event.month}-${event.day}|${event.start}|${event.end}|${event.location}`.toLowerCase();

        return (
          allEvents.findIndex(
            (candidate) =>
              `${candidate.title}|${candidate.year}-${candidate.month}-${candidate.day}|${candidate.start}|${candidate.end}|${candidate.location}`.toLowerCase() ===
              key
          ) === index
        );
      });

      const token = window.localStorage.getItem("calendar_access_token");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      if (token) {
        // Read the database first. This keeps the existing duplicate-prevention
        // behavior: uploading the same CSV again will not create another copy.
        let existingBackendEvents: BackendEvent[] = [];

        try {
          const existingResponse = await fetch(`${apiUrl}/events`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (existingResponse.ok) {
            existingBackendEvents =
              (await existingResponse.json()) as BackendEvent[];
          }
        } catch (error) {
          console.error(
            "Failed to check existing backend events before bulk upload:",
            error
          );
        }

        const backendKey = (event: BackendEvent) => {
          const date = new Date(event.startDate);

          if (Number.isNaN(date.getTime())) {
            return "";
          }

          const dateValue = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

          return `${event.title}|${dateValue}|${
            event.startTime || ""
          }|${event.endTime || ""}|${event.location || "TBA"}`.toLowerCase();
        };

        const existingKeys = new Set(
          existingBackendEvents
            .map(backendKey)
            .filter(Boolean)
        );

        const savedBackendEvents: CalendarEvent[] = [];

        for (const event of uniqueParsed) {
          const dateValue =
            event.startDate ||
            `${event.year}-${String(event.month + 1).padStart(
              2,
              "0"
            )}-${String(event.day).padStart(2, "0")}`;

          const startTime = normalizeCsvTime(
            event.startTime || event.start,
            "10:00"
          );

          const endTime = normalizeCsvTime(
            event.endTime || event.end,
            "11:00"
          );

          const startDateIso = toBackendIso(dateValue, startTime);
          const endDateIso = toBackendIso(dateValue, endTime);

          // Never call toISOString() on an invalid Date.
          // Invalid rows are skipped without breaking the whole bulk upload.
          if (!startDateIso || !endDateIso) {
            console.error(
              "Skipped invalid bulk upload row:",
              event.title,
              dateValue,
              startTime,
              endTime
            );
            continue;
          }

          const eventKey =
            `${event.title}|${dateValue}|${startTime}|${endTime}|${event.location}`.toLowerCase();

          if (existingKeys.has(eventKey)) {
            continue;
          }

          try {
            const response = await fetch(`${apiUrl}/events`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: event.title,
                startDate: startDateIso,
                endDate: endDateIso,
                startTime,
                endTime,
                location: event.location,
                status:
                  event.status === "Published"
                    ? "PUBLISHED"
                    : "SAVED",
              }),
            });

            if (!response.ok) {
              console.error(
                "Failed to bulk upload backend event:",
                response.status,
                await response.text()
              );
              continue;
            }

            const saved = (await response.json()) as BackendEvent;

            // Use the backend response so the bulk-created item has backendId,
            // start/end dates and all fields required by the schedule panel.
            const mappedSavedEvent = backendEventToCalendarEvent(saved);

            savedBackendEvents.push(mappedSavedEvent);
            existingKeys.add(eventKey);
          } catch (error) {
            console.error(
              "Failed to bulk upload backend event:",
              error
            );
          }
        }

        if (savedBackendEvents.length) {
          setEvents((prev) =>
            saveEvents([...prev, ...savedBackendEvents])
          );

          const latestUploadedEvent =
            savedBackendEvents[savedBackendEvents.length - 1];

          if (latestUploadedEvent) {
            const uploadedDate = new Date(
              latestUploadedEvent.year,
              latestUploadedEvent.month,
              latestUploadedEvent.day
            );

            setScheduleDate(uploadedDate);
            setCurrentDate(
              new Date(
                latestUploadedEvent.year,
                latestUploadedEvent.month,
                1
              )
            );
            setSelectedDay(null);
            setScheduleTab("All");
            setStatus("All Status");
          }
        }
      } else {
        setEvents((prev) =>
          saveEvents([...prev, ...uniqueParsed])
        );

        const latestUploadedEvent =
          uniqueParsed[uniqueParsed.length - 1];

        if (latestUploadedEvent) {
          setScheduleDate(
            new Date(
              latestUploadedEvent.year,
              latestUploadedEvent.month,
              latestUploadedEvent.day
            )
          );
          setCurrentDate(
            new Date(
              latestUploadedEvent.year,
              latestUploadedEvent.month,
              1
            )
          );
          setSelectedDay(null);
          setScheduleTab("All");
          setStatus("All Status");
        }
      }

      setBulkOpen(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className={`superAdminPage calendarPage ${isStudentView ? "studentViewerPage" : ""} ${eventFormOpen || cancelEvent || reminderEvent || reminderSentEvent || publishEvent || autoPublishEvent ? "eventFormIsOpen" : ""}`}>
      <div className="dashboardLayout">
        <Sidebar />
        <div className="mainContent">
          <Header />
          <main className="calendarManagementContent calendarResponsiveContent">
            <section className="calendarTopRow">
              <div className="calendarTitleBlock">
                <div className="calendarTitleIcon">
                  <Image
                    src={calendarTitleIconSrc}
                    alt=""
                    aria-hidden="true"
                    width={40}
                    height={40}
                  />
                </div>

                <div className="calendarTitleText">
                  <h1>
                    <span className="desktopCalendarTitle">
                      {calendarPageTitle}
                    </span>
                    <span className="mobileCalendarTitle">Calendar Management</span>
                  </h1>

                  <p className="desktopCalendarSubtitle">
                    {calendarPageSubtitle}
                  </p>

                  <p className="mobileCalendarTenant">
                    <span className="mobileTenantDot" aria-hidden="true" />
                    {studentTenant !== "All Tenants"
                      ? studentTenant
                      : tenant !== "All Tenants"
                        ? tenant
                        : login?.displayRole || "All Tenants"}
                  </p>
                </div>
              </div>

              <div className={`calendarActions ${isStudentView ? "studentCalendarActions" : ""}`}>
                {isStudentView ? (
                  <button
                    type="button"
                    className="neoButton studentExportButton"
                    onClick={() => {
                      setExportMessage("");
                      setExportDropdown(null);
                      setExportOpen(true);
                    }}
                    aria-label="Export Calendar"
                  >
                    <span className="studentExportButtonContent">
                      <Image
                        src={studentExportIconSrc}
                        alt=""
                        width={18}
                        height={18}
                        className="studentExportIcon"
                        aria-hidden="true"
                      />
                      <span className="studentExportButtonText">Export Calendar</span>
                    </span>
                  </button>
                ) : (
                  <>
                    <div className="bulkUploadWrap">
                      <button className="neoButton" onClick={() => setBulkOpen(v => !v)}>
                        <Icon src={icons.bulkUpload} /> <span>Bulk Upload</span>
                      </button>
                      {bulkOpen && (
                        <div className="bulkMenu">
                          <button onClick={downloadTemplate}><Icon src={icons.download} /> Download Template</button>
                          <button onClick={() => fileInputRef.current?.click()}><Icon src={icons.uploadFile} /> Choose File</button>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={uploadCsv} />
                    </div>
                    <button
                      className="neoButton"
                      onClick={() => {
                        setExportMessage("");
                        setExportDropdown(null);
                        setExportOpen(true);
                      }}
                    >
                      <Icon src={icons.export} /> <span>Export</span>
                    </button>
                    <button className="neoButton addEventButton" onClick={handleAddEvent}>
                      <Icon src={icons.add} /> <span>Add Event</span>
                    </button>
                  </>
                )}
              </div>
            </section>

            {!hideCalendarFilters && (
            <section
              className={`calendarFilters ${
                isTenantScopedRole ? "tenantScopedFilters" : ""
              } ${mobileFiltersOpen ? "mobileFiltersOpen" : ""}`}
            >
              {showTenantFilter ? (
                <FilterDropdown
                  label="Tenant"
                  value={tenant}
                  options={tenants}
                  open={openFilter === "tenant"}
                  onToggle={() => setOpenFilter(openFilter === "tenant" ? null : "tenant")}
                  onSelect={(value) => {
                    setTenant(value);
                    setRole("All Roles");
                    setStatus("All Status");
                    setDepartment("All Departments");
                    setSelectedDepartmentDivision("");
                    setOpenFilter(null);
                  }}
                />
              ) : isTenantScopedRole ? (
                <>
                  <CheckboxFilterDropdown
                    label="Division"
                    value={selectedDepartmentDivision}
                    options={availableDivisionOptions}
                    open={openFilter === "division"}
                    className="divisionFilterDropdown"
                    onToggle={() =>
                      setOpenFilter(
                        openFilter === "division" ? null : "division"
                      )
                    }
                    onSelect={(value) => {
                      setSelectedDepartmentDivision(value);
                      setDepartment("All Departments");

                      // Immediately open only the Department list that belongs
                      // to the selected Division. No Next / Back control.
                      setOpenFilter("department");
                    }}
                  />

                  <CheckboxFilterDropdown
                    label="Department"
                    value={
                      department === "All Departments"
                        ? ""
                        : department
                    }
                    options={availableDepartmentOptions}
                    open={openFilter === "department"}
                    disabled={!selectedDepartmentDivision}
                    className="departmentFilterDropdown"
                    onToggle={() =>
                      setOpenFilter(
                        openFilter === "department" ? null : "department"
                      )
                    }
                    onSelect={(value) => {
                      setDepartment(value);
                      setOpenFilter(null);
                    }}
                  />
                </>
              ) : null}

              <FilterDropdown
                label="Role"
                value={role}
                options={availableRoleOptions}
                open={openFilter === "role"}
                onToggle={() => setOpenFilter(openFilter === "role" ? null : "role")}
                onSelect={(value) => {
                  setRole(value);
                  setOpenFilter(null);
                }}
              />

              <FilterDropdown
                label="Status"
                value={status}
                options={availableStatusOptions}
                open={openFilter === "status"}
                onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")}
                onSelect={(value) => {
                  setStatus(value);
                  setOpenFilter(null);
                }}
              />

              <button className="neoButton clearButton" onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}>Clear</button>
            </section>
            )}

            <section className={`calendarWorkspace ${isStudentView ? "studentCalendarWorkspace" : ""} ${view === "week" ? "weekImageLayout" : view === "day" ? "dayImageLayout" : ""}`}>
              <div className="calendarPanel">
                <div className="mobileMonthHeadingRow">
                  <h2>{view === "week" ? weekTitle : view === "day" ? dayTitle : monthName}</h2>

                  {!isStudentView && (
                    <div className="mobileMonthHeadingActions">
                      <button
                        type="button"
                        className="mobileMonthHeadingButton"
                        aria-label="Add event"
                        onClick={handleAddEvent}
                      >
                        <Icon src={icons.add} />
                      </button>

                      {!hideCalendarFilters && (
                        <button
                          type="button"
                          className={`mobileMonthHeadingButton ${mobileFiltersOpen ? "active" : ""}`}
                          aria-label="Calendar filters"
                          aria-expanded={mobileFiltersOpen}
                          onClick={() => {
                            setMobileFiltersOpen((previous) => !previous);
                            setOpenFilter(null);
                          }}
                        >
                          <Icon src={icons.more} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="calendarToolbar">
                  <div className="viewSwitch">
                    {(["month", "week", "day"] as CalendarView[]).map(item => (
                      <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>
                        {item[0].toUpperCase() + item.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="calendarNav">
                    <button className="todayButton" onClick={() => {
                      if (view === "week") {
                        setWeekDate(new Date(2026, 8, 13));
                      } else if (view === "day") {
                        setDayDate(new Date(2026, 8, 19));
                      } else {
                        setCurrentDate(new Date(2026, 8, 1));
                        setSelectedDay(null);
                      }
                    }}>
                      <span className="desktopTodayLabel">Today</span>
                      <span className="mobileDayLabel">Day</span>
                    </button>
                    <button
                      className="circleButton"
                      aria-label={view === "week" ? "Previous week" : view === "day" ? "Previous day" : "Previous month"}
                      onClick={() => view === "week" ? moveWeek(-1) : view === "day" ? moveDay(-1) : moveMonth(-1)}
                    >
                      <Icon src={icons.chevronLeft} />
                    </button>
                    <button
                      className="circleButton"
                      aria-label={view === "week" ? "Next week" : view === "day" ? "Next day" : "Next month"}
                      onClick={() => view === "week" ? moveWeek(1) : view === "day" ? moveDay(1) : moveMonth(1)}
                    >
                      <Icon src={icons.chevronRight} />
                    </button>
                  </div>
                </div>

                {view === "month" ? (
                  <div className="monthGrid">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div className="weekday" key={d}>{d}</div>)}
                    {monthCells.map((cell, index) => {
                      const dayEvents = events.filter(e =>
                        e.day === cell.date.getDate() &&
                        e.month === cell.date.getMonth() &&
                        e.year === cell.date.getFullYear()
                      );

                      const openedEventRange = dayPopup
                        ? getCalendarEventDateRange(dayPopup.event)
                        : null;

                      const cellDateOnly = new Date(
                        cell.date.getFullYear(),
                        cell.date.getMonth(),
                        cell.date.getDate()
                      );

                      const isInOpenedEventRange =
                        !!openedEventRange &&
                        cell.current &&
                        cellDateOnly.getTime() >= openedEventRange.start.getTime() &&
                        cellDateOnly.getTime() <= openedEventRange.end.getTime();

                      return (
                        <div
                          className={`dayCell ${!cell.current ? "outside" : ""} ${selectedDay === cell.day && cell.current ? "selected" : ""} ${isInOpenedEventRange ? "eventRangeHighlighted" : ""}`}
                          key={`${cell.date.toISOString()}-${index}`}
                          role={cell.current ? "button" : undefined}
                          tabIndex={cell.current ? 0 : -1}
                          onClick={() => { if (cell.current) { setDayPopup(null); setDayEventList(null); setSelectedDay(selectedDay === cell.day ? null : cell.day); } }}
                          onKeyDown={(ev) => {
                            if (!cell.current) return;
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              setDayPopup(null);
                              setDayEventList(null);
                              setSelectedDay(selectedDay === cell.day ? null : cell.day);
                            }
                          }}
                        >
                          <span className="dayNumber">{String(cell.day).padStart(2, "0")}</span>
                          {!!dayEvents.length && (
                            <span
                              className="dayEvents"
                              onMouseEnter={() => {
                                setDayPopup(null);
                                setDayEventList({ day: cell.day, events: dayEvents });
                              }}
                              onFocus={() => {
                                setDayPopup(null);
                                setDayEventList({ day: cell.day, events: dayEvents });
                              }}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setDayPopup(null);
                                setDayEventList({ day: cell.day, events: dayEvents });
                              }}
                            >
                              {dayEvents.slice(0, 3).map((event) => (
                                <i
                                  key={event.id}
                                  className="calendarEventDot"
                                  style={{ background: event.color }}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Show events for ${cell.date.toLocaleDateString("en-US")}`}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <b
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Show all ${dayEvents.length} events`}
                                >
                                  +{dayEvents.length - 3}
                                </b>
                              )}
                            </span>
                          )}

                          {cell.current && !isStudentView && (
                            <span
                              className="dayPlus dayPlusHover"
                              role="button"
                              tabIndex={0}
                              aria-label={`Add event for ${cell.date.toLocaleDateString("en-US")}`}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                handleAddEventForDate(cell.date);
                              }}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                  ev.preventDefault();
                                  ev.stopPropagation();
                                  handleAddEventForDate(cell.date);
                                }
                              }}
                            >
                              +
                            </span>
                          )}

                          {dayEventList?.day === cell.day && cell.current && !dayPopup && (
                            <span
                              className="calendarDayEventList"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <span className="calendarDayEventListHeading">
                                {dayEventList.events.length} {dayEventList.events.length === 1 ? "Event" : "Events"}
                              </span>
                              <span className="calendarDayEventListItems">
                                {dayEventList.events.map((event) => (
                                  <span
                                    key={event.id}
                                    className="calendarDayEventListItem"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setDayEventList(null);
                                      setDayPopup({ day: cell.day, event });
                                    }}
                                    onKeyDown={(ev) => {
                                      if (ev.key === "Enter" || ev.key === " ") {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        setDayEventList(null);
                                        setDayPopup({ day: cell.day, event });
                                      }
                                    }}
                                  >
                                    <i style={{ background: event.color }} />
                                    <span className="calendarDayEventListText">
                                      <strong>{event.eventTitle || event.title}</strong>
                                      <small>{event.startTime || event.start}{(event.endTime || event.end) ? ` - ${event.endTime || event.end}` : ""}</small>
                                    </span>
                                  </span>
                                ))}
                              </span>
                            </span>
                          )}

                          {dayPopup?.day === cell.day && cell.current && (
                            <span className="calendarDayPopup" onClick={(ev) => ev.stopPropagation()}>
                              <span className="calendarDayPopupTitle">
                                <i style={{ background: dayPopup.event.color }} />
                                <strong>{dayPopup.event.title}</strong>
                              </span>
                              <span className="calendarDayPopupMeta">
                                <Icon src={icons.calendar} size={14} />
                                <span>{dayPopup.event.date} {dayPopup.event.start}-{dayPopup.event.end}</span>
                              </span>
                              <span className="calendarDayPopupMeta">
                                <Icon src={icons.location} size={14} />
                                <span>{dayPopup.event.location}</span>
                              </span>
                              <span className="calendarDayPopupMeta">
                                <Icon src={icons.attendees} size={14} />
                                <span>{dayPopup.event.attendees} Attendees</span>
                              </span>

                              {!isStudentView && (
                                <span className="calendarDayPopupMenuWrap">
                                  <span
                                    className="calendarDayPopupMore"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`More actions for ${dayPopup.event.title}`}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (openMenu === dayPopup.event.id && openMenuSource === "calendar") {
                                        setOpenMenu(null);
                                        setOpenMenuSource(null);
                                      } else {
                                        setOpenMenu(dayPopup.event.id);
                                        setOpenMenuSource("calendar");
                                      }
                                    }}
                                    onKeyDown={(ev) => {
                                      if (ev.key === "Enter" || ev.key === " ") {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        if (openMenu === dayPopup.event.id && openMenuSource === "calendar") {
                                          setOpenMenu(null);
                                          setOpenMenuSource(null);
                                        } else {
                                          setOpenMenu(dayPopup.event.id);
                                          setOpenMenuSource("calendar");
                                        }
                                      }
                                    }}
                                  >
                                    <Icon src={icons.more} size={16} />
                                  </span>

                                  {openMenu === dayPopup.event.id && openMenuSource === "calendar" && (
                                    <span className="calendarDayPopupActions">
                                      <button
                                        type="button"
                                        className="eventMenuAction eventMenuActionActive"
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          setDayPopup(null);
                                          openEventForm(dayPopup.event, "edit");
                                        }}
                                      >
                                        <span className="eventMenuCheck" aria-hidden="true"><span>✓</span></span>
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="eventMenuAction"
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          setDayPopup(null);
                                          openEventForm(dayPopup.event, "reuse");
                                        }}
                                      >
                                        <span className="eventMenuCheck" aria-hidden="true" />
                                        <span>Reuse</span>
                                      </button>

                                      {dayPopup.event.status === "Published" && (
                                        <>
                                          <button
                                            type="button"
                                            className="eventMenuAction"
                                            onClick={(ev) => {
                                              ev.stopPropagation();
                                              setDayPopup(null);
                                              openReminderModal(dayPopup.event);
                                            }}
                                          >
                                            <span className="eventMenuCheck" aria-hidden="true" />
                                            <span>Send Reminder</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="eventMenuAction"
                                            onClick={(ev) => {
                                              ev.stopPropagation();
                                              setDayPopup(null);
                                              toggleEventPause(dayPopup.event);
                                            }}
                                          >
                                            <span className="eventMenuCheck" aria-hidden="true" />
                                            <span>Pause</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="eventMenuAction"
                                            onClick={(ev) => {
                                              ev.stopPropagation();
                                              setDayPopup(null);
                                              openCancelEventModal(dayPopup.event);
                                            }}
                                          >
                                            <span className="eventMenuCheck" aria-hidden="true" />
                                            <span>Cancel</span>
                                          </button>
                                        </>
                                      )}

                                      {dayPopup.event.status === "Paused" && (
                                        <button
                                          type="button"
                                          className="eventMenuAction"
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            setDayPopup(null);
                                            toggleEventPause(dayPopup.event);
                                          }}
                                        >
                                          <span className="eventMenuCheck" aria-hidden="true" />
                                          <span>Resume</span>
                                        </button>
                                      )}

                                      {(dayPopup.event.status === "Saved" || dayPopup.event.status === "Scheduled" || dayPopup.event.status === "Published") && (
                                        <button
                                          type="button"
                                          className="eventMenuAction"
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            setDayPopup(null);
                                            openPublishModal(dayPopup.event);
                                          }}
                                        >
                                          <span className="eventMenuCheck" aria-hidden="true" />
                                          <span>Publish</span>
                                        </button>
                                      )}

                                      {(dayPopup.event.status === "Saved" || dayPopup.event.status === "Closed") && (
                                        <button
                                          type="button"
                                          className="eventMenuAction"
                                          onClick={async (ev) => {
                                            ev.stopPropagation();

                                            const deleted = await deleteBackendEvent(dayPopup.event);
                                            if (!deleted) return;

                                            setEvents((prev) => {
                                              const nextEvents = prev.filter(
                                                (e) => e.id !== dayPopup.event.id
                                              );
                                              return saveEvents(nextEvents);
                                            });

                                            setOpenMenu(null);
                                            setDayPopup(null);
                                          }}
                                        >
                                          <span className="eventMenuCheck" aria-hidden="true" />
                                          <span>Delete</span>
                                        </button>
                                      )}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : view === "week" ? (
                  <div className="weekCalendarView">
                    <div className="weekCalendarGrid">
                      <div className="weekCalendarHeader weekCalendarCorner">Week</div>

                      {weekDays.map((date, index) => (
                        <div
                          className={`weekCalendarHeader weekCalendarHeaderDay weekCalendarHeaderDay${index}`}
                          key={`week-header-${date.toISOString()}`}
                        >
                          {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                          {date.getMonth() + 1}/{date.getDate()}
                        </div>
                      ))}

                      <div className="weekCalendarTime">All- Day</div>

                      {weekDays.map((date) => (
                        <div
                          className="weekCalendarCell"
                          key={`week-all-day-${date.toISOString()}`}
                        />
                      ))}

                      {weekHours.map((hour) => (
                        <div className="weekCalendarRow" key={`week-hour-${hour}`}>
                          <div className="weekCalendarTime">
                            {formatWeekHour(hour)}
                          </div>

                          {weekDays.map((date) => {
                            const cellEvents = visibleEvents.filter(
                              (event) =>
                                event.year === date.getFullYear() &&
                                event.month === date.getMonth() &&
                                event.day === date.getDate() &&
                                getWeekEventHour(event) === hour
                            );

                            return (
                              <div
                                className="weekCalendarCell"
                                key={`${date.toISOString()}-${hour}`}
                              >
                                {cellEvents.map((event) => (
                                  <div
                                    className="weekCalendarEvent"
                                    key={event.id}
                                    title={`${event.title} · ${event.start} - ${event.end}`}
                                  >
                                    <i style={{ background: event.color }} />
                                    <span>{event.title}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="dayCalendarView">
                    <div className="dayCalendarGrid">
                      <div className="dayCalendarHeader">{dayName}</div>

                      <div className="dayCalendarTime">All- Day</div>
                      <div className="dayCalendarCell" />

                      {weekHours.map((hour) => (
                        <div className="dayCalendarRow" key={`day-hour-${hour}`}>
                          <div className="dayCalendarTime">{formatWeekHour(hour)}</div>

                          <div className="dayCalendarCell">
                            {dayEventsForHour(hour).map((event) => (
                              <div
                                className="dayCalendarEvent"
                                key={event.id}
                                title={`${event.title} · ${event.start} - ${event.end}`}
                              >
                                <i style={{ background: event.color }} />
                                <span>{event.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className={`schedulePanel ${view === "week" ? "weekSchedulePanelHidden" : view === "day" ? "daySchedulePanelHidden" : ""}`}>
                <div
                  className={`scheduleTabs ${
                    isStudentView
                      ? "studentScheduleTabs"
                      : canReceiveAssignedSchedules
                        ? "scheduleTabsWithMySchedules"
                        : ""
                  }`}
                >
                  {isStudentView ? (
                    <button
                      type="button"
                      className="active"
                      onClick={() => setScheduleTab("All")}
                    >
                      My Schedules
                    </button>
                  ) : (
                    (canReceiveAssignedSchedules
                      ? (["All", "Published", "Saved", "My Events"] as const)
                      : (["All", "Published", "Saved"] as const)
                    ).map(tab => (
                      <button
                        key={tab}
                        className={scheduleTab === tab ? "active" : ""}
                        onClick={() => setScheduleTab(tab)}
                      >
                        {tab}
                      </button>
                    ))
                  )}
                </div>
                <div className="scheduleDateRow">
                  <button
                    type="button"
                    aria-label="Previous day"
                    onClick={() => moveScheduleDate(-1)}
                  >
                    <Icon src={icons.chevronLeft} size={20} />
                  </button>
                  <span>
                    {visibleEvents.length} {visibleEvents.length === 1 ? "Event" : "Events"}
                    &nbsp; | &nbsp;
                    {scheduleDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    aria-label="Next day"
                    onClick={() => moveScheduleDate(1)}
                  >
                    <Icon src={icons.chevronRight} size={20} />
                  </button>
                </div>

                <div
                  className={`eventScroll ${openMenu !== null && openMenuSource === "schedule" ? "eventMenuOpen" : ""}`}
                  onTouchStart={(event) => {
                    mobileEventTouchStartX.current = event.touches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event) => {
                    const startX = mobileEventTouchStartX.current;
                    const endX = event.changedTouches[0]?.clientX;
                    mobileEventTouchStartX.current = null;

                    if (startX === null || endX === undefined) return;

                    const distance = endX - startX;
                    if (Math.abs(distance) < 45) return;

                    setOpenMenu(null);
                    setMobileEventIndex((currentIndex) =>
                      distance < 0
                        ? Math.min(currentIndex + 1, visibleEvents.length - 1)
                        : Math.max(currentIndex - 1, 0)
                    );
                  }}
                >
                  {visibleEvents.length ? visibleEvents.map((event, index) => (
                    <article
                      className={`eventCard ${index === mobileEventIndex ? "mobileActiveEventCard" : ""} ${
                        !isStudentView && scheduleTab === "My Events"
                          ? "receivedScheduleCard"
                          : ""
                      }`}
                      key={event.id}
                    >
                      {!isStudentView && scheduleTab !== "My Events" && <span className={`statusBadge ${event.status.toLowerCase()}`}>{event.status}</span>}

                      {(() => {
                        // Schedule card uses the exact values saved by Add / Edit / Reuse.
                        // Do not substitute placeholder location/attendee values for form fields.
                        const cardTitle = (event.eventTitle || event.title || "").trim();
                        const cardSubtitle = (event.eventSubtitle || event.subtitle || "").trim();
                        const cardStartDate = (event.startDate || event.date || "").trim();
                        const cardEndDate = (event.endDate || "").trim();
                        const cardStartTime = (event.startTime || event.start || "").trim();
                        const cardEndTime = (event.endTime || event.end || "").trim();
                        const cardPriority = (event.priority || "").trim();
                        const cardDescription = (event.description || "").trim();
                        const cardAttachment = (event.attachment || "").trim();
                        const parsedCardAttachment = parseStoredAttachment(cardAttachment);
                        const cardAttachmentName = parsedCardAttachment.originalName;
                        const isReceivedSchedule =
                          isStudentView || scheduleTab === "My Events";

                        const sameDate =
                          cardStartDate &&
                          cardEndDate &&
                          cardStartDate.toLowerCase() === cardEndDate.toLowerCase();

                        const dateText = sameDate
                          ? cardStartDate
                          : [cardStartDate, cardEndDate].filter(Boolean).join(" - ");

                        const isPlaceholderTime = (value: string) =>
                          ["", "00:00", "00:00 am", "00:00 pm"].includes(value.toLowerCase());

                        const timeText =
                          !isPlaceholderTime(cardStartTime) || !isPlaceholderTime(cardEndTime)
                            ? [cardStartTime, cardEndTime]
                                .filter((value) => !isPlaceholderTime(value))
                                .join(" - ")
                            : "";

                        return (
                          <div className="scheduleCardContent">
                            {cardTitle && (
                              <div
                                className={`eventTitle ${
                                  cardTitle.length > 27 ? "eventTitleMultiLine" : ""
                                } scheduleEventTitleWithStatusGap`}
                              >
                                <i style={{ background: event.color }} />

                                <span className="scheduleTitleLine">
                                  <strong>{cardTitle}</strong>

                                  {(isStudentView || scheduleTab === "My Events") && event.createdBy && (
                                    <span className="studentEventCreator">
                                      {" - "}{eventCreatorLabel(event.createdBy)}
                                    </span>
                                  )}

                                  {event.reminderSentAt && (
                                    <span
                                      className="scheduleReminderFlag"
                                      title={`Reminder sent ${new Date(
                                        event.reminderSentAt
                                      ).toLocaleString("en-US")}`}
                                    >
                                      <span
                                        className="scheduleReminderFlagIcon"
                                        aria-hidden="true"
                                      >
                                        ⚑
                                      </span>
                                      <span>Reminder Sent</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}

                            {cardSubtitle && (
                              <div className="scheduleCardSubtitle">{cardSubtitle}</div>
                            )}

                            {dateText && (
                              <div className="eventMeta scheduleCardDateTime scheduleCardDateRow">
                                <Icon src={icons.calendar} size={16} />
                                <span className="scheduleCardDate">{dateText}</span>
                              </div>
                            )}

                            {timeText && (
                              <div className="eventMeta scheduleCardDateTime scheduleCardTimeRow">
                                <Icon src={icons.alarm} size={16} />
                                <span className="scheduleCardTime">{timeText}</span>
                              </div>
                            )}

                            {cardPriority && (
                              <div className="scheduleCardField">
                                <span className="scheduleCardFieldLabel">Priority</span>
                                <span>{cardPriority}</span>
                              </div>
                            )}

                            {cardDescription && (
                              <div className="scheduleCardDescription">{cardDescription}</div>
                            )}

                            {cardAttachment && (
                              <div className={`scheduleCardAttachment ${isReceivedSchedule ? "studentScheduleCardAttachment" : ""}`}>
                                <span className="scheduleCardFieldLabel">Attachment</span>
                                <span className="scheduleCardAttachmentName">{cardAttachmentName}</span>

                                {isReceivedSchedule && (
                                  <button
                                    type="button"
                                    className="studentAttachmentDownload"
                                    onClick={() => void downloadEventAttachment(cardAttachment)}
                                    aria-label={`Download ${cardAttachmentName}`}
                                    title="Download attachment"
                                  >
                                    <Icon src={icons.download} size={15} />
                                    <span>Download</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {!isStudentView && scheduleTab !== "My Events" && (
                        <div className="eventMenuWrap">
                          <button
                            type="button"
                            className="moreButton"
                            aria-label="Event actions"
                            onClick={() => {
                              if (openMenu === event.id && openMenuSource === "schedule") {
                                setOpenMenu(null);
                                setOpenMenuSource(null);
                              } else {
                                setOpenMenu(event.id);
                                setOpenMenuSource("schedule");
                              }
                            }}
                          >
                            <Icon src={icons.more} size={18} />
                          </button>

                          {openMenu === event.id && openMenuSource === "schedule" && (
                            <div className="eventMenu">
                              <button type="button" className="eventMenuAction eventMenuActionActive" onClick={() => openEventForm(event, "edit")}><span className="eventMenuCheck" aria-hidden="true"><span>✓</span></span><span>Edit</span></button>
                              <button type="button" className="eventMenuAction" onClick={() => openEventForm(event, "reuse")}><span className="eventMenuCheck" aria-hidden="true" /><span>Reuse</span></button>

                              {event.status === "Published" && (
                                <>
                                  <button type="button" className="eventMenuAction" onClick={() => openReminderModal(event)}>
                                    <span className="eventMenuCheck" aria-hidden="true" />
                                    <span>Send Reminder</span>
                                  </button>

                                  <button type="button" className="eventMenuAction" onClick={() => toggleEventPause(event)}>
                                    <span className="eventMenuCheck" aria-hidden="true" />
                                    <span>Pause</span>
                                  </button>
                                </>
                              )}

                              {event.status === "Paused" && (
                                <button type="button" className="eventMenuAction" onClick={() => toggleEventPause(event)}>
                                  <span className="eventMenuCheck" aria-hidden="true" />
                                  <span>Resume</span>
                                </button>
                              )}

                              {(event.status === "Saved" || event.status === "Scheduled" || event.status === "Published") && (
                                <button type="button" className="eventMenuAction" onClick={() => openPublishModal(event)}>
                                  <span className="eventMenuCheck" aria-hidden="true" />
                                  <span>Publish</span>
                                </button>
                              )}

                              {(event.status === "Saved" || event.status === "Closed") && (
                                <button
                                  type="button"
                                  className="eventMenuAction"
                                  onClick={async () => {
                                    const deleted = await deleteBackendEvent(event);
                                    if (!deleted) return;

                                    setEvents((prev) => {
                                      const nextEvents = prev.filter(
                                        (e) => e.id !== event.id
                                      );
                                      return saveEvents(nextEvents);
                                    });

                                    setOpenMenu(null);
                                  }}
                                >
                                  <span className="eventMenuCheck" aria-hidden="true" />
                                  <span>Delete</span>
                                </button>
                              )}

                              {event.status === "Published" && (
                                <button
                                  type="button"
                                  className="eventMenuAction"
                                  onClick={() => openCancelEventModal(event)}
                                >
                                  <span className="eventMenuCheck" aria-hidden="true" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )) : (
                    <div className="emptySchedule">No events found.</div>
                  )}
                </div>

                {visibleEvents.length > 0 && (
                  <div className="mobileScheduleCardNav" aria-label="Schedule event navigation">
                    <button
                      type="button"
                      aria-label="Previous event"
                      disabled={mobileEventIndex === 0}
                      onClick={() => {
                        setOpenMenu(null);
                        setMobileEventIndex((currentIndex) => Math.max(currentIndex - 1, 0));
                      }}
                    >
                      <Icon src={icons.chevronLeft} size={18} />
                    </button>

                    <button
                      type="button"
                      aria-label="Next event"
                      disabled={mobileEventIndex >= visibleEvents.length - 1}
                      onClick={() => {
                        setOpenMenu(null);
                        setMobileEventIndex((currentIndex) =>
                          Math.min(currentIndex + 1, visibleEvents.length - 1)
                        );
                      }}
                    >
                      <Icon src={icons.chevronRight} size={18} />
                    </button>
                  </div>
                )}
              </aside>
            </section>

            {!isStudentView && (
            <button
              type="button"
              className="mobileBottomAddEvent"
              onClick={handleAddEvent}
            >
              <Icon src={icons.add} />
              <span>Add Event</span>
            </button>
            )}
          </main>

          {cancelEvent && (
            <BodyPortal>
              <div
                className="cmCancelEventOverlay"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeCancelEventModal();
                }}
              >
                <section
                  className="cmCancelEventModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="cancel-event-title"
                >
                  <div className="cmCancelEventHeader">
                    <h2 id="cancel-event-title">Cancel Published Event</h2>
                    <button
                      type="button"
                      className="cmCancelEventClose"
                      aria-label="Close cancel event popup"
                      onClick={closeCancelEventModal}
                    >
                      ×
                    </button>
                  </div>

                  {/* <p className="cmCancelEventPrompt">
                    This event is already published. Cancelling it will mark the event as closed for the selected users.
                  </p> */}

                  <div className="cmCancelEventInfo">
                    <p><strong>Event :</strong> {cancelEvent.eventTitle || cancelEvent.title}</p>
                    <p><strong>Date :</strong> {cancelEvent.startDate || cancelEvent.date}</p>
                    <p><strong>Time :</strong> {[cancelEvent.startTime || cancelEvent.start, cancelEvent.endTime || cancelEvent.end].filter(Boolean).join(" - ")}</p>
                    <p><strong>Audience :</strong> {cancelEvent.audience || cancelEvent.role || cancelEvent.tenant || "Selected audience"}</p>
                  </div>

                  <label className="cmCancelEventReasonLabel" htmlFor="cancel-event-reason">
                    CANCELLATION MESSAGE
                  </label>
                  <textarea
                    id="cancel-event-reason"
                    className="cmCancelEventReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter the message users should receive about this cancellation"
                  />

                  {/* <p className="cmCancelEventNotice">
                    Users who can view this event will see it as Closed. This message can be connected to your notification API later for in-app, email or push notification delivery.
                  </p> */}

                  <div className="cmCancelEventActions">
                    <button type="button" className="cmCancelEventBack" onClick={closeCancelEventModal}>
                      Keep Event
                    </button>
                    <button type="button" className="cmCancelEventConfirm" onClick={confirmCancelPublishedEvent}>
                      Cancel Event
                    </button>
                  </div>
                </section>
              </div>
            </BodyPortal>
          )}

          {reminderEvent && (
            <BodyPortal>
              <div
                className="cmReminderOverlay"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeReminderModal();
                }}
              >
                <section
                  className="cmReminderModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reminder-modal-title"
                >
                  <div className="cmReminderHeader">
                    <h2 id="reminder-modal-title">Send Reminder</h2>

                    <button
                      type="button"
                      className="cmReminderClose"
                      aria-label="Close reminder"
                      onClick={closeReminderModal}
                    >
                      ×
                    </button>
                  </div>

                  <p className="cmReminderPrompt">
                    Send reminder to selected audience?
                  </p>

                  <div className="cmReminderInfo">
                    <p>
                      <strong>Date :</strong>{" "}
                      {formatReminderDate(reminderEvent)}
                    </p>
                    <p>
                      <strong>Time :</strong>{" "}
                      {reminderEvent.start} - {reminderEvent.end}
                    </p>
                    <p>
                      <strong>Audience :</strong>{" "}
                      {getReminderAudience(reminderEvent)}
                    </p>
                  </div>

                  <div className="cmReminderDescriptionHeader">
                    <label htmlFor="reminder-description">
                      DESCRIPTION
                    </label>
                    <span>{reminderDescription.length}/250</span>
                  </div>

                  <textarea
                    id="reminder-description"
                    className="cmReminderTextarea"
                    value={reminderDescription}
                    maxLength={250}
                    placeholder="Type your Details here....."
                    onChange={(e) => setReminderDescription(e.target.value)}
                  />

                  <div className="cmReminderActions">
                    <button
                      type="button"
                      className="cmReminderCancel"
                      onClick={closeReminderModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="cmReminderSend"
                      onClick={sendReminder}
                    >
                      Send Reminder
                    </button>
                  </div>
                </section>
              </div>
            </BodyPortal>
          )}

          {reminderSentEvent && (
            <BodyPortal>
              <div
                className="cmReminderSentOverlay"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeReminderSentPopup();
                }}
              >
                <section
                  className="cmReminderSentModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reminder-sent-title"
                >
                  <button
                    type="button"
                    className="cmReminderSentClose"
                    aria-label="Close reminder sent popup"
                    onClick={closeReminderSentPopup}
                  >
                    ×
                  </button>

                  <div className="cmReminderSentIcon" aria-hidden="true">
                    <span>✓</span>
                  </div>

                  <h2 id="reminder-sent-title">Reminder Sent Successfully</h2>

                  <p className="cmReminderSentMessage">
                    Reminder for <strong>{reminderSentEvent.title}</strong> has been sent
                    to the selected audience.
                  </p>

                  <div className="cmReminderSentDetails">
                    <p>
                      <strong>Date :</strong>{" "}
                      {formatReminderDate(reminderSentEvent)}
                    </p>
                    <p>
                      <strong>Time :</strong>{" "}
                      {reminderSentEvent.start} - {reminderSentEvent.end}
                    </p>
                    <p>
                      <strong>Audience :</strong>{" "}
                      {getReminderAudience(reminderSentEvent)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="cmReminderSentDone"
                    onClick={closeReminderSentPopup}
                  >
                    Done
                  </button>
                </section>
              </div>
            </BodyPortal>
          )}

          {publishEvent && (
            <BodyPortal>
              <div
                className="publishModalOverlay"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    closePublishModal();
                  }
                }}
              >
                <section
                  className="publishModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="publish-event-title"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className="publishModalHeader">
                    <h2 id="publish-event-title">Publish Event</h2>

                    <button
                      type="button"
                      className="publishModalClose"
                      aria-label="Close Publish Event"
                      onClick={closePublishModal}
                    >
                      ×
                    </button>
                  </div>

                  <div className="publishField">
                    <label htmlFor="publish-organizer">ORGANIZER</label>
                    <input
                      id="publish-organizer"
                      type="text"
                      value={publishOrganizer}
                      placeholder="Enter Organizer"
                      onChange={(event) => {
                        setPublishError("");
                        setPublishOrganizer(event.target.value);
                      }}
                    />
                  </div>

                  <div className="publishField">
                    <label>AUDIENCE</label>

                    <div
                      className={`publishDropdown ${
                        publishAudienceOpen ? "open" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="publishDropdownControl"
                        aria-haspopup="listbox"
                        aria-expanded={publishAudienceOpen}
                        onClick={() => {
                          setPublishAudienceOpen((previous) => !previous);
                          setPublishFlyout(null);
                        }}
                      >
                        {publishAudienceType === "Default" &&
                        !publishTenant &&
                        publishTargets.length === 0 ? (
                          <span>
                            {publishAudienceOpen ? "Select" : "Select"}
                          </span>
                        ) : (
                          <span className="publishAudienceValue">
                            {publishAudienceType === "Default" && (
                              <span>Default</span>
                            )}
                            {publishTenant && <span>{publishTenant}</span>}
                            {publishTargets.map((item, index) => (
                              <span
                                className="publishAudiencePair"
                                key={`${item.tenant}-${item.actor}-${index}`}
                              >
                                {item.tenant} - {getPublishActorLabel(item.tenant, item.actor)}
                              </span>
                            ))}
                            {publishTargets.length === 0 &&
                              publishAudienceType === "Specific Actor" && (
                                <span>Specific Actor</span>
                              )}
                          </span>
                        )}

                        <span className="publishChevron" aria-hidden="true" />
                      </button>

                      {publishAudienceOpen && (
                        <div
                          className="publishDropdownMenu"
                          role="listbox"
                          aria-label="Audience"
                        >
                          {(
                            isTenantScopedPublisher
                              ? (["Default", "Specific Actor"] as const)
                              : ([
                                  "Default",
                                  "Specific Tenant",
                                  "Specific Actor",
                                ] as const)
                          ).map((option) => {
                            const selected =
                              publishAudienceType === option &&
                              (option === "Default" ||
                                (option === "Specific Tenant" &&
                                  Boolean(publishTenant)) ||
                                (option === "Specific Actor" &&
                                  publishTargets.length > 0));

                            return (
                              <button
                                type="button"
                                role="option"
                                aria-selected={selected}
                                key={option}
                                className={`publishDropdownOption ${
                                  selected ? "selected" : ""
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectPublishAudience(option);
                                }}
                              >
                                <span className="publishRadio" aria-hidden="true">
                                  {selected ? (
                                    <span className="publishRadioCheck">
                                      <span className="publishTick" />
                                    </span>
                                  ) : (
                                    <span className="publishRadioInner" />
                                  )}
                                </span>

                                <span>{option}</span>

                                {option !== "Default" && (
                                  <span
                                    className="publishSubmenuArrow"
                                    aria-hidden="true"
                                  >
                                    ›
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {publishFlyout === "tenant" && (
                        <div className="publishNestedFlyout publishTenantFlyout">
                          <div className="publishNestedTitle">Select Tenant</div>

                          {publishTenants.map((tenantOption) => (
                            <button
                              type="button"
                              key={tenantOption}
                              className={`publishNestedOption ${
                                publishTenant === tenantOption ? "selected" : ""
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectPublishTenant(tenantOption);
                              }}
                            >
                              {tenantOption}
                            </button>
                          ))}
                        </div>
                      )}

                      {publishFlyout === "actor" && (
                        <div className="publishNestedFlyout publishActorFlyout">
                          <div className="publishNestedTitle">Select Actor</div>

                          {publishActors.length > 0 ? (
                            publishActors.map((actorOption) => (
                              <button
                                type="button"
                                key={actorOption}
                                className={`publishNestedOption ${
                                  publishActor === actorOption ? "selected" : ""
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectPublishActor(actorOption);
                                }}
                              >
                                {getPublishActorLabel(
                                  activePublishTenantForLabels,
                                  actorOption
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="publishNestedTitle">
                              No receiving actors available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {publishError && (
                    <div
                      role="alert"
                      aria-live="polite"
                      style={{
                        margin: "4px 0 12px",
                        color: "#d32f2f",
                        fontSize: "13px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {publishError}
                    </div>
                  )}

                  <div className="publishModalActions">
                    <button
                      type="button"
                      className="autoPublishButton"
                      onClick={handleAutoPublish}
                    >
                      Schedule Publish
                    </button>

                    <button
                      type="button"
                      className="publishConfirmButton"
                      onClick={confirmPublishEvent}
                    >
                      Publish
                    </button>
                  </div>
                </section>
              </div>
            </BodyPortal>
          )}

          {autoPublishEvent && (
            <BodyPortal>
              <div
                className="autoPublishOverlay"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    closeAutoPublishModal();
                  }
                }}
              >
                <section
                  className="autoPublishModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="auto-publish-title"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className="autoPublishHeader">
                    <h2 id="auto-publish-title">Schedule Auto Publish</h2>

                    <button
                      type="button"
                      className="autoPublishClose"
                      aria-label="Close Schedule Auto Publish"
                      onClick={closeAutoPublishModal}
                    >
                      ×
                    </button>
                  </div>

                  <div className="autoPublishFields">
                    <div className="autoPublishField">
                      <label htmlFor="auto-publish-date">PUBLISH DATE</label>

                      <div className="autoPublishDatePicker">
                        <button
                          id="auto-publish-date"
                          type="button"
                          className={`autoPublishDateControl ${
                            autoPublishCalendarOpen ? "open" : ""
                          }`}
                          aria-haspopup="dialog"
                          aria-expanded={autoPublishCalendarOpen}
                          onClick={() => {
                            setAutoPublishCalendarOpen((previous) => !previous);
                            setAutoPublishTimeOpen(false);
                          }}
                        >
                          <span className="autoPublishDateValue">
                            {formatAutoPublishDateDisplay(autoPublishDate)}
                          </span>

                          <span className="autoPublishCalendarIcon" aria-hidden="true">
                            <img
                              src={icons.calendar}
                              alt=""
                              className="autoPublishCalendarImage"
                            />
                          </span>
                        </button>

                        {autoPublishCalendarOpen && (
                          <div
                            className="autoPublishCalendarDropdown"
                            role="dialog"
                            aria-label="Select publish date"
                          >
                            <div className="autoPublishCalendarHeader">
                              <button
                                type="button"
                                className="autoPublishCalendarNav"
                                aria-label="Previous month"
                                onClick={() =>
                                  setAutoPublishCalendarMonth(
                                    (previous) =>
                                      new Date(
                                        previous.getFullYear(),
                                        previous.getMonth() - 1,
                                        1
                                      )
                                  )
                                }
                              >
                                ‹
                              </button>

                              <strong>
                                {autoPublishCalendarMonth.toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </strong>

                              <button
                                type="button"
                                className="autoPublishCalendarNav"
                                aria-label="Next month"
                                onClick={() =>
                                  setAutoPublishCalendarMonth(
                                    (previous) =>
                                      new Date(
                                        previous.getFullYear(),
                                        previous.getMonth() + 1,
                                        1
                                      )
                                  )
                                }
                              >
                                ›
                              </button>
                            </div>

                            <div className="autoPublishCalendarWeekdays">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                                (weekday) => (
                                  <span key={weekday}>{weekday}</span>
                                )
                              )}
                            </div>

                            <div className="autoPublishCalendarGrid">
                              {autoPublishCalendarCells.map((cell, index) => {
                                const value = formatAutoPublishDateValue(cell.date);
                                const selected = autoPublishDate === value;

                                return (
                                  <button
                                    type="button"
                                    key={`${value}-${index}`}
                                    className={`${!cell.currentMonth ? "outside" : ""} ${
                                      selected ? "selected" : ""
                                    }`}
                                    onClick={() => selectAutoPublishDate(cell.date)}
                                  >
                                    {cell.day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="autoPublishField">
                      <label>PUBLISH TIME</label>

                      <div className="autoPublishTimePicker">
                        <button
                          type="button"
                          className={`autoPublishTimeControl ${
                            autoPublishTimeOpen ? "open" : ""
                          }`}
                          aria-haspopup="dialog"
                          aria-expanded={autoPublishTimeOpen}
                          onClick={() => {
                            setAutoPublishTimeOpen((previous) => !previous);
                            setAutoPublishCalendarOpen(false);
                          }}
                        >
                          <span className="autoPublishTimeValue">
                            {autoPublishHour !== "" && autoPublishMinute !== ""
                              ? `${autoPublishHour.padStart(2, "0")} : ${autoPublishMinute.padStart(2, "0")}`
                              : "Select"}
                          </span>

                          <span
                            className="autoPublishClockIcon"
                            aria-hidden="true"
                            style={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Image
                              src="/assets/calendar-icons/alarm-clock.svg"
                              alt=""
                              width={20}
                              height={20}
                              className="autoPublishClockImage"
                              style={{
                                width: 20,
                                height: 20,
                                display: "block",
                                objectFit: "contain",
                              }}
                            />
                          </span>
                        </button>

                        {autoPublishTimeOpen && (
                          <div
                            className="autoPublishTimeDropdown"
                            role="dialog"
                            aria-label="Select publish time"
                          >
                            <div className="autoPublishTimeColumn">
                              <div className="autoPublishTimeColumnTitle">HR</div>
                              <div className="autoPublishTimeScroller">
                                {Array.from({ length: 24 }, (_, hour) => {
                                  const value = String(hour);
                                  return (
                                    <button
                                      type="button"
                                      key={value}
                                      className={
                                        autoPublishHour === value ? "selected" : ""
                                      }
                                      onClick={() => {
                                        setAutoPublishHour(value);
                                        setAutoPublishError("");
                                      }}
                                    >
                                      {value.padStart(2, "0")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="autoPublishTimeDivider" />

                            <div className="autoPublishTimeColumn">
                              <div className="autoPublishTimeColumnTitle">MIN</div>
                              <div className="autoPublishTimeScroller">
                                {Array.from({ length: 60 }, (_, minute) => {
                                  const value = String(minute);
                                  return (
                                    <button
                                      type="button"
                                      key={value}
                                      className={
                                        autoPublishMinute === value ? "selected" : ""
                                      }
                                      onClick={() => {
                                        setAutoPublishMinute(value);
                                        setAutoPublishError("");

                                        if (autoPublishHour !== "") {
                                          setAutoPublishTimeOpen(false);
                                        }
                                      }}
                                    >
                                      {value.padStart(2, "0")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {autoPublishError && (
                    <p className="autoPublishError" role="alert">
                      {autoPublishError}
                    </p>
                  )}

                  <div className="autoPublishActions">
                    <button
                      type="button"
                      className="autoPublishCancel"
                      onClick={closeAutoPublishModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="autoPublishSave"
                      onClick={saveAutoPublishSchedule}
                    >
                      Save Schedule
                    </button>
                  </div>
                </section>
              </div>
            </BodyPortal>
          )}

          {exportOpen && (
            <div className="exportModalOverlay" role="presentation">
              <div className="exportCalendarModal" role="dialog" aria-modal="true" aria-labelledby="export-calendar-title">
                <div className="exportModalHeader">
                  <h2 id="export-calendar-title">
                    <span>Export Calendar</span> <strong>PDF</strong>
                  </h2>
                  <button
                    type="button"
                    className="exportModalClose"
                    aria-label="Close Export Calendar"
                    onClick={() => {
                      setExportOpen(false);
                      setExportDropdown(null);
                      setExportMessage("");
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="exportModalFields">
                  <div className="exportField">
                    <span>MONTH</span>
                    <div className={`exportCustomSelect ${exportDropdown === "month" ? "open" : ""}`}>
                      <button
                        type="button"
                        className="exportSelectButton"
                        onClick={() =>
                          setExportDropdown(exportDropdown === "month" ? null : "month")
                        }
                      >
                        <span>{exportMonth || "Select Month"}</span>
                        <Image
                          className="exportSelectArrow"
                          src={icons.chevronDown}
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      </button>

                      {exportDropdown === "month" && (
                        <div className="exportSelectMenu">
                          {exportMonths.map((month) => (
                            <button
                              type="button"
                              key={month}
                              className={`exportSelectOption ${exportMonth === month ? "selected" : ""}`}
                              onClick={() => {
                                setExportMonth(month);
                                setExportDropdown(null);
                                setExportMessage("");
                              }}
                            >
                              <span className="exportOptionRadio" aria-hidden="true">
                                {exportMonth === month && <span>✓</span>}
                              </span>
                              <span>{month}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="exportField">
                    <span>YEAR</span>
                    <div className={`exportCustomSelect ${exportDropdown === "year" ? "open" : ""}`}>
                      <button
                        type="button"
                        className="exportSelectButton"
                        onClick={() =>
                          setExportDropdown(exportDropdown === "year" ? null : "year")
                        }
                      >
                        <span>{exportYear}</span>
                        <Image
                          className="exportSelectArrow"
                          src={icons.chevronDown}
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      </button>

                      {exportDropdown === "year" && (
                        <div className="exportSelectMenu exportYearMenu">
                          {exportYears.map((year) => (
                            <button
                              type="button"
                              key={year}
                              className={`exportSelectOption ${exportYear === year ? "selected" : ""}`}
                              onClick={() => {
                                setExportYear(year);
                                setExportDropdown(null);
                                setExportMessage("");
                              }}
                            >
                              <span className="exportOptionRadio" aria-hidden="true">
                                {exportYear === year && <span>✓</span>}
                              </span>
                              <span>{year}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {exportMessage && (
                  <div className="exportNoEventsMessage" role="alert">
                    {exportMessage}
                  </div>
                )}

                <div className="exportModalActions">
                  <button
                    type="button"
                    className="exportCancelButton"
                    onClick={() => {
                      setExportOpen(false);
                      setExportDropdown(null);
                      setExportMessage("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="exportDownloadButton"
                    onClick={downloadCalendarPdf}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {eventFormOpen && (
        <AddEventPage
          embedded
          onClose={closeEmbeddedEventForm}
          onComplete={completeEmbeddedEventForm}
        />
      )}
    </div>
  );
}
  