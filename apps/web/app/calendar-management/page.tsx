"use client";

import "../calendarmanagment/calendarmanagment.css";
import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import CalendarView from "@/components/calendar/CalendarView";

import { calendarService } from "@/features/calendar/services/calendar.service";
import type {
  CalendarData,
  CalendarEvent,
} from "@/features/calendar/types/calendar.types";

/* ========================================
   LOGIN DATA TYPE
======================================== */

interface LoginData {
  loggedIn: boolean;

  role: string;

  displayRole: string;

  tenantType: string;

  displayTenant: string;

  loginTime: string;
}

/* ========================================
   EVENT TYPES BY ROLE / TENANT
======================================== */

const SUPER_ADMIN_EVENT_TYPES = [
  "Platform-Wide Announcement",
  "Platform Governance Review",
  "Policy Update",
  "Compliance Review",
  "Security Audit",
  "Platform Release",
  "System Upgrade",
  "Maintenance Window",
  "Data Migration / Backup",
  "Platform Leadership Review",
  "Billing / Subscription Review",
  "Other",
];

const PLATFORM_ADMIN_EVENT_TYPES = [
  "Platform Configuration",
  "Feature Release",
  "Maintenance Window",
  "Security Update",
  "Integration Deployment",
  "Data Sync / Migration",
  "Platform Training",
  "Support Review",
  "SLA Review",
  "System Audit",
  "Platform Announcement",
  "Other",
];

const UNIVERSITY_EVENT_TYPES = [
  "Semester Commencement",
  "Student Induction / Orientation",
  "Commencement of Classes",
  "Class",
  "Lab / Practical",
  "Assignment Deadline",
  "Internal Assessment",
  "Project Review",
  "Seminar / Workshop",
  "Last Working Day",
  "Theory Examination",
  "Practical Examination",
  "Viva Examination",
  "Holiday",
  "College / University Event",
  "Semester Break",
  "Commencement of Next Semester",
  "Other",
];

const SKILL_ACADEMY_EVENT_TYPES = [
  "Batch Commencement",
  "Learner Orientation",
  "Course Session",
  "Live Class",
  "Hands-on Lab",
  "Assignment Deadline",
  "Skill Assessment",
  "Project Review",
  "Workshop / Masterclass",
  "Mentor Session",
  "Mock Interview",
  "Certification Assessment",
  "Placement Drive",
  "Academy Event",
  "Holiday",
  "Batch Break",
  "Batch Completion",
  "Other",
];

const BOOTCAMP_EVENT_TYPES = [
  "Cohort Kickoff",
  "Learner Orientation",
  "Live Class",
  "Coding Lab",
  "Challenge / Assignment Deadline",
  "Weekly Assessment",
  "Project Sprint",
  "Code Review",
  "Hackathon",
  "Mentor Session",
  "Mock Interview",
  "Career Session",
  "Demo Day",
  "Placement Interview",
  "Holiday",
  "Cohort Break",
  "Cohort Graduation",
  "Other",
];

const CORPORATE_EVENT_TYPES = [
  "Training Program Kickoff",
  "Employee Orientation",
  "Instructor-Led Training",
  "Virtual Training Session",
  "Workshop",
  "Compliance Training",
  "Mandatory Training Deadline",
  "Assessment",
  "Certification",
  "Manager Review",
  "Team Learning Session",
  "Leadership Session",
  "Town Hall",
  "Policy / Process Update",
  "Holiday",
  "Training Completion",
  "Other",
];

function getEventTypesForContext(
  loginData: LoginData | null
) {
  if (!loginData) {
    return UNIVERSITY_EVENT_TYPES;
  }

  if (loginData.role === "SUPER_ADMIN") {
    return SUPER_ADMIN_EVENT_TYPES;
  }

  if (loginData.role === "PLATFORM_ADMIN") {
    return PLATFORM_ADMIN_EVENT_TYPES;
  }

  switch (loginData.tenantType) {
    case "SKILL_ACADEMY":
      return SKILL_ACADEMY_EVENT_TYPES;

    case "BOOTCAMP":
      return BOOTCAMP_EVENT_TYPES;

    case "CORPORATE":
      return CORPORATE_EVENT_TYPES;

    case "UNIVERSITY":
    default:
      return UNIVERSITY_EVENT_TYPES;
  }
}



type EventDataPoint = {
  key: string;
  label: string;
  placeholder?: string;
};

function getEventMarkerColor(eventIndex: number) {
  // Must match CalendarView's color calculation.
  const hue = (eventIndex * 137.508) % 360;

  return `hsl(${hue}, 72%, 45%)`;
}

const DATA_POINT_DROPDOWN_OPTIONS: Record<string, string[]> = {
  "All Day": ["Yes", "No"],
  "Priority": ["Low", "Medium", "High", "Critical"],
  "Notification": ["Enable", "Disable"],
  "Reminder": ["15 min", "30 min", "1 hr", "1 day", "Custom"],
  "Status": ["Draft", "Scheduled", "Published", "Cancelled"],
  "Mandatory Event": ["Yes", "No"],
  "Acknowledgement Required": ["Yes", "No"],
  "Registration Required": ["Yes", "No"],
  "Attendance Required": ["Yes", "No"],
  "Academic Year": ["2025-26", "2026-27", "2027-28", "2028-29"],
  "Semester": [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
  ],
  "Degree": ["UG", "PG", "Diploma", "Certificate"],
  "Phase": ["Foundation", "Core", "Advanced", "Capstone"],
  "Training Track": ["Foundation", "Intermediate", "Advanced", "Specialization"],
};

function getDropdownOptionsForDataPoint(
  dataPoint: EventDataPoint
): string[] | null {
  return (
    DATA_POINT_DROPDOWN_OPTIONS[dataPoint.label] ||
    null
  );
}

const PLATFORM_COMMON_DATA_POINTS: EventDataPoint[] = [
  { key: "priority", label: "Priority", placeholder: "Low / Medium / High / Critical" },
  { key: "organizer", label: "Organizer" },
];

const SUPER_ADMIN_EXTRA_DATA_POINTS: EventDataPoint[] = [
];

const PLATFORM_ADMIN_EXTRA_DATA_POINTS: EventDataPoint[] = [
];

const ROLE_TENANT_DATA_POINTS: Record<string, Record<string, EventDataPoint[]>> = {
  UNIVERSITY: {
    TENANT_ADMIN: ["Campus", "School / College", "Department", "Program", "Degree", "Academic Year", "Semester", "Section", "Subject"].map((label) => ({ key: label, label })),
    COORDINATOR: ["Department", "Program", "Academic Year", "Semester", "Section", "Subject", "Faculty", "Student Group"].map((label) => ({ key: label, label })),
    FACULTY: ["Department", "Program", "Semester", "Batch", "Section", "Subject", "Class / Student Group"].map((label) => ({ key: label, label })),
    LEARNER: ["Program", "Semester", "Batch", "Section", "Enrolled Course / Subject", "Student Club / Group"].map((label) => ({ key: label, label })),
  },
  SKILL_ACADEMY: {
    TENANT_ADMIN: ["Skill Domain", "Program", "Training Track", "Trainer"].map((label) => ({ key: label, label })),
    COORDINATOR: ["Center", "Skill Domain", "Program", "Batch", "Training Track", "Trainer"].map((label) => ({ key: label, label })),
    FACULTY: ["Program", "Batch", "Session"].map((label) => ({ key: label, label })),
    LEARNER: ["Enrolled Program", "Batch"].map((label) => ({ key: label, label })),
  },
  BOOTCAMP: {
    TENANT_ADMIN: ["Batch", "Phase", "Instructor / Mentor"].map((label) => ({ key: label, label })),
    COORDINATOR: ["Program", "Batch", "Phase", "Instructor / Mentor"].map((label) => ({ key: label, label })),
    FACULTY: ["Assigned Program", "Batch", "Session"].map((label) => ({ key: label, label })),
    LEARNER: ["Enrolled Bootcamp", "Project / Group"].map((label) => ({ key: label, label })),
  },
  CORPORATE: {
    TENANT_ADMIN: ["Business Unit", "Department", "Location / Branch", "Job Role / Designation", "Training Program", "Manager"].map((label) => ({ key: label, label })),
    COORDINATOR: ["Business Unit", "Department", "Training Program", "Batch", "Trainer", "Manager"].map((label) => ({ key: label, label })),
    FACULTY: ["Training Program", "Batch", "Session", "Employee / Learner Group"].map((label) => ({ key: label, label })),
    LEARNER: ["Assigned Training Program", "Batch"].map((label) => ({ key: label, label })),
  },
};

function getDataPointsForContext(loginData: LoginData | null): EventDataPoint[] {
  if (!loginData) return [];
  if (loginData.role === "SUPER_ADMIN") {
    return [...PLATFORM_COMMON_DATA_POINTS, ...SUPER_ADMIN_EXTRA_DATA_POINTS];
  }
  if (loginData.role === "PLATFORM_ADMIN") {
    return [...PLATFORM_COMMON_DATA_POINTS, ...PLATFORM_ADMIN_EXTRA_DATA_POINTS];
  }
  return ROLE_TENANT_DATA_POINTS[loginData.tenantType]?.[loginData.role] || [];
}

/* ========================================
   PAGE
======================================== */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: "rgba(15, 23, 42, 0.45)",
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "24px",
  borderRadius: "14px",
  background: "#ffffff",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.20)",
};

const EVENT_OPTIONS_BY_CONTEXT: Record<string, Array<{ title: string; subtitles: string[] }>> = {
  SUPER_ADMIN: [
    { title: "Platform Communication", subtitles: ["Platform Announcement", "Important Notice", "Training Announcement", "Holiday Announcement", "Maintenance Announcement", "Feature Release Announcement", "Service Update"] },
    { title: "Institute & Tenant Management", subtitles: ["Institute Onboarding", "Institute Orientation", "Institute Review", "Institute Access Review", "Institute Renewal", "Tenant Activation", "Tenant Deactivation", "Institute Configuration Review"] },
    { title: "Administration & Access Management", subtitles: ["Admin Meeting", "Admin Training", "Platform Orientation", "User Access Review", "Role & Permission Review", "Administrator Access Review", "Privileged Access Review", "Access Audit"] },
    { title: "Policy, Compliance & Governance", subtitles: ["Policy Update", "Compliance Review", "Governance Review", "Security Policy Review", "Privacy Review", "Regulatory Review", "Audit Review", "Content Governance Review"] },
    { title: "Subscription & Licensing", subtitles: ["Subscription Renewal", "Subscription Expiry", "License Renewal", "License Expiry", "Institute Renewal", "Plan Upgrade / Downgrade", "Subscription Review", "License Allocation Review"] },
    { title: "Platform Monitoring & Performance", subtitles: ["Usage Review", "Performance Review", "Platform Health Review", "Capacity Review", "Adoption Review", "Activity Review", "System Performance Review", "Service Availability Review"] },
    { title: "Reports & Analytics Review", subtitles: ["Reports Review", "Usage Analytics Review", "Institute Analytics Review", "Compliance Report Review", "Adoption Report Review", "Performance Report Review", "Executive Dashboard Review"] },
    { title: "Support & Feedback Management", subtitles: ["Feedback Review", "Support Review", "Institute Feedback Review", "Escalation Review", "Support Performance Review", "Service Issue Review", "Resolution Review"] },
    { title: "Content & Academic Governance", subtitles: ["Content Governance Review", "Learning Content Review", "Academic Calendar Review", "Course Content Review", "Content Compliance Review", "Publishing Review", "Content Quality Review"] },
    { title: "Meetings & Stakeholder Engagement", subtitles: ["Stakeholder Meeting", "Admin Meeting", "Institute Meeting", "Leadership Meeting", "Governance Meeting", "Partner Meeting", "Review Meeting", "Webinar"] },
    { title: "Periodic & Strategic Reviews", subtitles: ["Quarterly Review", "Annual Review", "Monthly Review", "Strategic Review", "Platform Roadmap Review", "Service Review", "Institute Portfolio Review", "Annual Planning Review"] },
    { title: "Others", subtitles: ["Others"] },
  ],
  PLATFORM_ADMIN: [
    { title: "Platform Operations & Maintenance", subtitles: ["LMS Maintenance", "Scheduled Maintenance", "System Downtime", "Platform Upgrade", "Infrastructure Maintenance", "Maintenance Completion"] },
    { title: "Modules & Feature Management", subtitles: ["Module Update", "Assessment Module Update", "Attendance Module Update", "Calendar Update", "Reporting Update", "Notification Update", "Feature Enablement", "Feature Configuration"] },
    { title: "Release & Change Management", subtitles: ["Release Review", "New Release", "Feature Release", "Version Upgrade", "Change Review", "Deployment Window", "Release Validation", "Post-Release Review"] },
    { title: "User, Role & Access Management", subtitles: ["User Management Review", "Access Review", "Role Review", "Permission Review", "Privileged Access Review", "User Activation / Deactivation", "Access Audit"] },
    { title: "Content & Course Administration", subtitles: ["Content Review", "Course Publishing Window", "Course Publishing Review", "Content Approval", "Content Quality Review", "Content Update", "Course Archive"] },
    { title: "Integration & Configuration", subtitles: ["Integration Update", "Integration Review", "API Configuration", "SSO Configuration", "External System Integration", "Platform Configuration", "Notification Configuration"] },
    { title: "System Monitoring & Performance", subtitles: ["System Health Review", "Performance Review", "Availability Review", "Capacity Review", "Error / Incident Review", "Usage Monitoring", "Security Health Review"] },
    { title: "Training & Orientation", subtitles: ["Feature Training", "Admin Training", "Platform Orientation", "Module Training", "Configuration Training", "Refresher Training", "Release Training"] },
    { title: "Support & Issue Management", subtitles: ["Support Session", "Technical Support", "Admin Support", "Issue Review", "Incident Review", "Escalation Review", "Resolution Review", "Troubleshooting Session"] },
    { title: "Others", subtitles: ["Others"] },
  ],
  UNIVERSITY: [
    { title: "Academic Calendar", subtitles: ["Academic Year Start", "Academic Year End", "Semester Start", "Semester End", "Term / Trimester Dates", "Academic Milestone", "Academic Holiday", "Institutional Closure"] },
    { title: "Registration & Enrollment", subtitles: ["Course Registration", "Registration Opening", "Registration Deadline", "Course Enrollment", "Enrollment Deadline", "Add / Drop Period", "Course Withdrawal", "Re-registration"] },
    { title: "Classes & Learning Activities", subtitles: ["Lecture", "Guest / Expert Lecture", "Lab Session", "Practical Session", "Tutorial", "Workshop", "Seminar", "Training Session", "Orientation Program", "Class Schedule", "Timetable Update", "Field Visit", "Industrial Visit", "Study Tour"] },
    { title: "Assignments & Assessments", subtitles: ["Assignment Publication", "Assignment Submission", "Assignment Deadline", "Quiz", "Class Test", "Internal Assessment", "Continuous Assessment", "Presentation", "Viva / Oral Assessment", "Practical Assessment"] },
    { title: "Examinations & Results", subtitles: ["Mid-Semester Examination", "End-Semester Examination", "University Examination", "Supplementary Examination", "Re-examination", "Examination Registration", "Examination Deadline", "Hall Ticket / Admit Card", "Result Publication", "Revaluation"] },
    { title: "Projects & Research", subtitles: ["Project Allocation", "Project Review", "Project Presentation", "Project Submission", "Project Deadline", "Dissertation", "Thesis", "Research Review", "Research Presentation", "Research Submission"] },
    { title: "Academic Progress & Student Support", subtitles: ["Attendance Review", "Attendance Shortage Notice", "Academic Progress Review", "Mentoring Session", "Academic Advising", "Remedial Session", "Student Counseling", "Parent Meeting"] },
    { title: "Career & Professional Development", subtitles: ["Placement Training", "Placement Drive", "Career Guidance", "Internship", "Internship Application", "Internship Deadline", "Internship Review", "Internship Completion", "Skill Development Program", "Certification Program"] },
    { title: "Academic Meetings & Governance", subtitles: ["Faculty Meeting", "Department Meeting", "Academic Review Meeting", "Curriculum Meeting", "Board of Studies Meeting", "Committee Meeting", "Course Review Meeting", "Student Review Meeting"] },
    { title: "Institutional & Student Events", subtitles: ["Convocation", "Graduation Ceremony", "Annual Day", "College / University Event", "Department Event", "Student Club Event", "Cultural Event", "Sports Event", "Competition", "Conference", "Symposium"] },
    { title: "Others", subtitles: ["Others"] },
  ],
  SKILL_ACADEMY: [
    { title: "Program & Batch Management", subtitles: ["Program Launch", "Program Completion", "Batch Start", "Batch End", "Batch Schedule", "Batch Update", "Learner Orientation"] },
    { title: "Enrollment & Access", subtitles: ["Course Enrollment", "Enrollment Opening", "Enrollment Deadline", "Enrollment Confirmation", "Course Access Start", "Course Access End", "Re-enrollment"] },
    { title: "Training & Learning Activities", subtitles: ["Training Session", "Trainer-led Session", "Module Start", "Module Completion", "Practical Session", "Hands-on Practice", "Skill Workshop", "Academy Workshop", "Live Session", "Expert Session", "Industry Session"] },
    { title: "Assignments & Assessments", subtitles: ["Assignment", "Assignment Deadline", "Practice Test", "Quiz", "Skill Assessment", "Practical Assessment", "Module Assessment", "Final Assessment", "Assessment Deadline", "Assessment Result"] },
    { title: "Projects & Capstone", subtitles: ["Project Start", "Project Milestone", "Project Review", "Project Presentation", "Project Submission", "Project Deadline", "Capstone Project", "Capstone Review", "Capstone Submission"] },
    { title: "Learner Support & Mentoring", subtitles: ["Mentor Session", "Doubt Clearing Session", "Learner Support Session", "One-to-One Mentoring", "Group Mentoring", "Progress Review", "Performance Feedback", "Remedial Session"] },
    { title: "Industry & Career Development", subtitles: ["Industry Session", "Industry Expert Talk", "Career Guidance", "Resume Preparation", "Mock Interview", "Interview Preparation", "Placement Preparation", "Placement Drive", "Employer Interaction", "Job Readiness Session"] },
    { title: "Certification", subtitles: ["Certification Preparation", "Certification Registration", "Certification Exam", "Certification Deadline", "Certification Result", "Certification Completion", "Certificate Issuance", "Certificate Renewal"] },
    { title: "Academy Events & Engagement", subtitles: ["Academy Workshop", "Webinar", "Seminar", "Bootcamp", "Hackathon", "Competition", "Community Event", "Networking Session", "Learner Showcase", "Demo Day"] },
    { title: "Academy Calendar & Notices", subtitles: ["Academy Holiday", "Training Holiday", "Schedule Change", "Session Rescheduling", "Academy Closure", "Important Deadline", "General Announcement"] },
    { title: "Others", subtitles: ["Others"] },
  ],
  BOOTCAMP: [
    { title: "Bootcamp & Cohort Management", subtitles: ["Bootcamp Kickoff", "Bootcamp Completion", "Cohort Start", "Cohort End", "Cohort Orientation", "Cohort Schedule", "Cohort Update"] },
    { title: "Modules & Learning Sessions", subtitles: ["Module Start", "Module Completion", "Module Deadline", "Live Session", "Technical Session", "Live Coding Session", "Practice Session", "Instructor-led Session", "Workshop", "Expert Session"] },
    { title: "Assignments & Coding Challenges", subtitles: ["Assignment", "Assignment Deadline", "Coding Challenge", "Challenge Deadline", "Practice Challenge", "Technical Exercise", "Coding Task", "Challenge Review"] },
    { title: "Assessments & Code Evaluation", subtitles: ["Technical Assessment", "Coding Assessment", "Practical Assessment", "Module Assessment", "Final Assessment", "Code Review", "Assessment Deadline", "Assessment Result"] },
    { title: "Sprints & Agile Activities", subtitles: ["Sprint Start", "Sprint Planning", "Sprint Activities", "Sprint Deadline", "Sprint Review", "Sprint Retrospective", "Stand-up Session", "Sprint Demo"] },
    { title: "Projects & Capstone", subtitles: ["Project Kickoff", "Project Sprint", "Project Milestone", "Project Development Session", "Project Review", "Project Submission", "Project Deadline", "Capstone Project", "Demo Preparation", "Demo Day"] },
    { title: "Mentoring & Learner Support", subtitles: ["Mentor Session", "Doubt Clearing Session", "One-to-One Mentoring", "Group Mentoring", "Progress Review", "Technical Guidance", "Performance Feedback", "Remedial Session"] },
    { title: "Hackathons & Community Events", subtitles: ["Hackathon", "Coding Competition", "Team Challenge", "Innovation Challenge", "Community Session", "Networking Session", "Learner Showcase"] },
    { title: "Career & Placement", subtitles: ["Career Preparation", "Resume Preparation", "Portfolio Review", "Mock Interview", "Technical Interview Preparation", "Hiring Partner Session", "Employer Interaction", "Placement Drive", "Job Readiness Session"] },
    { title: "Completion & Recognition", subtitles: ["Bootcamp Completion", "Graduation Day", "Certificate Issuance", "Completion Certificate", "Learner Recognition", "Achievement / Award"] },
    { title: "Others", subtitles: ["Others"] },
  ],
  CORPORATE: [
    { title: "Onboarding & Induction", subtitles: ["Employee Onboarding", "New Hire Orientation", "Onboarding Training", "Onboarding Deadline", "Induction Program", "Role Induction", "Probation Learning Review"] },
    { title: "Training & Learning Programs", subtitles: ["Training Program Start", "Training Program End", "Assigned Training", "Mandatory Training", "Annual Training", "Role-Based Training", "Product Training", "Process Training", "Technical Training", "Soft Skills Training", "Refresher Training", "Cross-Functional Training", "Course Deadline"] },
    { title: "Compliance & Policy", subtitles: ["Compliance Training", "Compliance Deadline", "Policy Training", "Policy Update Session", "Code of Conduct Training", "Regulatory Training", "Workplace Safety Training", "Ethics Training", "Anti-Harassment Training", "Compliance Renewal"] },
    { title: "Security & Data Protection", subtitles: ["Cybersecurity Training", "Security Awareness", "Data Privacy Training", "Information Security Training", "Phishing Awareness", "Security Policy Update", "Security Assessment"] },
    { title: "Skills & Capability Development", subtitles: ["Skill Development", "Functional Skill Training", "Technical Skill Development", "Professional Skill Development", "Digital Skill Development", "Upskilling", "Reskilling", "Skill Gap Training", "Capability Development"] },
    { title: "Leadership & Management Development", subtitles: ["Leadership Training", "Manager Training", "First-Time Manager Training", "Leadership Development Program", "People Management Training", "Team Management Training", "Decision-Making Workshop", "Succession Development"] },
    { title: "Workshops & Knowledge Sharing", subtitles: ["Workshop", "Webinar", "Knowledge Sharing", "Expert Session", "Internal Learning Session", "Community of Practice", "Best Practice Sharing", "Lunch & Learn", "Conference", "Seminar"] },
    { title: "Assessment & Learning Evaluation", subtitles: ["Assessment", "Skill Assessment", "Knowledge Assessment", "Training Assessment", "Competency Assessment", "Pre-Assessment", "Post-Assessment", "Learning Evaluation", "Assessment Deadline", "Assessment Result"] },
    { title: "Certification & Accreditation", subtitles: ["Certification Program", "Certification Preparation", "Certification Exam", "Certification Deadline", "Certification Completion", "Certification Renewal", "Certification Expiry", "Certificate Issuance", "External Accreditation"] },
    { title: "Coaching, Mentoring & Performance Development", subtitles: ["Coaching Session", "Mentoring Session", "One-to-One Coaching", "Peer Mentoring", "Performance Development", "Learning Review", "Development Plan Review", "Career Development", "Progress Review", "Feedback Session"] },
    { title: "Organization & Employee Engagement", subtitles: ["Town Hall", "Organization-Wide Session", "Department Meeting", "Team Learning Event", "Leadership Communication", "Employee Engagement Session", "Culture & Values Session", "Change Management Session", "Organizational Announcement"] },
    { title: "Others", subtitles: ["Others"] },
  ],
};
function getDocumentEventOptions(loginData: LoginData | null) {
  if (!loginData) return EVENT_OPTIONS_BY_CONTEXT.UNIVERSITY;
  if (loginData.role === "SUPER_ADMIN") return EVENT_OPTIONS_BY_CONTEXT.SUPER_ADMIN;
  if (loginData.role === "PLATFORM_ADMIN") return EVENT_OPTIONS_BY_CONTEXT.PLATFORM_ADMIN;
  return EVENT_OPTIONS_BY_CONTEXT[loginData.tenantType] || EVENT_OPTIONS_BY_CONTEXT.UNIVERSITY;
}

const EXPORT_MONTHS = [
  ["01","January"],["02","February"],["03","March"],["04","April"],
  ["05","May"],["06","June"],["07","July"],["08","August"],
  ["09","September"],["10","October"],["11","November"],["12","December"],
] as const;

const actionMenuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 10px",
  border: "none",
  borderRadius: "6px",
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  color: "#374151",
};


function ScrollableEventDropdown({
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.trim().toLowerCase())
  );

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setSearch("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(event) => {
            if (disabled) return;
            setSearch(event.target.value);
            setOpen(true);
          }}
          style={{
            ...inputStyle,
            width: "100%",
            minHeight: "42px",
            paddingRight: "40px",
            background: disabled ? "#f9fafb" : "#ffffff",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />

        <button
          type="button"
          aria-label="Toggle options"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (disabled) return;

            if (open) {
              setOpen(false);
              setSearch("");
            } else {
              openDropdown();
            }
          }}
          style={{
            position: "absolute",
            right: "7px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "30px",
            height: "30px",
            padding: 0,
            border: "none",
            background: "transparent",
            color: "#6b7280",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          ▾
        </button>
      </div>

      {open && !disabled && (
        <div
          onWheel={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 6000,
            maxHeight: "220px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "4px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#ffffff",
            boxShadow: "0 8px 20px rgba(15,23,42,0.14)",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 10px",
                  border: "none",
                  borderRadius: "6px",
                  background: option === value ? "#f3f4f6" : "transparent",
                  color: "#111827",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div
              style={{
                padding: "10px",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              No matching results
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarManagementPage() {
  const router = useRouter();

  const [loginData, setLoginData] =
    useState<LoginData | null>(null);

  const [calendar, setCalendar] =
    useState<CalendarData | null>(null);

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);
  const [filterTenant, setFilterTenant] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");


  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const [title, setTitle] =
    useState("");

  const [eventType, setEventType] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [audience, setAudience] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [eventDataPoints, setEventDataPoints] =
    useState<Record<string, string>>({});


  const [showAttachmentOptions, setShowAttachmentOptions] =
    useState(false);

  const [showAttachmentActionMenu, setShowAttachmentActionMenu] =
    useState(false);

  const [attachmentType, setAttachmentType] =
    useState("");

  const [attachmentValue, setAttachmentValue] =
    useState("");


  const [openActionEventId, setOpenActionEventId] =
    useState<string | null>(null);

  const [showPublishModal, setShowPublishModal] =
    useState(false);

  const [publishEvent, setPublishEvent] =
    useState<CalendarEvent | null>(null);

  const [publishStartDate, setPublishStartDate] =
    useState("");

  const [publishEndDate, setPublishEndDate] =
    useState("");

  const [publishStartTime, setPublishStartTime] =
    useState("");

  const [publishEndTime, setPublishEndTime] =
    useState("");

  const [publishAudience, setPublishAudience] =
    useState("");

  const [showAudienceOptions, setShowAudienceOptions] =
    useState(false);

  const [publishAudienceMode, setPublishAudienceMode] =
    useState<"DEFAULT" | "TENANT" | "ACTOR">("DEFAULT");

  const [publishAudienceTarget, setPublishAudienceTarget] =
    useState("");

  const [publishTenantTarget, setPublishTenantTarget] =
    useState("");

  const [publishOrganizer, setPublishOrganizer] =
    useState("");

  const [publishAction, setPublishAction] =
    useState<"PUBLISH" | "AUTO_PUBLISH">("PUBLISH");

  const [showAutoPublishModal, setShowAutoPublishModal] =
    useState(false);

  const [autoPublishDate, setAutoPublishDate] =
    useState("");

  const [autoPublishTime, setAutoPublishTime] =
    useState("");
  const [showExportCalendar, setShowExportCalendar] = useState(false);
  const [exportMonth, setExportMonth] = useState("");
  const [exportYear, setExportYear] = useState(String(new Date().getFullYear()));

  const [reminderEvent, setReminderEvent] =
    useState<CalendarEvent | null>(null);
  const [reminderDescription, setReminderDescription] =
    useState("");

  const [showCalendarEditModal, setShowCalendarEditModal] =
    useState(false);

  const [calendarAcademicYear, setCalendarAcademicYear] =
    useState("");

  const [calendarProgramme, setCalendarProgramme] =
    useState("");

  const [calendarBranch, setCalendarBranch] =
    useState("");

  const [calendarYear, setCalendarYear] =
    useState("");

  const [calendarSemester, setCalendarSemester] =
    useState("");

  const [calendarScheme, setCalendarScheme] =
    useState("");

  const [calendarStartDate, setCalendarStartDate] =
    useState("");

  const [calendarEndDate, setCalendarEndDate] =
    useState("");

  /* ========================================
     INITIAL LOAD
  ======================================== */

  useEffect(() => {
    const storedLogin =
      localStorage.getItem(
        "calendar_dummy_login"
      );

    if (!storedLogin) {
      router.replace("/sign_in");
      return;
    }

    let parsedLogin: LoginData;

    try {
      parsedLogin =
        JSON.parse(storedLogin);
    } catch {
      router.replace("/sign_in");
      return;
    }

    if (!parsedLogin.loggedIn) {
      router.replace("/sign_in");
      return;
    }

    setLoginData(parsedLogin);

    const isPlatformLevelRole =
      parsedLogin.role ===
        "SUPER_ADMIN" ||
      parsedLogin.role ===
        "PLATFORM_ADMIN";

    /* =====================================
       SUPER ADMIN / PLATFORM ADMIN

       Keep the existing behaviour:
       use the shared ALL tenant calendar
       and auto create it when required.
    ====================================== */

    if (isPlatformLevelRole) {
      let foundCalendar =
        calendarService.getCalendarForTenant(
          "ALL"
        );

      if (!foundCalendar) {
        foundCalendar =
          calendarService.createCalendar({
            tenantId: "ALL",

            ownerId:
              parsedLogin.role,

            title:
              "Calendar Management",
          });
      }

      setCalendar(foundCalendar);

      setEvents(
        calendarService.getVisibleEvents(
          foundCalendar.id,
          parsedLogin.role,
          parsedLogin.tenantType
        )
      );

      setLoading(false);
      return;
    }

    /* =====================================
       ALL OTHER ROLES / TENANTS

       Open Calendar directly.
       If the role + tenant does not yet have
       a calendar, create its base calendar
       automatically and stay on this page.
    ====================================== */

    let foundCalendar =
      calendarService.getCalendarForUser(
        parsedLogin.role,
        parsedLogin.tenantType
      );

    if (!foundCalendar) {
      const tenantCalendarTitle =
        parsedLogin.tenantType === "UNIVERSITY"
          ? "University & College Calendar"
          : parsedLogin.tenantType === "SKILL_ACADEMY"
            ? "Skill Academy Calendar"
            : parsedLogin.tenantType === "BOOTCAMP"
              ? "Bootcamp Calendar"
              : parsedLogin.tenantType === "CORPORATE"
                ? "Corporate Calendar"
                : "Calendar Management";

      foundCalendar =
        calendarService.createCalendar({
          tenantId:
            parsedLogin.tenantType,
          ownerId:
            parsedLogin.role,
          title:
            tenantCalendarTitle,
        });
    }

    setCalendar(foundCalendar);

    setEvents(
      calendarService.getVisibleEvents(
          foundCalendar.id,
          parsedLogin.role,
          parsedLogin.tenantType
        )
    );

    setLoading(false);
  }, [router]);

  /* ========================================
     ROLE PERMISSIONS
  ======================================== */

  const isStudent =
    loginData?.role === "LEARNER";

  const isSuperAdmin =
    loginData?.role ===
    "SUPER_ADMIN";

  const isPlatformAdmin =
    loginData?.role ===
    "PLATFORM_ADMIN";

  const isTenantAdmin =
    loginData?.role ===
    "TENANT_ADMIN";

  const isCoordinator =
    loginData?.role ===
    "COORDINATOR";

  const isFaculty =
    loginData?.role ===
    "FACULTY";

  function getTenantLearnerLabel() {
    switch (loginData?.tenantType) {
      case "CORPORATE":
        return "Employee";
      case "BOOTCAMP":
        return "Bootcamp Learner";
      case "SKILL_ACADEMY":
        return "Skill Academy Learner";
      case "UNIVERSITY":
      default:
        return "Student";
    }
  }

  function getTenantLearnerDescription() {
    switch (loginData?.tenantType) {
      case "CORPORATE":
        return "View your assigned training programs, courses, sessions, assessments, certifications and scheduled employee learning activities.";
      case "BOOTCAMP":
        return "View your bootcamp sessions, coding labs, challenges, projects, mentor sessions, assessments and cohort activities.";
      case "SKILL_ACADEMY":
        return "View your enrolled courses, training sessions, labs, assessments, projects, mentor sessions and academy activities.";
      case "UNIVERSITY":
      default:
        return "View your classes, labs, assessments, assignments, examinations, holidays and scheduled learning activities.";
    }
  }

  /* ========================================
     STUDENT CAN NEVER MANAGE
  ======================================== */

  const canManage =
    !isStudent &&
    (
      isSuperAdmin ||
      isPlatformAdmin ||
      isTenantAdmin ||
      isCoordinator ||
      isFaculty
    );

  /* ========================================
     TENANT HEADER
  ======================================== */

  function getCalendarHeading() {
    if (!loginData) {
      return "Calendar Management";
    }

    if (
      isSuperAdmin ||
      isPlatformAdmin
    ) {
      return "Calendar Management - All Tenants";
    }

    switch (
      loginData.tenantType
    ) {
      case "UNIVERSITY":
        return "University & College Calendar";

      case "SKILL_ACADEMY":
        return "Skill Academy Calendar";

      case "BOOTCAMP":
        return "Bootcamp Calendar";

      case "CORPORATE":
        return "Corporate Calendar";

      default:
        return "Calendar Management";
    }
  }

  /* ========================================
     ROLE / TENANT DATA POINTS
  ======================================== */

  function getCalendarDataLabels() {
    if (isSuperAdmin) {
      return {
        first: "Platform Scope",
        second: "Tenant Coverage",
        third: "Governance Level",
        fourth: "Calendar Access",
        fifth: "Scheduled Events",
        startDate: "Platform Calendar Start",
        endDate: "Platform Calendar End",
      };
    }

    if (isPlatformAdmin) {
      return {
        first: "Platform Scope",
        second: "Tenant Coverage",
        third: "Administration Level",
        fourth: "Calendar Access",
        fifth: "Scheduled Events",
        startDate: "Platform Calendar Start",
        endDate: "Platform Calendar End",
      };
    }

    switch (loginData?.tenantType) {
      case "UNIVERSITY":
        return {
          first: "Academic Year",
          second: "Programme",
          third: "Branch / Specialization",
          fourth: "Year",
          fifth: "Semester",
          startDate: "Semester Start Date",
          endDate: "Semester End Date",
        };

      case "SKILL_ACADEMY":
        return {
          first: "Training Cycle",
          second: "Programme / Course",
          third: "Track / Specialization",
          fourth: "Batch",
          fifth: "Learning Stage",
          startDate: "Training Start Date",
          endDate: "Training End Date",
        };

      case "BOOTCAMP":
        return {
          first: "Cohort Cycle",
          second: "Bootcamp Programme",
          third: "Track",
          fourth: "Cohort / Batch",
          fifth: "Sprint / Phase",
          startDate: "Bootcamp Start Date",
          endDate: "Bootcamp End Date",
        };

      case "CORPORATE":
        return {
          first: "Training Cycle",
          second: "Learning Programme",
          third: "Department / Function",
          fourth: "Employee Group / Batch",
          fifth: "Training Phase",
          startDate: "Programme Start Date",
          endDate: "Programme End Date",
        };

      default:
        return {
          first: "Calendar Cycle",
          second: "Programme",
          third: "Track",
          fourth: "Batch",
          fifth: "Phase",
          startDate: "Start Date",
          endDate: "End Date",
        };
    }
  }

  function getCalendarDataPoints() {
    if (isSuperAdmin) {
      return [
        ["Platform Scope", "All Tenants"],
        ["Tenant Coverage", "4 Tenant Types"],
        ["Governance Level", "Super Admin"],
        ["Calendar Access", "Platform-wide"],
        ["Scheduled Events", String(events.length)],
      ];
    }

    if (isPlatformAdmin) {
      return [
        ["Platform Scope", "All Tenants"],
        ["Tenant Coverage", "4 Tenant Types"],
        ["Administration Level", "Platform Admin"],
        ["Calendar Access", "Cross-tenant"],
        ["Scheduled Events", String(events.length)],
      ];
    }

    const labels = getCalendarDataLabels();

    return [
      [labels.first, calendar?.academicYear || "-"],
      [labels.second, calendar?.programme || "-"],
      [labels.third, calendar?.branch || "-"],
      [labels.fourth, calendar?.year || "-"],
      [labels.fifth, calendar?.semester || "-"],
    ];
  }

  /* ========================================
     DESCRIPTION
  ======================================== */

  function getCalendarDescription() {
    if (!loginData) {
      return "";
    }

    if (isStudent) {
      return getTenantLearnerDescription();
    }

    if (
      isSuperAdmin ||
      isPlatformAdmin
    ) {
      return "Manage calendars, schedules and events across all tenants.";
    }

    switch (
      loginData.tenantType
    ) {
      case "UNIVERSITY":
        return "Manage classes, exams, labs, assignments, deadlines, holidays and academic events.";

      case "SKILL_ACADEMY":
        return "Manage training sessions, batches, assessments, workshops and certification activities.";

      case "BOOTCAMP":
        return "Manage cohort sessions, coding labs, challenges, assessments, projects and placement activities.";

      case "CORPORATE":
        return "Manage training programmes, compliance sessions, assessments and completion deadlines.";

      default:
        return "Manage scheduled learning activities and events.";
    }
  }

  /* ========================================
     REFRESH EVENTS
  ======================================== */

  function refreshEvents(
    targetCalendar = calendar
  ) {
    if (!targetCalendar) {
      return;
    }

    if (!loginData) {
      return;
    }

    setEvents(
      calendarService.getVisibleEvents(
        targetCalendar.id,
        loginData.role,
        loginData.tenantType
      )
    );
  }

  /* ========================================
     AUTO PUBLISH CHECK
     Scheduled -> Published when start date/time arrives
  ======================================== */

  useEffect(() => {
    const checkAutoPublishEvents = () => {
      const now = Date.now();
      let changed = false;

      events.forEach((event) => {
        const scheduledEvent =
          event as CalendarEvent & {
            status?: string;
            dataPoints?: Record<string, string>;
          };

        if (
          scheduledEvent.status !==
          "SCHEDULED"
        ) {
          return;
        }

        const scheduledAt =
          scheduledEvent.dataPoints
            ?.scheduledAt;

        if (!scheduledAt) {
          return;
        }

        const scheduledTime =
          new Date(scheduledAt).getTime();

        if (
          Number.isNaN(scheduledTime) ||
          scheduledTime > now
        ) {
          return;
        }

        calendarService.updateEvent(
          scheduledEvent.id,
          {
            status: "PUBLISHED",
            dataPoints: {
              ...(scheduledEvent.dataPoints ||
                {}),
              publishedAt:
                new Date().toISOString(),
            },
          } as Partial<CalendarEvent>
        );

        changed = true;
      });

      if (changed) {
        refreshEvents();
      }
    };

    checkAutoPublishEvents();

    const timer = window.setInterval(
      checkAutoPublishEvents,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    events,
    calendar?.id,
    loginData?.role,
    loginData?.tenantType,
  ]);

  function openReminderConfirmation(
    event: CalendarEvent
  ) {
    setOpenActionEventId(null);
    setReminderDescription("");
    setReminderEvent(event);
  }

  function handleSendReminder() {
    if (!reminderEvent) {
      return;
    }

    const current =
      reminderEvent as CalendarEvent & {
        dataPoints?: Record<string, string>;
      };

    calendarService.updateEvent(
      reminderEvent.id,
      {
        dataPoints: {
          ...(current.dataPoints || {}),
          reminderSentAt:
            new Date().toISOString(),
          reminderDescription:
            reminderDescription.trim(),
        },
      } as Partial<CalendarEvent>
    );

    const eventTitle =
      reminderEvent.title ||
      "Calendar Event";

    setReminderEvent(null);
    setReminderDescription("");
    refreshEvents();

    alert(
      `Reminder notification sent successfully for "${eventTitle}".`
    );
  }


  function handleExportCalendar() {
    if (!exportMonth || !exportYear) {
      alert("Please select month and year.");
      return;
    }

    const selected = [...events]
      .filter((event) => {
        const [year, month] =
          (event.startDate || "").split("-");

        return (
          year === exportYear &&
          month === exportMonth
        );
      })
      .sort((a, b) =>
        `${a.startDate} ${a.startTime || "00:00"}`.localeCompare(
          `${b.startDate} ${b.startTime || "00:00"}`
        )
      );

    const monthName =
      EXPORT_MONTHS.find(
        ([value]) => value === exportMonth
      )?.[1] || exportMonth;

    const pdfEscape = (value: unknown) =>
      String(value ?? "")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const shorten = (
      value: unknown,
      maxLength: number
    ) => {
      const clean = String(value ?? "-")
        .replace(/\s+/g, " ")
        .trim();

      if (!clean) return "-";

      return clean.length > maxLength
        ? `${clean.slice(
            0,
            Math.max(0, maxLength - 3)
          )}...`
        : clean;
    };

    /*
      Landscape A4-style PDF table.
      Column widths total 762 points.
    */
    const columns = [
      { label: "Title", width: 110 },
      { label: "Subtitle", width: 95 },
      { label: "Start", width: 100 },
      { label: "End", width: 100 },
      { label: "Organizer", width: 90 },
      { label: "Audience", width: 105 },
      { label: "Status", width: 72 },
      { label: "Description", width: 90 },
    ];

    const pageWidth = 842;
    const pageHeight = 595;
    const marginX = 40;
    const tableTop = 510;
    const rowHeight = 25;
    const headerHeight = 28;
    const rowsPerPage = 16;

    const tableRows = selected.map(
      (event) => {
        const current =
          event as CalendarEvent & {
            status?: string;
            dataPoints?: Record<string, string>;
          };

        return [
          shorten(event.title, 22),
          shorten(event.eventType, 18),
          shorten(
            `${event.startDate || "-"} ${
              event.startTime || ""
            }`,
            20
          ),
          shorten(
            `${event.endDate || "-"} ${
              event.endTime || ""
            }`,
            20
          ),
          shorten(
            current.dataPoints?.organizer,
            16
          ),
          shorten(event.audience, 19),
          shorten(current.status, 12),
          shorten(event.description, 18),
        ];
      }
    );

    const pages: string[][][] = [];

    if (tableRows.length === 0) {
      pages.push([]);
    } else {
      for (
        let index = 0;
        index < tableRows.length;
        index += rowsPerPage
      ) {
        pages.push(
          tableRows.slice(
            index,
            index + rowsPerPage
          )
        );
      }
    }

    const objects: string[] = [];
    const catalogId = 1;
    const pagesId = 2;
    const regularFontId = 3;
    const boldFontId = 4;

    const pageObjectIds: number[] = [];
    const contentObjectIds: number[] = [];
    let nextObjectId = 5;

    pages.forEach(() => {
      pageObjectIds.push(nextObjectId++);
      contentObjectIds.push(nextObjectId++);
    });

    objects[catalogId] =
      `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

    objects[regularFontId] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

    objects[boldFontId] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    const textCommand = (
      value: unknown,
      x: number,
      y: number,
      bold = false,
      size = 8
    ) =>
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(
        value
      )}) Tj ET`;

    pages.forEach((pageRows, pageIndex) => {
      const commands: string[] = [];

      // Document title.
      commands.push(
        textCommand(
          `Calendar Events - ${monthName} ${exportYear}`,
          marginX,
          555,
          true,
          16
        )
      );

      commands.push(
        textCommand(
          `Total Events: ${selected.length}`,
          marginX,
          535,
          false,
          9
        )
      );

      if (selected.length === 0) {
        commands.push(
          textCommand(
            "No calendar events found for the selected month and year.",
            marginX,
            495,
            false,
            11
          )
        );
      } else {
        let x = marginX;

        // Header background.
        commands.push(
          `0.93 g ${marginX} ${tableTop - headerHeight} 762 ${headerHeight} re f 0 g`
        );

        // Header labels.
        columns.forEach((column) => {
          commands.push(
            textCommand(
              column.label,
              x + 5,
              tableTop - 18,
              true,
              8
            )
          );
          x += column.width;
        });

        // Rows.
        pageRows.forEach(
          (row, rowIndex) => {
            const top =
              tableTop -
              headerHeight -
              rowIndex * rowHeight;
            const bottom =
              top - rowHeight;

            // Light alternating row background.
            if (rowIndex % 2 === 1) {
              commands.push(
                `0.97 g ${marginX} ${bottom} 762 ${rowHeight} re f 0 g`
              );
            }

            let cellX = marginX;

            row.forEach(
              (cell, columnIndex) => {
                commands.push(
                  textCommand(
                    cell,
                    cellX + 5,
                    bottom + 9,
                    false,
                    7
                  )
                );

                cellX +=
                  columns[columnIndex].width;
              }
            );
          }
        );

        // Table grid.
        const visibleRows =
          pageRows.length;
        const tableBottom =
          tableTop -
          headerHeight -
          visibleRows * rowHeight;

        commands.push(
          `0.75 G 0.5 w ${marginX} ${tableBottom} 762 ${
            headerHeight +
            visibleRows * rowHeight
          } re S`
        );

        let verticalX = marginX;

        columns
          .slice(0, -1)
          .forEach((column) => {
            verticalX += column.width;
            commands.push(
              `0.82 G 0.4 w ${verticalX} ${tableBottom} m ${verticalX} ${tableTop} l S`
            );
          });

        commands.push(
          `0.75 G 0.5 w ${marginX} ${
            tableTop - headerHeight
          } m ${marginX + 762} ${
            tableTop - headerHeight
          } l S`
        );

        for (
          let rowIndex = 1;
          rowIndex <= visibleRows;
          rowIndex++
        ) {
          const y =
            tableTop -
            headerHeight -
            rowIndex * rowHeight;

          commands.push(
            `0.86 G 0.35 w ${marginX} ${y} m ${
              marginX + 762
            } ${y} l S`
          );
        }
      }

      // Page number.
      commands.push(
        textCommand(
          `Page ${pageIndex + 1} of ${pages.length}`,
          730,
          25,
          false,
          8
        )
      );

      const content =
        commands.join("\n");

      const contentId =
        contentObjectIds[pageIndex];
      const pageId =
        pageObjectIds[pageIndex];

      objects[contentId] =
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

      objects[pageId] =
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    });

    objects[pagesId] =
      `<< /Type /Pages /Kids [${pageObjectIds
        .map((id) => `${id} 0 R`)
        .join(" ")}] /Count ${pageObjectIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    for (
      let id = 1;
      id < objects.length;
      id++
    ) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;

    pdf += `xref\n0 ${objects.length}\n`;
    pdf += "0000000000 65535 f \n";

    for (
      let id = 1;
      id < objects.length;
      id++
    ) {
      pdf += `${String(
        offsets[id]
      ).padStart(10, "0")} 00000 n \n`;
    }

    pdf +=
      `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob(
      [pdf],
      {
        type: "application/pdf",
      }
    );

    const url =
      URL.createObjectURL(blob);
    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `calendar-${monthName}-${exportYear}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setShowExportCalendar(false);
  }

  /* ========================================
     EDIT CALENDAR
  ======================================== */

  function openCalendarEdit() {
    if (
      !calendar ||
      !canManage ||
      isStudent
    ) {
      return;
    }

    setCalendarAcademicYear(
      calendar.academicYear || ""
    );

    setCalendarProgramme(
      calendar.programme || ""
    );

    setCalendarBranch(
      calendar.branch || ""
    );

    setCalendarYear(
      calendar.year || ""
    );

    setCalendarSemester(
      calendar.semester || ""
    );

    setCalendarScheme(
      calendar.scheme || ""
    );

    setCalendarStartDate(
      calendar.startDate || ""
    );

    setCalendarEndDate(
      calendar.endDate || ""
    );

    setShowCalendarEditModal(true);
  }

  function handleCalendarUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !calendar ||
      !canManage ||
      isStudent
    ) {
      return;
    }

    if (
      calendarEndDate &&
      calendarStartDate &&
      calendarEndDate < calendarStartDate
    ) {
      const labels =
        getCalendarDataLabels();

      alert(
        `${labels.endDate} cannot be before ${labels.startDate}.`
      );
      return;
    }

    const updatedCalendar =
      calendarService.updateCalendar(
        calendar.id,
        {
          title:
            isSuperAdmin || isPlatformAdmin
              ? calendar.title
              : `${calendarProgramme} ${calendarBranch} ${calendarSemester}`.trim() ||
                calendar.title,
          academicYear:
            calendarAcademicYear,
          programme:
            calendarProgramme,
          branch:
            calendarBranch,
          year:
            calendarYear,
          semester:
            calendarSemester,
          scheme:
            calendarScheme,
          startDate:
            calendarStartDate,
          endDate:
            calendarEndDate,
        }
      );

    if (updatedCalendar) {
      setCalendar(updatedCalendar);
    }

    setShowCalendarEditModal(false);
  }

  function handleCalendarDelete() {
    if (
      !calendar ||
      !canManage ||
      isStudent
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this calendar? All events in this calendar will also be deleted."
      );

    if (!confirmed) {
      return;
    }

    const deleted =
      calendarService.deleteCalendar(
        calendar.id
      );

    if (!deleted) {
      return;
    }

    setCalendar(null);
    setEvents([]);

    if (
      isSuperAdmin ||
      isPlatformAdmin
    ) {
      window.location.reload();
      return;
    }

    router.replace(
      "/calendar-management/create-calendar"
    );
  }

  /* ========================================
     RESET FORM
  ======================================== */

  function resetForm() {
    setEditingEvent(null);

    setTitle("");

    setEventType("");

    setStartDate("");

    setEndDate("");

    setStartTime("");

    setEndTime("");

    setAudience("");

    setDescription("");

    setEventDataPoints({});
    setShowAttachmentOptions(false);
    setAttachmentType("");
    setAttachmentValue("");
  }

  /* ========================================
     OPEN ADD EVENT
  ======================================== */

  function openAddEvent(
    selectedDate?: string
  ) {
    if (
      !canManage ||
      isStudent
    ) {
      return;
    }

    resetForm();

    if (selectedDate) {
      setStartDate(selectedDate);

      setEndDate(selectedDate);
    }

    setShowModal(true);
  }

  /* ========================================
     EVENT CLICK

     Student:
     View only

     Other allowed roles:
     Edit
  ======================================== */

  function openEvent(
    event: CalendarEvent
  ) {
    setEditingEvent(event);

    setTitle(event.title);

    setEventType(
      event.eventType
    );

    setStartDate(
      event.startDate
    );

    setEndDate(
      event.endDate
    );

    setStartTime(
      event.startTime || ""
    );

    setEndTime(
      event.endTime || ""
    );

    setAudience(
      event.audience || ""
    );

    setDescription(
      event.description || ""
    );

    setEventDataPoints(
      event.dataPoints || {}
    );

    setShowModal(true);
  }

  /* ========================================
     SAVE / UPDATE EVENT
  ======================================== */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /*
      Student cannot save anything.
    */

    if (
      !calendar ||
      !canManage ||
      isStudent
    ) {
      return;
    }

    if (
      !title ||
      !eventType ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime
    ) {
      alert(
        "Please fill all required fields."
      );

      return;
    }

    if (
      endDate <
      startDate
    ) {
      alert(
        "End Date cannot be before Start Date."
      );

      return;
    }

    if (editingEvent) {
      calendarService.updateEvent(
        editingEvent.id,
        {
          title,

          eventType,

          startDate,

          endDate,

          startTime,

          endTime,

          audience,

          description,

          dataPoints: eventDataPoints,

          color:
            editingEvent.color ||
            getEventColor(
              eventType
            ),
        }
      );
    } else {
      calendarService.createEvent({
        calendarId:
          calendar.id,

        title,

        eventType,

        startDate,

        endDate,

        startTime,

        endTime,

        audience,

        description,

        dataPoints: eventDataPoints,

        color:
          getEventColor(
            eventType
          ),
      });
    }

    refreshEvents();

    setShowModal(false);

    resetForm();
  }

  function getSpecificTenantOptions() {
    if (!loginData) return [];

    // Platform roles can publish to any tenant category.
    if (
      loginData.role === "SUPER_ADMIN" ||
      loginData.role === "PLATFORM_ADMIN"
    ) {
      return [
        { value: "UNIVERSITY", label: "University & College" },
        { value: "SKILL_ACADEMY", label: "Skill Academy" },
        { value: "BOOTCAMP", label: "Bootcamp" },
        { value: "CORPORATE", label: "Corporate" },
      ];
    }

    // Tenant roles can publish only inside their own tenant.
    const labels: Record<string, string> = {
      UNIVERSITY: "University & College",
      SKILL_ACADEMY: "Skill Academy",
      BOOTCAMP: "Bootcamp",
      CORPORATE: "Corporate",
    };

    return [
      {
        value: loginData.tenantType,
        label:
          labels[loginData.tenantType] ||
          loginData.displayTenant,
      },
    ];
  }

  function getSpecificActorOptions() {
    if (!loginData) return [];

    const learnerLabel =
      loginData.tenantType === "CORPORATE"
        ? "Employees"
        : loginData.tenantType === "BOOTCAMP"
          ? "Bootcamp Learners"
          : loginData.tenantType === "SKILL_ACADEMY"
            ? "Skill Academy Learners"
            : "Students";

    const facultyLabel =
      loginData.tenantType === "CORPORATE"
        ? "Trainers"
        : loginData.tenantType === "BOOTCAMP"
          ? "Instructors / Mentors"
          : loginData.tenantType === "SKILL_ACADEMY"
            ? "Trainers"
            : "Faculty";

    const instituteAdminLabel =
      loginData.tenantType === "CORPORATE"
        ? "Corporate Admins"
        : loginData.tenantType === "BOOTCAMP"
          ? "Bootcamp Admins"
          : loginData.tenantType === "SKILL_ACADEMY"
            ? "Skill Academy Admins"
            : "Institute Admins";

    switch (loginData.role) {
      case "SUPER_ADMIN":
        return [
          { value: "PLATFORM_ADMIN", label: "Platform Admins" },
          { value: "TENANT_ADMIN", label: instituteAdminLabel },
          { value: "COORDINATOR", label: "Coordinators" },
          { value: "FACULTY", label: facultyLabel },
          { value: "LEARNER", label: learnerLabel },
        ];

      case "PLATFORM_ADMIN":
        return [
          { value: "TENANT_ADMIN", label: instituteAdminLabel },
          { value: "COORDINATOR", label: "Coordinators" },
          { value: "FACULTY", label: facultyLabel },
          { value: "LEARNER", label: learnerLabel },
        ];

      case "TENANT_ADMIN":
        return [
          { value: "COORDINATOR", label: "Coordinators" },
          { value: "FACULTY", label: facultyLabel },
          { value: "LEARNER", label: learnerLabel },
        ];

      case "COORDINATOR":
        return [
          { value: "FACULTY", label: facultyLabel },
          { value: "LEARNER", label: learnerLabel },
        ];

      case "FACULTY":
        return [
          { value: "LEARNER", label: learnerLabel },
        ];

      default:
        return [];
    }
  }

  function buildPublishAudienceValue() {
    if (!loginData) return "";

    if (publishAudienceMode === "DEFAULT") {
      return `DEFAULT:${loginData.role}`;
    }

    if (!publishAudienceTarget) {
      return publishAudience;
    }

    if (
      publishTenantTarget &&
      publishAudienceTarget &&
      publishAudienceMode === "ACTOR"
    ) {
      return `TENANT_ACTOR:${publishTenantTarget}:${publishAudienceTarget}`;
    }

    if (
      publishAudienceMode === "TENANT" &&
      publishTenantTarget
    ) {
      return `TENANT:${publishTenantTarget}`;
    }

    return `${publishAudienceMode}:${publishAudienceTarget}`;
  }

  function openPublishForm(
    event: CalendarEvent
  ) {
    setPublishEvent(event);
    setPublishStartDate(event.startDate || "");
    setPublishEndDate(event.endDate || "");
    setPublishStartTime(event.startTime || "");
    setPublishEndTime(event.endTime || "");
    setPublishOrganizer(
      event.dataPoints?.organizer || ""
    );
    setPublishAction("PUBLISH");
    setShowAudienceOptions(false);
    setPublishAudienceMode("DEFAULT");
    setPublishAudienceTarget("");
    setPublishTenantTarget("");
    setPublishAudience("");
    setPublishAudienceMode("DEFAULT");
    setOpenActionEventId(null);
    setShowPublishModal(true);
  }

  function handlePublishEvent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!publishEvent) {
      return;
    }

    calendarService.updateEvent(
      publishEvent.id,
      {
        audience:
          buildPublishAudienceValue(),
        dataPoints: {
          ...(publishEvent.dataPoints || {}),
          organizer: publishOrganizer,
          publishMode: "PUBLISH",
        },
        status: "PUBLISHED",
      } as Partial<CalendarEvent>
    );

    refreshEvents();
    setShowPublishModal(false);
    setPublishEvent(null);
  }

  function handleAutoPublishSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !publishEvent ||
      !autoPublishDate ||
      !autoPublishTime
    ) {
      return;
    }

    const scheduledDateTime = new Date(
      `${autoPublishDate}T${autoPublishTime}:00`
    );

    if (
      Number.isNaN(
        scheduledDateTime.getTime()
      )
    ) {
      alert(
        "Please select a valid publish date and time."
      );
      return;
    }

    const publishImmediately =
      scheduledDateTime.getTime() <=
      Date.now();

    calendarService.updateEvent(
      publishEvent.id,
      {
        audience:
          buildPublishAudienceValue(),
        dataPoints: {
          ...(publishEvent.dataPoints || {}),
          organizer: publishOrganizer,
          publishMode: "AUTO_PUBLISH",
          autoPublishDate,
          autoPublishTime,
          scheduledAt:
            `${autoPublishDate}T${autoPublishTime}`,
        },
        status: publishImmediately
          ? "PUBLISHED"
          : "SCHEDULED",
      } as Partial<CalendarEvent>
    );

    refreshEvents();
    setShowAutoPublishModal(false);
    setShowPublishModal(false);
    setPublishEvent(null);
    setAutoPublishDate("");
    setAutoPublishTime("");
  }


  function getReuseTitle(
    event: CalendarEvent
  ) {
    const baseTitle =
      event.title.replace(/\s+\d+$/, "");

    let highestNumber = 1;

    events.forEach((existingEvent) => {
      const existingBase =
        existingEvent.title.replace(
          /\s+\d+$/,
          ""
        );

      if (existingBase !== baseTitle) {
        return;
      }

      const numberMatch =
        existingEvent.title.match(
          /\s+(\d+)$/
        );

      const number =
        numberMatch
          ? Number(numberMatch[1])
          : 1;

      highestNumber =
        Math.max(
          highestNumber,
          number
        );
    });

    return `${baseTitle} ${highestNumber + 1}`;
  }

  function handleReuseEvent(
    event: CalendarEvent
  ) {
    setEditingEvent(null);

    // Copy the same event details.
    // Only the title changes: Event, Event 2, Event 3...
    setTitle(getReuseTitle(event));
    setEventType(event.eventType);
    setDescription(event.description || "");
    setEventDataPoints(event.dataPoints || {});
    setStartDate(event.startDate || "");
    setEndDate(event.endDate || "");
    setStartTime(event.startTime || "");
    setEndTime(event.endTime || "");
    setAudience(event.audience || "");
    setOpenActionEventId(null);
    setShowModal(true);
  }

  /* ========================================
     DELETE EVENT
  ======================================== */

  function handleDelete() {
    if (
      !editingEvent ||
      !canManage ||
      isStudent
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) {
      return;
    }

    calendarService.deleteEvent(
      editingEvent.id
    );

    refreshEvents();

    setShowModal(false);

    resetForm();
  }

  /* ========================================
     DRAG / MOVE EVENT
  ======================================== */

  function handleEventMove(
    eventId: string,

    newStartDate: string,

    newEndDate: string
  ) {
    if (
      !canManage ||
      isStudent
    ) {
      return;
    }

    calendarService.updateEvent(
      eventId,
      {
        startDate:
          newStartDate,

        endDate:
          newEndDate,
      }
    );

    refreshEvents();
  }

  const showAdminEventFilters =
    loginData?.role === "SUPER_ADMIN" ||
    loginData?.role === "PLATFORM_ADMIN";

  const getFilterTenant = (event: CalendarEvent) => {
    const current = event as CalendarEvent & {
      tenantId?: string;
      dataPoints?: Record<string, string>;
    };

    const audience = event.audience || "";

    if (audience.startsWith("TENANT:")) {
      return audience.split(":")[1] || "";
    }

    if (audience.startsWith("TENANT_ACTOR:")) {
      return audience.split(":")[1] || "";
    }

    return (
      current.dataPoints?.targetTenant ||
      current.dataPoints?.tenantType ||
      current.tenantId ||
      ""
    );
  };

  const getFilterRole = (event: CalendarEvent) => {
    const audience = event.audience || "";

    if (audience.startsWith("ACTOR:")) {
      return audience.split(":")[1] || "";
    }

    if (audience.startsWith("TENANT_ACTOR:")) {
      return audience.split(":")[2] || "";
    }

    return "";
  };

  const filteredEvents = showAdminEventFilters
    ? events.filter((event) => {
        const current =
          event as CalendarEvent & {
            status?: string;
          };

        const tenant = getFilterTenant(event);
        const role = getFilterRole(event);
        const status = current.status || "DRAFT";

        return (
          (filterTenant === "ALL" ||
            tenant === filterTenant) &&
          (filterRole === "ALL" ||
            role === filterRole) &&
          (filterStatus === "ALL" ||
            status === filterStatus)
        );
      })
    : events;

  /* ========================================
     LOADING
  ======================================== */

  if (
    loading ||
    !loginData
  ) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        Loading Calendar...
      </div>
    );
  }

  /* ========================================
     PAGE UI
  ======================================== */

  return (
    <div className="calendarPage">
      <div className="dashboardLayout">
      {/* =====================================
          SIDEBAR
      ====================================== */}

      <CalendarSidebar />

      {/* =====================================
          MAIN
      ====================================== */}

      <div className="mainContent">
        {/* ===================================
            TOP HEADER
        ==================================== */}

        <header
          style={{
            minHeight: "70px",

            background: "#ffffff",

            borderBottom:
              "1px solid #e5e7eb",

            padding: "0 30px",

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "20px",
          }}
        >
          {/* LEFT HEADER */}

          <div>
            <h3
              style={{
                margin: 0,

                fontSize: "18px",
              }}
            >
              {getCalendarHeading()}
            </h3>

            <p
              style={{
                margin:
                  "4px 0 0 0",

                fontSize: "13px",

                color: "#6b7280",
              }}
            >
              {
                loginData.displayTenant
              }
            </p>
          </div>

          {/* RIGHT HEADER */}

          <div
            style={{
              textAlign:
                "right",
            }}
          >
            <strong>
              {
                isStudent
                  ? getTenantLearnerLabel()
                  : loginData.displayRole
              }
            </strong>

            {isStudent && (
              <div
                style={{
                  marginTop:
                    "3px",

                  fontSize:
                    "12px",

                  color:
                    "#6b7280",
                }}
              >
                View Only
              </div>
            )}
          </div>
        </header>

        {/* ===================================
            CONTENT
        ==================================== */}

        <main className="calendarManagementContent">
          {/* =================================
              TITLE / BUTTON
          ================================== */}

          <div className="calendarTopRow">
            <div>
              <h1
                style={{
                  margin:
                    "0 0 6px 0",

                  fontSize:
                    "28px",
                }}
              >
                {
                  getCalendarHeading()
                }
              </h1>

              <p
                style={{
                  margin: 0,

                  color:
                    "#6b7280",
                }}
              >
                {
                  getCalendarDescription()
                }
              </p>
            </div>

            {/* =================================
                ADD EVENT

                NEVER SHOW FOR STUDENT
            ================================== */}

            {canManage &&
              !isStudent && (
                <div className="calendarActions">
                  <button
                    type="button"
                    onClick={() =>
                      openAddEvent()
                    }
                    className="neoButton addEventButton"
                  >
                    + Add Event
                  </button>
                </div>
              )}
          </div>

          {/* =================================
              ROLE / TENANT CALENDAR DATA
          ================================== */}

          {/* Calendar content */}

          {showAdminEventFilters && (
            <div className="calendarFilters">
              <FormField label="Tenant">
                <select
                  value={filterTenant}
                  onChange={(event) =>
                    setFilterTenant(event.target.value)
                  }
                  className="calendarFilterSelect"
                  style={inputStyle}
                >
                  <option value="ALL">All Tenants</option>
                  <option value="UNIVERSITY">
                    University & College
                  </option>
                  <option value="SKILL_ACADEMY">
                    Skill Academy
                  </option>
                  <option value="BOOTCAMP">
                    Bootcamp
                  </option>
                  <option value="CORPORATE">
                    Corporate
                  </option>
                </select>
              </FormField>

              <FormField label="Role">
                <select
                  value={filterRole}
                  onChange={(event) =>
                    setFilterRole(event.target.value)
                  }
                  className="calendarFilterSelect"
                  style={inputStyle}
                >
                  <option value="ALL">All Roles</option>
                  <option value="TENANT_ADMIN">
                    Institute Admin
                  </option>
                  <option value="COORDINATOR">
                    Coordinator
                  </option>
                  <option value="FACULTY">
                    Faculty / Trainer
                  </option>
                  <option value="LEARNER">
                    Student / Learner / Employee
                  </option>
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value)
                  }
                  className="calendarFilterSelect"
                  style={inputStyle}
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </FormField>

              <FormField label="Clear">
                <button
                  type="button"
                  onClick={() => {
                    setFilterTenant("ALL");
                    setFilterRole("ALL");
                    setFilterStatus("ALL");
                  }}
                  className="neoButton clearButton"
                  style={{
                    ...inputStyle,
                    width: "100%",
                    height: "42px",
                    minHeight: "42px",
                    margin: 0,
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Clear
                </button>
              </FormField>
            </div>
          )}

          <div
            className={
              isStudent
                ? "calendarWorkspace student-calendar-layout"
                : "calendarWorkspace"
            }
          >
          {/* =================================
              CALENDAR
          ================================== */}

          {calendar ? (
            <div className="calendarPanel">
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowExportCalendar(true)
                  }
                  className="neoButton"
                >
                  Export Calendar
                </button>
              </div>

              <CalendarView
              events={
                Array.isArray(filteredEvents)
                  ? filteredEvents
                  : []
              }

              /*
                STUDENT:
                false

                Other allowed roles:
                true
              */

              canEdit={
                canManage &&
                !isStudent
              }

              /*
                Student cannot create
                by clicking a date.
              */

              onDateClick={undefined}

              /*
                Student CAN click an event
                to view its details.
              */

              onEventClick={undefined}

              /*
                Student cannot drag.
              */

              onEventMove={
                isStudent
                  ? undefined
                  : handleEventMove
              }
            />
            </div>
          ) : (
            <div
              style={{
                background:
                  "#ffffff",

                padding:
                  "40px",

                borderRadius:
                  "12px",

                border:
                  "1px solid #e5e7eb",
              }}
            >
              <h2>
                No Calendar Available
              </h2>

              <p
                style={{
                  color:
                    "#6b7280",
                }}
              >
                There is currently
                no calendar available
                for{" "}
                {
                  loginData.displayTenant
                }
                .
              </p>
            </div>
          )}

          {/* =================================
              SCHEDULED EVENTS SUMMARY
          ================================== */}

          {calendar && (
            <section className="schedulePanel">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "20px",
                    }}
                  >
                    Scheduled Events
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    View what is scheduled and when it will happen.
                  </p>
                </div>

                <span
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  No events scheduled yet.
                </div>
              ) : (
                <div className="eventScroll">
                  {[...filteredEvents]
                    .sort((a, b) => {
                      const first = `${a.startDate} ${a.startTime || "00:00"}`;
                      const second = `${b.startDate} ${b.startTime || "00:00"}`;
                      return first.localeCompare(second);
                    })
                    .map((scheduledEvent) => (
                      <div
                        key={
                          scheduledEvent.id
                        }
                        className="eventCard"
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background:
                                  getEventMarkerColor(
                                    events.findIndex(
                                      (event) =>
                                        event.id === scheduledEvent.id
                                    )
                                  ),
                                flexShrink: 0,
                              }}
                            />

                            <strong className="eventTitle">
                              {scheduledEvent.title}
                            </strong>
                          </div>

                          <span
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            {scheduledEvent.eventType}
                            {scheduledEvent.audience
                              ? ` • ${scheduledEvent.audience}`
                              : ""}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            textAlign: "right",
                          }}
                        >
                          <div>
                            {scheduledEvent.startDate}
                            {scheduledEvent.endDate !== scheduledEvent.startDate
                              ? ` → ${scheduledEvent.endDate}`
                              : ""}
                          </div>

                          {(scheduledEvent.startTime || scheduledEvent.endTime) && (
                            <div
                              style={{
                                marginTop: "3px",
                                color: "#6b7280",
                              }}
                            >
                              {scheduledEvent.startTime || "--:--"}
                              {scheduledEvent.endTime
                                ? ` - ${scheduledEvent.endTime}`
                                : ""}
                            </div>
                          )}

                          <div
                            style={{
                              marginTop: "7px",
                            }}
                          >
                            {(scheduledEvent as CalendarEvent & {
                              status?: string;
                            }).status === "PUBLISHED" ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "3px 8px",
                                  borderRadius: "999px",
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                Published
                              </span>
                            ) : (
                              (scheduledEvent as CalendarEvent & {
                                status?: string;
                              }).status === "SCHEDULED" && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "3px 8px",
                                    borderRadius: "999px",
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    border:
                                      "1px solid #fecaca",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Scheduled
                                </span>
                              )
                            )}

                            {(scheduledEvent as CalendarEvent & {
                              status?: string;
                            }).status === "SCHEDULED" && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "11px",
                                  color: "#6b7280",
                                }}
                              >
                                {scheduledEvent.startDate}{" "}
                                {scheduledEvent.startTime}
                                {" → "}
                                {scheduledEvent.endDate}{" "}
                                {scheduledEvent.endTime}
                              </div>
                            )}
                          </div>
                        </div>

                        {canManage && !isStudent && (
                          <div className="eventMenuWrap">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionEventId(
                                  (current) =>
                                    current === scheduledEvent.id
                                      ? null
                                      : scheduledEvent.id
                                );
                              }}
                              className="moreButton"
                            >
                              <span
                                style={{
                                  fontSize: "18px",
                                  lineHeight: 1,
                                }}
                              >
                                +
                              </span>
                              Action
                            </button>

                            {openActionEventId === scheduledEvent.id && (
                              <div
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className="eventMenu"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "calc(100% + 6px)",
                                  zIndex: 20,
                                  minWidth: "150px",
                                  padding: "6px",
                                  background: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionEventId(null);
                                    openEvent(scheduledEvent);
                                  }}
                                  style={actionMenuButtonStyle}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReuseEvent(
                                      scheduledEvent
                                    )
                                  }
                                  style={actionMenuButtonStyle}
                                >
                                  Reuse
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openPublishForm(
                                      scheduledEvent
                                    )
                                  }
                                  style={actionMenuButtonStyle}
                                >
                                  Publish
                                </button>

                                {(scheduledEvent as CalendarEvent & {
                                  status?: string;
                                }).status === "PUBLISHED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openReminderConfirmation(
                                        scheduledEvent
                                      )
                                    }
                                    style={actionMenuButtonStyle}
                                  >
                                    Send Reminder
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const confirmed =
                                      window.confirm(
                                        "Are you sure you want to delete this event?"
                                      );

                                    if (!confirmed) {
                                      return;
                                    }

                                    calendarService.deleteEvent(
                                      scheduledEvent.id
                                    );
                                    setOpenActionEventId(null);
                                    refreshEvents();
                                  }}
                                  style={{
                                    ...actionMenuButtonStyle,
                                    color: "#b91c1c",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}
          </div>
          <style jsx global>{`
            .student-calendar-layout > * {
              min-width: 0;
            }

            .student-calendar-layout .fc {
              min-width: 0;
            }

            .student-calendar-layout .fc-toolbar {
              flex-wrap: wrap;
              gap: 10px;
            }

            .student-calendar-layout .fc-toolbar-chunk {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 4px;
            }

            @media (max-width: 1180px) {
              .student-calendar-layout {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </main>
      </div>

      {/* =====================================
          EDIT CALENDAR MODAL
      ====================================== */}

      {showCalendarEditModal && calendar && (
        <div
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCalendarEditModal(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <form
            onSubmit={
              handleCalendarUpdate
            }
            style={{
              width: "100%",
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                Edit Calendar
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowCalendarEditModal(false)
                }
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {isSuperAdmin || isPlatformAdmin ? (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "18px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                {getCalendarDataPoints().map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "20px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <FormField label={getCalendarDataLabels().first}>
                  <input
                    type="text"
                    value={calendarAcademicYear}
                    onChange={(event) =>
                      setCalendarAcademicYear(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label={getCalendarDataLabels().second}>
                  <input
                    type="text"
                    value={calendarProgramme}
                    onChange={(event) =>
                      setCalendarProgramme(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label={getCalendarDataLabels().third}>
                  <input
                    type="text"
                    value={calendarBranch}
                    onChange={(event) =>
                      setCalendarBranch(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <FormField label={getCalendarDataLabels().fourth}>
                    <input
                      type="text"
                      value={calendarYear}
                      onChange={(event) =>
                        setCalendarYear(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label={getCalendarDataLabels().fifth}>
                    <input
                      type="text"
                      value={calendarSemester}
                      onChange={(event) =>
                        setCalendarSemester(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Scheme / Framework">
                  <input
                    type="text"
                    value={calendarScheme}
                    onChange={(event) =>
                      setCalendarScheme(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>
              </>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <FormField label={getCalendarDataLabels().startDate}>
                <input
                  type="date"
                  value={calendarStartDate}
                  onChange={(event) =>
                    setCalendarStartDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label={getCalendarDataLabels().endDate}>
                <input
                  type="date"
                  min={
                    calendarStartDate ||
                    undefined
                  }
                  value={calendarEndDate}
                  onChange={(event) =>
                    setCalendarEndDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setShowCalendarEditModal(false)
                }
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={primaryButton}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {showPublishModal && publishEvent && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPublishModal(false);
              setPublishEvent(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <form
            onSubmit={handlePublishEvent}
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "22px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Publish Event
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishEvent(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

<FormField label="Organizer">
              <input
                type="text"
                value={publishOrganizer}
                onChange={(event) =>
                  setPublishOrganizer(
                    event.target.value
                  )
                }
                placeholder="Enter organizer"
                style={inputStyle}
              />
            </FormField>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  position: "relative",
                  width: "fit-content",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#111827",
                  }}
                >
                  Audience
                </label>

                <button
                  type="button"
                  aria-label="Choose audience"
                  onClick={() =>
                    setShowAudienceOptions(
                      (current) => !current
                    )
                  }
                  style={{
                    width: "27px",
                    height: "27px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    borderRadius: "7px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    cursor: "pointer",
                    fontSize: "19px",
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>

                {showAudienceOptions && (
                  <div
                    style={{
                      position: "absolute",
                      top: "34px",
                      left: "78px",
                      zIndex: 60,
                      width: "205px",
                      padding: "6px",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      boxShadow:
                        "0 10px 25px rgba(15, 23, 42, 0.14)",
                    }}
                  >
                    {[
                      ["DEFAULT", "Default"],
                      ["TENANT", "Specific Tenant"],
                      ["ACTOR", "Specific Actor"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          if (value === "DEFAULT") {
                            setPublishAudienceMode("DEFAULT");
                            setPublishAudienceTarget("");
                            setPublishTenantTarget("");
                            setPublishAudience(
                              `DEFAULT:${loginData?.role || ""}`
                            );
                            setShowAudienceOptions(false);
                            return;
                          }

                          if (value === "TENANT") {
                            setPublishAudienceMode("TENANT");
                            setPublishAudienceTarget("");
                            setPublishTenantTarget("");
                            setPublishAudience("");
                            return;
                          }

                          // Actor selection is always the second step.
                          // Keep the tenant already selected.
                          setPublishAudienceMode("ACTOR");
                          setPublishAudienceTarget("");
                          setPublishAudience(
                            publishTenantTarget
                              ? `TENANT:${publishTenantTarget}`
                              : ""
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#ffffff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: "#111827",
                        }}
                      >
                        {label}
                        <span
                          style={{
                            float: "right",
                            color: "#9ca3af",
                          }}
                        >
                          {value === "DEFAULT" ? "" : "›"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showAudienceOptions &&
                  publishAudienceMode === "TENANT" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "34px",
                        left: "291px",
                        zIndex: 61,
                        width: "220px",
                        padding: "6px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        boxShadow:
                          "0 10px 25px rgba(15, 23, 42, 0.14)",
                      }}
                    >
                      <div
                        style={{
                          padding: "7px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Select Tenant
                      </div>

                      {getSpecificTenantOptions().map(
                        (tenant) => (
                          <button
                            key={tenant.value}
                            type="button"
                            onClick={() => {
                              setPublishTenantTarget(
                                tenant.value
                              );
                              setPublishAudienceTarget(
                                tenant.value
                              );
                              setPublishAudience(
                                `TENANT:${tenant.value}`
                              );

                              // Tenant is step 1. Immediately continue
                              // to step 2 so the actor can be selected.
                              setPublishAudienceMode("ACTOR");
                              setShowAudienceOptions(true);
                            }}
                            style={{
                              width: "100%",
                              padding: "9px 10px",
                              border: "none",
                              borderRadius: "7px",
                              background: "#ffffff",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "13px",
                              color: "#111827",
                            }}
                          >
                            {tenant.label}
                          </button>
                        )
                      )}
                    </div>
                  )}

                {showAudienceOptions &&
                  publishAudienceMode === "ACTOR" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "34px",
                        left: "291px",
                        zIndex: 61,
                        width: "220px",
                        padding: "6px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        boxShadow:
                          "0 10px 25px rgba(15, 23, 42, 0.14)",
                      }}
                    >
                      <div
                        style={{
                          padding: "7px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Select Actor
                      </div>

                      {getSpecificActorOptions().map(
                        (actor) => (
                          <button
                            key={actor.value}
                            type="button"
                            onClick={() => {
                              setPublishAudienceTarget(
                                actor.value
                              );
                              setPublishAudience(
                                publishTenantTarget
                                  ? `TENANT_ACTOR:${publishTenantTarget}:${actor.value}`
                                  : `ACTOR:${actor.value}`
                              );
                              setShowAudienceOptions(false);
                            }}
                            style={{
                              width: "100%",
                              padding: "9px 10px",
                              border: "none",
                              borderRadius: "7px",
                              background: "#ffffff",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "13px",
                              color: "#111827",
                            }}
                          >
                            {actor.label}
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>

              {publishAudienceMode === "DEFAULT" &&
                publishAudience && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                      color: "#4b5563",
                    }}
                  >
                    Default audience selected: all allowed users below your role.
                  </div>
                )}

              {(publishTenantTarget ||
                publishAudienceTarget) && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                    color: "#4b5563",
                  }}
                >
                  {publishTenantTarget && (
                    <div>
                      Selected tenant:{" "}
                      {
                        getSpecificTenantOptions().find(
                          (tenant) =>
                            tenant.value ===
                            publishTenantTarget
                        )?.label
                      }
                    </div>
                  )}

                  {publishAudienceTarget && (
                      <div
                        style={{
                          marginTop: publishTenantTarget
                            ? "4px"
                            : "0",
                        }}
                      >
                        Selected actor:{" "}
                        {
                          getSpecificActorOptions().find(
                            (actor) =>
                              actor.value ===
                              publishAudienceTarget
                          )?.label
                        }
                      </div>
                    )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishEvent(null);
                }}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishAction("AUTO_PUBLISH");
                  setAutoPublishDate("");
                  setAutoPublishTime("");

                  // Close the first Publish form and open the
                  // dedicated Auto Publish scheduling form.
                  setShowPublishModal(false);
                  setShowAutoPublishModal(true);
                }}
                style={{
                  ...primaryButton,
                  background: "#ffffff",
                  color: "#4f46e5",
                  border: "1px solid #4f46e5",
                }}
              >
                Auto Publish
              </button>

              <button
                type="submit"
                onClick={() =>
                  setPublishAction("PUBLISH")
                }
                style={primaryButton}
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      )}

      {reminderEvent && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setReminderEvent(null);
            }
          }}
        >
          <div
            style={{
              ...modalStyle,
              maxWidth: "480px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                Send Reminder
              </h2>

              <button
                type="button"
                onClick={() =>
                  setReminderEvent(null)
                }
                aria-label="Close reminder"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  lineHeight: 1,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                margin:
                  "0 0 10px",
                color: "#374151",
                lineHeight: 1.6,
              }}
            >
              Send reminder notification to
              the selected audience for{" "}
              <strong>
                {reminderEvent.title}
              </strong>
              ?
            </p>

            <div
              style={{
                padding: "12px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "#f9fafb",
                color: "#4b5563",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              <div>
                <strong>Date:</strong>{" "}
                {reminderEvent.startDate ||
                  "-"}
                {reminderEvent.endDate &&
                reminderEvent.endDate !==
                  reminderEvent.startDate
                  ? ` - ${reminderEvent.endDate}`
                  : ""}
              </div>

              <div>
                <strong>Time:</strong>{" "}
                {reminderEvent.startTime ||
                  "-"}
                {reminderEvent.endTime
                  ? ` - ${reminderEvent.endTime}`
                  : ""}
              </div>

              <div>
                <strong>Audience:</strong>{" "}
                {reminderEvent.audience ||
                  "-"}
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <FormField label="Description">
                <textarea
                  value={reminderDescription}
                  onChange={(event) =>
                    setReminderDescription(event.target.value)
                  }
                  placeholder="Write reminder description..."
                  maxLength={250}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "none",
                  }}
                />
              </FormField>
              <div
                style={{
                  marginTop: "5px",
                  textAlign: "right",
                  color: "#9ca3af",
                  fontSize: "11px",
                }}
              >
                {reminderDescription.length}/250
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setReminderEvent(null)
                }
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendReminder}
                style={primaryButton}
              >
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportCalendar && (
        <div style={overlayStyle} onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowExportCalendar(false);
        }}>
          <div style={{...modalStyle,maxWidth:"460px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h2 style={{margin:0}}>Export Calendar PDF</h2>
              <button type="button" onClick={() => setShowExportCalendar(false)}
                style={{border:"none",background:"transparent",fontSize:"24px",cursor:"pointer"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"15px"}}>
              <FormField label="Month">
                <select value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} style={inputStyle}>
                  <option value="">Select Month</option>
                  {EXPORT_MONTHS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </FormField>
              <FormField label="Year">
                <select value={exportYear} onChange={(e) => setExportYear(e.target.value)} style={inputStyle}>
                  {Array.from({length:11},(_,i)=>new Date().getFullYear()-5+i).map((year) =>
                    <option key={year} value={String(year)}>{year}</option>
                  )}
                </select>
              </FormField>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"20px"}}>
              <button type="button" onClick={() => setShowExportCalendar(false)} style={secondaryButton}>Cancel</button>
              <button type="button" onClick={handleExportCalendar} style={primaryButton}>Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {showAutoPublishModal && publishEvent && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAutoPublishModal(false);
            }
          }}
        >
          <form
            onSubmit={handleAutoPublishSave}
            style={{
              ...modalStyle,
              maxWidth: "460px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Schedule Auto Publish
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowAutoPublishModal(false);
                  setShowPublishModal(true);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "15px",
              }}
            >
              <FormField label="Publish Date">
                <input
                  type="date"
                  required
                  value={autoPublishDate}
                  onChange={(event) =>
                    setAutoPublishDate(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Publish Time">
                <input
                  type="time"
                  required
                  value={autoPublishTime}
                  onChange={(event) =>
                    setAutoPublishTime(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAutoPublishModal(false);
                  setShowPublishModal(true);
                }}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={primaryButton}
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================
          EVENT MODAL
      ====================================== */}

      {showModal && (
        <div
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowModal(
                false
              );

              resetForm();
            }
          }}
          style={{
            position: "fixed",

            inset: 0,

            zIndex: 1000,

            background:
              "rgba(15, 23, 42, 0.45)",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding: "20px",
          }}
        >
          <form
            onSubmit={
              handleSubmit
            }
            style={{
              width: "100%",

              maxWidth:
                "560px",

              maxHeight:
                "90vh",

              overflowY:
                "auto",

              background:
                "#ffffff",

              borderRadius:
                "14px",

              padding:
                "26px",

              boxShadow:
                "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            {/* =================================
                MODAL HEADER
            ================================== */}

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  "22px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                {isStudent
                  ? "Event Details"
                  : editingEvent
                    ? "Edit Event"
                    : "Add Event"}
              </h2>

              <button
                type="button"

                onClick={() => {
                  setShowModal(
                    false
                  );

                  resetForm();
                }}

                style={{
                  border:
                    "none",

                  background:
                    "transparent",

                  fontSize:
                    "24px",

                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* =================================
                EVENT TITLE / CATEGORY
            ================================== */}

            <FormField label="Event Title">
              {isStudent ? (
                <input
                  type="text"
                  value={title}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#f9fafb",
                  }}
                />
              ) : (
                <ScrollableEventDropdown
                  value={title}
                  placeholder="Select or search Event Title"
                  options={getDocumentEventOptions(loginData).map(
                    (option) => option.title
                  )}
                  onChange={(selectedTitle) => {
                    setTitle(selectedTitle);
                    // Clear the previous subtitle whenever the category/title changes.
                    setEventType("");
                  }}
                />
              )}
            </FormField>

            {/* =================================
                EVENT SUBTITLE / RELATED OPTION
            ================================== */}

            <FormField label="Event Subtitle">
              {isStudent ? (
                <input
                  type="text"
                  value={eventType}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#f9fafb",
                  }}
                />
              ) : (
                <ScrollableEventDropdown
                  value={eventType}
                  placeholder={
                    title
                      ? "Select or search Event Subtitle"
                      : "Select Event Title first"
                  }
                  options={
                    getDocumentEventOptions(loginData).find(
                      (option) => option.title === title
                    )?.subtitles || []
                  }
                  onChange={(selectedSubtitle) =>
                    setEventType(selectedSubtitle)
                  }
                  disabled={!title}
                />
              )}
            </FormField>

            {/* =================================
                EVENT DATE & TIME
            ================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "15px",
              }}
            >
              <FormField label="Start Date">
                <input
                  type="date"
                  required={!isStudent}
                  value={startDate}
                  readOnly={isStudent}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    background: isStudent
                      ? "#f9fafb"
                      : "#ffffff",
                  }}
                />
              </FormField>

              <FormField label="End Date">
                <input
                  type="date"
                  required={!isStudent}
                  min={
                    startDate || undefined
                  }
                  value={endDate}
                  readOnly={isStudent}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    background: isStudent
                      ? "#f9fafb"
                      : "#ffffff",
                  }}
                />
              </FormField>

              <FormField label="Start Time">
                <input
                  type="time"
                  required={!isStudent}
                  value={startTime}
                  readOnly={isStudent}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    background: isStudent
                      ? "#f9fafb"
                      : "#ffffff",
                  }}
                />
              </FormField>

              <FormField label="End Time">
                <input
                  type="time"
                  required={!isStudent}
                  value={endTime}
                  readOnly={isStudent}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    background: isStudent
                      ? "#f9fafb"
                      : "#ffffff",
                  }}
                />
              </FormField>
            </div>

            {/* =================================
                ROLE / TENANT DATA POINTS
            ================================== */}

            {getDataPointsForContext(loginData)
              .filter(
                (dataPoint) =>
                  dataPoint.label !== "Organizer"
              )
              .map((dataPoint) => {
              const dropdownOptions =
                getDropdownOptionsForDataPoint(dataPoint);

              return (
                <FormField
                  key={dataPoint.key}
                  label={dataPoint.label}
                >
                  {dropdownOptions && !isStudent ? (
                    <select
                      value={eventDataPoints[dataPoint.key] || ""}
                      onChange={(event) =>
                        setEventDataPoints((current) => ({
                          ...current,
                          [dataPoint.key]: event.target.value,
                        }))
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select {dataPoint.label}
                      </option>

                      {dropdownOptions.map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={eventDataPoints[dataPoint.key] || ""}
                      readOnly={isStudent}
                      placeholder={dataPoint.placeholder || ""}
                      onChange={(event) =>
                        setEventDataPoints((current) => ({
                          ...current,
                          [dataPoint.key]: event.target.value,
                        }))
                      }
                      style={{
                        ...inputStyle,
                        background: isStudent ? "#f9fafb" : "#ffffff",
                      }}
                    />
                  )}
                </FormField>
              );
            })}

            {/* =================================
                ATTACHMENTS
            ================================== */}

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  position: "relative",
                  width: "fit-content",
                }}
              >
                <label>
                  Attachments
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setShowAttachmentActionMenu(
                      (current) => !current
                    )
                  }
                  disabled={isStudent}
                  style={{
                    width: "26px",
                    height: "26px",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "18px",
                    fontWeight: 400,
                    lineHeight: 1,
                    cursor: isStudent
                      ? "default"
                      : "pointer",
                    flexShrink: 0,
                  }}
                  aria-label="Add attachment"
                >
                  +
                </button>

                {showAttachmentActionMenu &&
                  !isStudent && (
                    <div
                      style={{
                        position: "absolute",
                        top: "34px",
                        left: "100%",
                        zIndex: 70,
                        width: "175px",
                        padding: "6px",
                        borderRadius: "10px",
                        border:
                          "1px solid #e5e7eb",
                        background: "#ffffff",
                        boxShadow:
                          "0 10px 25px rgba(15, 23, 42, 0.14)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentType("link");
                          setAttachmentValue("");
                          setShowAttachmentOptions(true);
                          setShowAttachmentActionMenu(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#ffffff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: "#111827",
                        }}
                      >
                        Attach Link
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentType("document");
                          setAttachmentValue("");
                          setShowAttachmentOptions(true);
                          setShowAttachmentActionMenu(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#ffffff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: "#111827",
                        }}
                      >
                        Choose File
                      </button>
                    </div>
                  )}
              </div>

              {showAttachmentOptions &&
                !isStudent &&
                attachmentType === "link" && (
                  <input
                    type="url"
                    value={attachmentValue}
                    placeholder="Attach Link"
                    onChange={(event) =>
                      setAttachmentValue(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                )}

              {showAttachmentOptions &&
                !isStudent &&
                attachmentType === "document" && (
                  <input
                    type="file"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0];

                      if (!file) return;

                      setAttachmentValue(
                        file.name
                      );
                    }}
                    style={inputStyle}
                  />
                )}
            </div>

            {/* =================================
                DESCRIPTION
            ================================== */}

            <FormField
              label="Description"
            >
              <textarea
                rows={4}

                value={
                  description
                }

                maxLength={250}

                readOnly={
                  isStudent
                }

                onChange={(
                  event
                ) =>
                  setDescription(
                    event.target.value
                  )
                }

                style={{
                  ...inputStyle,

                  resize:
                    "none",

                  background:
                    isStudent
                      ? "#f9fafb"
                      : "#ffffff",
                }}
              />

              <div
                style={{
                  marginTop: "5px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                {description.length}/250
              </div>
            </FormField>

            {/* =================================
                STUDENT BUTTON
            ================================== */}

            {isStudent ? (
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  marginTop:
                    "24px",
                }}
              >
                <button
                  type="button"

                  onClick={() => {
                    setShowModal(
                      false
                    );

                    resetForm();
                  }}

                  style={
                    primaryButton
                  }
                >
                  Close
                </button>
              </div>
            ) : (
              /* =================================
                 EDIT / ADD BUTTONS
              ================================== */

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    "12px",

                  marginTop:
                    "25px",
                }}
              >
                {/* DELETE */}

                <div>
                  {editingEvent && (
                    <button
                      type="button"

                      onClick={
                        handleDelete
                      }

                      style={{
                        padding:
                          "10px 17px",

                        background:
                          "#fee2e2",

                        color:
                          "#b91c1c",

                        border:
                          "1px solid #fecaca",

                        borderRadius:
                          "7px",

                        cursor:
                          "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display:
                      "flex",

                    gap:
                      "10px",
                  }}
                >
                  {/* CANCEL */}

                  <button
                    type="button"

                    onClick={() => {
                      setShowModal(
                        false
                      );

                      resetForm();
                    }}

                    style={{
                      padding:
                        "10px 17px",

                      background:
                        "#ffffff",

                      border:
                        "1px solid #d1d5db",

                      borderRadius:
                        "7px",

                      cursor:
                        "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  {/* SAVE */}

                  <button
                    type="submit"

                    style={
                      primaryButton
                    }
                  >
                    {editingEvent
                      ? "Update Event"
                      : "Save Event"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
    </div>
  );
}

/* ========================================
   FORM FIELD
======================================== */

function FormField({
  label,
  children,
}: {
  label: string;

  children: ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom:
          "16px",
      }}
    >
      <label
        style={{
          display:
            "block",

          marginBottom:
            "7px",

          fontWeight:
            500,

          color:
            "#111827",
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* ========================================
   EVENT COLOUR
======================================== */

function getEventColor(
  eventType: string
) {
  if (
    eventType.includes(
      "Examination"
    ) ||
    eventType.includes(
      "Assessment"
    )
  ) {
    return "#ef4444";
  }

  if (
    eventType ===
    "Holiday"
  ) {
    return "#f59e0b";
  }

  if (
    eventType.includes(
      "Lab"
    )
  ) {
    return "#8b5cf6";
  }

  if (
    eventType.includes(
      "Assignment"
    )
  ) {
    return "#0ea5e9";
  }

  if (
    eventType.includes(
      "Workshop"
    )
  ) {
    return "#10b981";
  }

  if (
    eventType.includes(
      "Project"
    )
  ) {
    return "#f97316";
  }

  return "#4f46e5";
}

/* ========================================
   INPUT STYLE
======================================== */

const inputStyle = {
  width: "100%",

  padding:
    "10px 11px",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "7px",

  outline:
    "none",

  boxSizing:
    "border-box" as const,

  fontSize:
    "14px",
};

const secondaryButton = {
  padding:
    "10px 18px",

  background:
    "#ffffff",

  color:
    "#374151",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "7px",

  cursor:
    "pointer",

  fontWeight:
    600,
};

const deleteButton = {
  padding:
    "10px 18px",

  background:
    "#fee2e2",

  color:
    "#b91c1c",

  border:
    "1px solid #fecaca",

  borderRadius:
    "7px",

  cursor:
    "pointer",

  fontWeight:
    600,
};

/* ========================================
   PRIMARY BUTTON
======================================== */

const primaryButton = {
  padding:
    "10px 18px",

  background:
    "#4f46e5",

  color:
    "#ffffff",

  border:
    "none",

  borderRadius:
    "7px",

  cursor:
    "pointer",

  fontWeight:
    600,
};

