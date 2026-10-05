"use client";



import Image from "next/image";

import { FormEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import "./add-event.css";



const icons = {

  heading: "/assets/calendar-icons/frame.svg", 

  close: "/assets/calendar-icons/cancel.svg",           

  dropdown: "/assets/calendar-icons/arrowdown.svg",      

  calendar: "/assets/calendar-icons/calendar.svg",           

  clock: "/assets/calendar-icons/alarm-clock.svg",              

  attachment: "/assets/calendar-icons/cloudupload.svg",

  arrowLeft: "/assets/calendar-icons/arrowleft.svg",

  arrowRight: "/assets/calendar-icons/arrowright.svg",    

};



const API_URL = process.env.NEXT_PUBLIC_API_URL || "http\://localhost:3000";



type EventTitleSubtitleMap = Record<string, string[]>;



const eventDataByTenant: Record<string, EventTitleSubtitleMap> = {

  "SUPER_ADMIN": {

    "Platform Communication": [

      "Platform Announcement",

      "Important Notice",

      "Training Announcement",

      "Holiday Announcement",

      "Maintenance Announcement",

      "Feature Release Announcement",

      "Service Update"

    ],

    "Institute & Tenant Management": [

      "Institute Onboarding",

      "Institute Orientation",

      "Institute Review",

      "Institute Access Review",

      "Institute Renewal",

      "Tenant Activation",

      "Tenant Deactivation",

      "Institute Configuration Review"

    ],

    "Administration & Access Management": [

      "Admin Meeting",

      "Admin Training",

      "Platform Orientation",

      "User Access Review",

      "Role & Permission Review",

      "Administrator Access Review",

      "Privileged Access Review",

      "Access Audit"

    ],

    "Policy, Compliance & Governance": [

      "Policy Update",

      "Compliance Review",

      "Governance Review",

      "Security Policy Review",

      "Privacy Review",

      "Regulatory Review",

      "Audit Review",

      "Content Governance Review"

    ],

    "Subscription & Licensing": [

      "Subscription Renewal",

      "Subscription Expiry",

      "License Renewal",

      "License Expiry",

      "Institute Renewal",

      "Plan Upgrade / Downgrade",

      "Subscription Review",

      "License Allocation Review"

    ],

    "Platform Monitoring & Performance": [

      "Usage Review",

      "Performance Review",

      "Platform Health Review",

      "Capacity Review",

      "Adoption Review",

      "Activity Review",

      "System Performance Review",

      "Service Availability Review"

    ],

    "Reports & Analytics Review": [

      "Reports Review",

      "Usage Analytics Review",

      "Institute Analytics Review",

      "Compliance Report Review",

      "Adoption Report Review",

      "Performance Report Review",

      "Executive Dashboard Review"

    ],

    "Support & Feedback Management": [

      "Feedback Review",

      "Support Review",

      "Institute Feedback Review",

      "Escalation Review",

      "Support Performance Review",

      "Service Issue Review",

      "Resolution Review"

    ],

    "Content & Academic Governance": [

      "Content Governance Review",

      "Learning Content Review",

      "Academic Calendar Review",

      "Course Content Review",

      "Content Compliance Review",

      "Publishing Review",

      "Content Quality Review"

    ],

    "Meetings & Stakeholder Engagement": [

      "Stakeholder Meeting",

      "Admin Meeting",

      "Institute Meeting",

      "Leadership Meeting",

      "Governance Meeting",

      "Partner Meeting",

      "Review Meeting",

      "Webinar"

    ],

    "Periodic & Strategic Reviews": [

      "Quarterly Review",

      "Annual Review",

      "Monthly Review",

      "Strategic Review",

      "Platform Roadmap Review",

      "Service Review",

      "Institute Portfolio Review",

      "Annual Planning Review"

    ]

  },

  "PLATFORM_ADMIN": {

    "Platform Operations & Maintenance": [

      "LMS Maintenance",

      "Scheduled Maintenance",

      "System Downtime",

      "Platform Upgrade",

      "Infrastructure Maintenance",

      "Maintenance Completion"

    ],

    "Modules & Feature Management": [

      "Module Update",

      "Assessment Module Update",

      "Attendance Module Update",

      "Calendar Update",

      "Reporting Update",

      "Notification Update",

      "Feature Enablement",

      "Feature Configuration"

    ],

    "Release & Change Management": [

      "Release Review",

      "New Release",

      "Feature Release",

      "Version Upgrade",

      "Change Review",

      "Deployment Window",

      "Release Validation",

      "Post-Release Review"

    ],

    "User, Role & Access Management": [

      "User Management Review",

      "Access Review",

      "Role Review",

      "Permission Review",

      "Privileged Access Review",

      "User Activation / Deactivation",

      "Access Audit"

    ],

    "Content & Course Administration": [

      "Content Review",

      "Course Publishing Window",

      "Course Publishing Review",

      "Content Approval",

      "Content Quality Review",

      "Content Update",

      "Course Archive"

    ],

    "Integration & Configuration": [

      "Integration Update",

      "Integration Review",

      "API Configuration",

      "SSO Configuration",

      "External System Integration",

      "Platform Configuration",

      "Notification Configuration"

    ],

    "System Monitoring & Performance": [

      "System Health Review",

      "Performance Review",

      "Availability Review",

      "Capacity Review",

      "Error / Incident Review",

      "Usage Monitoring",

      "Security Health Review"

    ],

    "Training & Orientation": [

      "Feature Training",

      "Admin Training",

      "Platform Orientation",

      "Module Training",

      "Configuration Training",

      "Refresher Training",

      "Release Training"

    ],

    "Support & Issue Management": [

      "Support Session",

      "Technical Support",

      "Admin Support",

      "Issue Review",

      "Incident Review",

      "Escalation Review",

      "Resolution Review",

      "Troubleshooting Session"

    ]

  },

  "UNIVERSITY": {

    "Academic Calendar": [

      "Academic Year Start",

      "Academic Year End",

      "Semester Start",

      "Semester End",

      "Term / Trimester Dates",

      "Academic Milestone",

      "Academic Holiday",

      "Institutional Closure"

    ],

    "Registration & Enrollment": [

      "Course Registration",

      "Registration Opening",

      "Registration Deadline",

      "Course Enrollment",

      "Enrollment Deadline",

      "Add / Drop Period",

      "Course Withdrawal",

      "Re-registration"

    ],

    "Classes & Learning Activities": [

      "Lecture",

      "Guest / Expert Lecture",

      "Lab Session",

      "Practical Session",

      "Tutorial",

      "Workshop",

      "Seminar",

      "Training Session",

      "Orientation Program",

      "Class Schedule",

      "Timetable Update",

      "Field Visit",

      "Industrial Visit",

      "Study Tour"

    ],

    "Assignments & Assessments": [

      "Assignment Publication",

      "Assignment Submission",

      "Assignment Deadline",

      "Quiz",

      "Class Test",

      "Internal Assessment",

      "Continuous Assessment",

      "Presentation",

      "Viva / Oral Assessment",

      "Practical Assessment"

    ],

    "Examinations & Results": [

      "Mid-Semester Examination",

      "End-Semester Examination",

      "University Examination",

      "Supplementary Examination",

      "Re-examination",

      "Examination Registration",

      "Examination Deadline",

      "Hall Ticket / Admit Card",

      "Result Publication",

      "Revaluation"

    ],

    "Projects & Research": [

      "Project Allocation",

      "Project Review",

      "Project Presentation",

      "Project Submission",

      "Project Deadline",

      "Dissertation",

      "Thesis",

      "Research Review",

      "Research Presentation",

      "Research Submission"

    ],

    "Academic Progress & Student Support": [

      "Attendance Review",

      "Attendance Shortage Notice",

      "Academic Progress Review",

      "Mentoring Session",

      "Academic Advising",

      "Remedial Session",

      "Student Counseling",

      "Parent Meeting"

    ],

    "Career & Professional Development": [

      "Placement Training",

      "Placement Drive",

      "Career Guidance",

      "Internship",

      "Internship Application",

      "Internship Deadline",

      "Internship Review",

      "Internship Completion",

      "Skill Development Program",

      "Certification Program"

    ],

    "Academic Meetings & Governance": [

      "Faculty Meeting",

      "Department Meeting",

      "Academic Review Meeting",

      "Curriculum Meeting",

      "Board of Studies Meeting",

      "Committee Meeting",

      "Course Review Meeting",

      "Student Review Meeting"

    ],

    "Institutional & Student Events": [

      "Convocation",

      "Graduation Ceremony",

      "Annual Day",

      "College / University Event",

      "Department Event",

      "Student Club Event",

      "Cultural Event",

      "Sports Event",

      "Competition",

      "Conference",

      "Symposium"

    ]

  },

  "SKILL_ACADEMY": {

    "Program & Batch Management": [

      "Program Launch",

      "Program Completion",

      "Batch Start",

      "Batch End",

      "Batch Schedule",

      "Batch Update",

      "Learner Orientation"

    ],

    "Enrollment & Access": [

      "Course Enrollment",

      "Enrollment Opening",

      "Enrollment Deadline",

      "Enrollment Confirmation",

      "Course Access Start",

      "Course Access End",

      "Re-enrollment"

    ],

    "Training & Learning Activities": [

      "Training Session",

      "Trainer-led Session",

      "Module Start",

      "Module Completion",

      "Practical Session",

      "Hands-on Practice",

      "Skill Workshop",

      "Academy Workshop",

      "Live Session",

      "Expert Session",

      "Industry Session"

    ],

    "Assignments & Assessments": [

      "Assignment",

      "Assignment Deadline",

      "Practice Test",

      "Quiz",

      "Skill Assessment",

      "Practical Assessment",

      "Module Assessment",

      "Final Assessment",

      "Assessment Deadline",

      "Assessment Result"

    ],

    "Projects & Capstone": [

      "Project Start",

      "Project Milestone",

      "Project Review",

      "Project Presentation",

      "Project Submission",

      "Project Deadline",

      "Capstone Project",

      "Capstone Review",

      "Capstone Submission"

    ],

    "Learner Support & Mentoring": [

      "Mentor Session",

      "Doubt Clearing Session",

      "Learner Support Session",

      "One-to-One Mentoring",

      "Group Mentoring",

      "Progress Review",

      "Performance Feedback",

      "Remedial Session"

    ],

    "Industry & Career Development": [

      "Industry Session",

      "Industry Expert Talk",

      "Career Guidance",

      "Resume Preparation",

      "Mock Interview",

      "Interview Preparation",

      "Placement Preparation",

      "Placement Drive",

      "Employer Interaction",

      "Job Readiness Session"

    ],

    "Certification": [

      "Certification Preparation",

      "Certification Registration",

      "Certification Exam",

      "Certification Deadline",

      "Certification Result",

      "Certification Completion",

      "Certificate Issuance",

      "Certificate Renewal"

    ],

    "Academy Events & Engagement": [

      "Academy Workshop",

      "Webinar",

      "Seminar",

      "Bootcamp",

      "Hackathon",

      "Competition",

      "Community Event",

      "Networking Session",

      "Learner Showcase",

      "Demo Day"

    ],

    "Academy Calendar & Notices": [

      "Academy Holiday",

      "Training Holiday",

      "Schedule Change",

      "Session Rescheduling",

      "Academy Closure",

      "Important Deadline",

      "General Announcement"

    ]

  },

  "BOOTCAMP": {

    "Bootcamp & Cohort Management": [

      "Bootcamp Kickoff",

      "Bootcamp Completion",

      "Cohort Start",

      "Cohort End",

      "Cohort Orientation",

      "Cohort Schedule",

      "Cohort Update"

    ],

    "Modules & Learning Sessions": [

      "Module Start",

      "Module Completion",

      "Module Deadline",

      "Live Session",

      "Technical Session",

      "Live Coding Session",

      "Practice Session",

      "Instructor-led Session",

      "Workshop",

      "Expert Session"

    ],

    "Assignments & Coding Challenges": [

      "Assignment",

      "Assignment Deadline",

      "Coding Challenge",

      "Challenge Deadline",

      "Practice Challenge",

      "Technical Exercise",

      "Coding Task",

      "Challenge Review"

    ],

    "Assessments & Code Evaluation": [

      "Technical Assessment",

      "Coding Assessment",

      "Practical Assessment",

      "Module Assessment",

      "Final Assessment",

      "Code Review",

      "Assessment Deadline",

      "Assessment Result"

    ],

    "Sprints & Agile Activities": [

      "Sprint Start",

      "Sprint Planning",

      "Sprint Activities",

      "Sprint Deadline",

      "Sprint Review",

      "Sprint Retrospective",

      "Stand-up Session",

      "Sprint Demo"

    ],

    "Projects & Capstone": [

      "Project Kickoff",

      "Project Sprint",

      "Project Milestone",

      "Project Development Session",

      "Project Review",

      "Project Submission",

      "Project Deadline",

      "Capstone Project",

      "Demo Preparation",

      "Demo Day"

    ],

    "Mentoring & Learner Support": [

      "Mentor Session",

      "Doubt Clearing Session",

      "One-to-One Mentoring",

      "Group Mentoring",

      "Progress Review",

      "Technical Guidance",

      "Performance Feedback",

      "Remedial Session"

    ],

    "Hackathons & Community Events": [

      "Hackathon",

      "Coding Competition",

      "Team Challenge",

      "Innovation Challenge",

      "Community Session",

      "Networking Session",

      "Learner Showcase"

    ],

    "Career & Placement": [

      "Career Preparation",

      "Resume Preparation",

      "Portfolio Review",

      "Mock Interview",

      "Technical Interview Preparation",

      "Hiring Partner Session",

      "Employer Interaction",

      "Placement Drive",

      "Job Readiness Session"

    ],

    "Completion & Recognition": [

      "Bootcamp Completion",

      "Graduation Day",

      "Certificate Issuance",

      "Completion Certificate",

      "Learner Recognition",

      "Achievement / Award"

    ]

  },

  "CORPORATE": {

    "Onboarding & Induction": [

      "Employee Onboarding",

      "New Hire Orientation",

      "Onboarding Training",

      "Onboarding Deadline",

      "Induction Program",

      "Role Induction",

      "Probation Learning Review"

    ],

    "Training & Learning Programs": [

      "Training Program Start",

      "Training Program End",

      "Assigned Training",

      "Mandatory Training",

      "Annual Training",

      "Role-Based Training",

      "Product Training",

      "Process Training",

      "Technical Training",

      "Soft Skills Training",

      "Refresher Training",

      "Cross-Functional Training",

      "Course Deadline"

    ],

    "Compliance & Policy": [

      "Compliance Training",

      "Compliance Deadline",

      "Policy Training",

      "Policy Update Session",

      "Code of Conduct Training",

      "Regulatory Training",

      "Workplace Safety Training",

      "Ethics Training",

      "Anti-Harassment Training",

      "Compliance Renewal"

    ],

    "Security & Data Protection": [

      "Cybersecurity Training",

      "Security Awareness",

      "Data Privacy Training",

      "Information Security Training",

      "Phishing Awareness",

      "Security Policy Update",

      "Security Assessment"

    ],

    "Skills & Capability Development": [

      "Skill Development",

      "Functional Skill Training",

      "Technical Skill Development",

      "Professional Skill Development",

      "Digital Skill Development",

      "Upskilling",

      "Reskilling",

      "Skill Gap Training",

      "Capability Development"

    ],

    "Leadership & Management Development": [

      "Leadership Training",

      "Manager Training",

      "First-Time Manager Training",

      "Leadership Development Program",

      "People Management Training",

      "Team Management Training",

      "Decision-Making Workshop",

      "Succession Development"

    ],

    "Workshops & Knowledge Sharing": [

      "Workshop",

      "Webinar",

      "Knowledge Sharing",

      "Expert Session",

      "Internal Learning Session",

      "Community of Practice",

      "Best Practice Sharing",

      "Lunch & Learn",

      "Conference",

      "Seminar"

    ],

    "Assessment & Learning Evaluation": [

      "Assessment",

      "Skill Assessment",

      "Knowledge Assessment",

      "Training Assessment",

      "Competency Assessment",

      "Pre-Assessment",

      "Post-Assessment",

      "Learning Evaluation",

      "Assessment Deadline",

      "Assessment Result"

    ],

    "Certification & Accreditation": [

      "Certification Program",

      "Certification Preparation",

      "Certification Exam",

      "Certification Deadline",

      "Certification Completion",

      "Certification Renewal",

      "Certification Expiry",

      "Certificate Issuance",

      "External Accreditation"

    ],

    "Coaching, Mentoring & Performance Development": [

      "Coaching Session",

      "Mentoring Session",

      "One-to-One Coaching",

      "Peer Mentoring",

      "Performance Development",

      "Learning Review",

      "Development Plan Review",

      "Career Development",

      "Progress Review",

      "Feedback Session"

    ],

    "Organization & Employee Engagement": [

      "Town Hall",

      "Organization-Wide Session",

      "Department Meeting",

      "Team Learning Event",

      "Leadership Communication",

      "Employee Engagement Session",

      "Culture & Values Session",

      "Change Management Session",

      "Organizational Announcement"

    ]

  },



  "GOVERNMENT": {

    "Training & Capacity Building": [

      "Government Employee Training",

      "Capacity Building Program",

      "Department Training",

      "Digital Skills Training",

      "Administrative Training",

      "Refresher Training",

      "Leadership Development Program"

    ],

    "Compliance & Governance": [

      "Compliance Training",

      "Policy Update Session",

      "Governance Review",

      "Regulatory Training",

      "Audit Review",

      "Ethics Training",

      "Data Privacy Training"

    ],

    "Department Programs & Initiatives": [

      "Program Launch",

      "Program Orientation",

      "Department Initiative",

      "Scheme Orientation",

      "Program Review",

      "Implementation Review",

      "Program Completion"

    ],

    "Assessments & Certification": [

      "Assessment",

      "Skill Assessment",

      "Training Assessment",

      "Certification Exam",

      "Assessment Deadline",

      "Assessment Result",

      "Certificate Issuance"

    ],

    "Meetings & Reviews": [

      "Department Meeting",

      "Review Meeting",

      "Leadership Meeting",

      "Stakeholder Meeting",

      "Committee Meeting",

      "Quarterly Review",

      "Annual Review"

    ],

    "Public Service & Awareness": [

      "Public Awareness Program",

      "Citizen Service Training",

      "Awareness Campaign",

      "Community Outreach",

      "Public Service Workshop"

    ],

    "Government Calendar & Notices": [

      "Government Holiday",

      "Department Holiday",

      "Office Closure",

      "Important Notice",

      "Policy Announcement",

      "Schedule Change",

      "Important Deadline"

    ]

  },



  "NGO": {

    "Volunteer Onboarding & Training": [

      "Volunteer Onboarding",

      "Volunteer Orientation",

      "Volunteer Training",

      "Field Volunteer Training",

      "Volunteer Refresher Training",

      "Volunteer Meeting"

    ],

    "Program & Project Management": [

      "Program Launch",

      "Project Kickoff",

      "Project Orientation",

      "Project Milestone",

      "Project Review",

      "Project Deadline",

      "Project Completion"

    ],

    "Community Outreach & Engagement": [

      "Community Outreach",

      "Community Awareness Program",

      "Community Workshop",

      "Awareness Campaign",

      "Community Meeting",

      "Beneficiary Engagement",

      "Field Visit"

    ],

    "Training & Capacity Building": [

      "Capacity Building Program",

      "Skill Development Program",

      "Training Session",

      "Workshop",

      "Webinar",

      "Expert Session",

      "Leadership Training"

    ],

    "Fundraising & Donor Engagement": [

      "Fundraising Campaign",

      "Donor Meeting",

      "Donor Engagement Session",

      "Fundraising Event",

      "Grant Review",

      "Partnership Meeting"

    ],

    "Monitoring, Evaluation & Impact": [

      "Program Monitoring",

      "Project Evaluation",

      "Impact Assessment",

      "Progress Review",

      "Field Monitoring Visit",

      "Outcome Review",

      "Annual Impact Review"

    ],

    "Compliance & Safeguarding": [

      "Compliance Training",

      "Safeguarding Training",

      "Child Protection Training",

      "Ethics Training",

      "Policy Update Session",

      "Data Privacy Training"

    ],

    "Organization Events & Notices": [

      "NGO Event",

      "Annual Meeting",

      "Team Meeting",

      "Organization Announcement",

      "Holiday",

      "Office Closure",

      "Important Deadline"

    ]

  }



};



const priorities: string[] = ["Low", "Medium", "High", "Critical"];




function formatDisplayDate(value: string) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function getLocalTodayValue() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCurrentLocalTimeValue() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

function normalizeEventTenant(tenantType: string) {

  const value = (tenantType || "").trim().toUpperCase();



  const tenantMap: Record<string, string> = {

    ALL: "ALL",

    "ALL TENANTS": "ALL",

    ALL_TENANTS: "ALL",



    UNIVERSITY: "UNIVERSITY",

    UNIVERSITY_COLLEGE: "UNIVERSITY",

    "UNIVERSITY & COLLEGE": "UNIVERSITY",



    SKILL_ACADEMY: "SKILL_ACADEMY",

    "SKILL ACADEMY": "SKILL_ACADEMY",



    BOOTCAMP: "BOOTCAMP",

    CORPORATE: "CORPORATE",



    GOVERNMENT: "GOVERNMENT",

    GOVT: "GOVERNMENT",



    NGO: "NGO",

    NONPROFIT: "NGO",

    "NONPROFIT ORGANIZATION": "NGO",

    "NGO / NONPROFIT ORGANIZATION": "NGO",

  };



  return tenantMap[value] || value.replace(/\s+/g, "_");

}



function getEventDataForLogin(role: string, tenantType: string): EventTitleSubtitleMap {

  const normalizedTenant = normalizeEventTenant(tenantType);



  // Tenant-specific data must be checked first.

  // This is exactly how University / Skill Academy / Bootcamp / Corporate work,

  // and now Government / NGO follow the same flow.

  if (

    normalizedTenant &&

    normalizedTenant !== "ALL" &&

    eventDataByTenant[normalizedTenant]

  ) {

    return eventDataByTenant[normalizedTenant];

  }



  if (role === "SUPER_ADMIN") return eventDataByTenant.SUPER_ADMIN;

  if (role === "PLATFORM_ADMIN") return eventDataByTenant.PLATFORM_ADMIN;



  return eventDataByTenant[normalizedTenant] || {};

}



type DropdownProps = {

  placeholder: string;

  value: string;

  options: string[];

  open: boolean;

  onToggle: () => void;

  onSelect: (value: string) => void;

  searchable?: boolean;

  disabled?: boolean;

};



function FormDropdown({

  placeholder,

  value,

  options,

  open,

  onToggle,

  onSelect,

  searchable = false,

  disabled = false,

}: DropdownProps) {

  const [search, setSearch] = useState("");



  const normalizedSearch = search.trim().toLowerCase();



  const filteredOptions = options.filter((option) =>

    option.toLowerCase().includes(normalizedSearch)

  );



  return (

    <div className={`formDropdown ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}>

      <button

        type="button"

        className="formControl selectControl"

        onClick={() => {

          if (!disabled) {

            if (open) setSearch("");

            onToggle();

          }

        }}

        aria-expanded={open}

        disabled={disabled}

      >

        <span>{value || placeholder}</span>

        <Image className="dropdownIcon" src={icons.dropdown} alt="" width={16} height={16} />

      </button>



      {open && !disabled && (

        <div className="dropdownMenu">

          {searchable && (

            <div className="dropdownSearchWrap">

              <input

                type="search"

                className="dropdownSearch"

                value={search}

                onChange={(event) => setSearch(event.target.value)}

                onClick={(event) => event.stopPropagation()}

                onKeyDown={(event) => event.stopPropagation()}

                placeholder="Search..."

                aria-label={`Search ${placeholder}`}

                autoComplete="off"

                autoFocus

              />

            </div>

          )}



          <div className="dropdownOptionsScroll">

            {filteredOptions.length > 0 ? (

              filteredOptions.map((option) => {

                const selected = option === value;

                return (

                  <button

                    key={option}

                    type="button"

                    className={`dropdownOption ${selected ? "selected" : ""}`}

                    onClick={() => {

                      onSelect(option);

                      setSearch("");

                    }}

                  >

                    <span className="optionRadio" aria-hidden="true">

                      <span className="optionRadioOuter" />

                      {!selected && <span className="optionRadioInner" />}

                      {selected && (

                        <span className="optionRadioSelected">

                          <span className="optionTick" />

                        </span>

                      )}

                    </span>

                    <span>{option}</span>

                  </button>

                );

              })

            ) : (

              <div className="dropdownNoResults">No matching results</div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}



function CustomDatePicker({

  value,

  month,

  onMonthChange,

  onSelect,

  minDate,

}: {

  value: string;

  month: Date;

  onMonthChange: (date: Date) => void;

  onSelect: (value: string) => void;

  minDate?: string;

}) {

  const [calendarView, setCalendarView] = useState<
    "days" | "months" | "years"
  >("days");

  const [yearPageStart, setYearPageStart] = useState(
    Math.floor(month.getFullYear() / 12) * 12
  );

  useEffect(() => {
    setYearPageStart(Math.floor(month.getFullYear() / 12) * 12);
  }, [month]);

  const year = month.getFullYear();

  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1).getDay();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const previousMonthDays = new Date(year, monthIndex, 0).getDate();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const cells = Array.from({ length: 42 }, (_, index) => {

    const dayOffset = index - firstDay + 1;

    if (dayOffset < 1) {

      return { day: previousMonthDays + dayOffset, offset: -1, outside: true };

    }

    if (dayOffset > daysInMonth) {

      return { day: dayOffset - daysInMonth, offset: 1, outside: true };

    }

    return { day: dayOffset, offset: 0, outside: false };

  });

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  const minimumDate = minDate
    ? new Date(`${minDate}T00:00:00`)
    : null;

  const moveMonth = (amount: number) => {

    onMonthChange(new Date(year, monthIndex + amount, 1));

  };

  const selectDay = (day: number, offset: number) => {

    const date = new Date(year, monthIndex + offset, day);

    const formatted =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    onSelect(formatted);

  };

  const selectMonth = (nextMonthIndex: number) => {
    onMonthChange(new Date(year, nextMonthIndex, 1));
    setCalendarView("days");
  };

  const selectYear = (nextYear: number) => {
    onMonthChange(new Date(nextYear, monthIndex, 1));
    setCalendarView("days");
  };

  const moveCalendarHeader = (amount: number) => {
    if (calendarView === "years") {
      setYearPageStart((current) => current + amount * 12);
      return;
    }

    if (calendarView === "months") {
      onMonthChange(new Date(year + amount, monthIndex, 1));
      return;
    }

    moveMonth(amount);
  };

  const yearOptions = Array.from(
    { length: 12 },
    (_, index) => yearPageStart + index
  );

  return (

    <div className="neoCalendarPopup">

      <div className="neoCalendarPickerHeader">

        <button
          type="button"
          className="neoCalendarNavButton"
          onClick={() => moveCalendarHeader(-1)}
          aria-label={
            calendarView === "years"
              ? "Previous years"
              : calendarView === "months"
                ? "Previous year"
                : "Previous month"
          }
        >

          <Image
            src={icons.arrowLeft}
            alt=""
            width={16}
            height={16}
          />

        </button>

        <button
          type="button"
          className={`neoCalendarSelectButton ${
            calendarView === "months" ? "active" : ""
          }`}
          onClick={() =>
            setCalendarView((current) =>
              current === "months" ? "days" : "months"
            )
          }
        >

          <span>{monthNames[monthIndex]}</span>

          <Image
            src={icons.dropdown}
            alt=""
            width={14}
            height={14}
          />

        </button>

        <button
          type="button"
          className={`neoCalendarSelectButton neoCalendarYearButton ${
            calendarView === "years" ? "active" : ""
          }`}
          onClick={() => {
            setYearPageStart(Math.floor(year / 12) * 12);
            setCalendarView((current) =>
              current === "years" ? "days" : "years"
            );
          }}
        >

          <span>{year}</span>

          <Image
            src={icons.dropdown}
            alt=""
            width={14}
            height={14}
          />

        </button>

        <button
          type="button"
          className="neoCalendarNavButton"
          onClick={() => moveCalendarHeader(1)}
          aria-label={
            calendarView === "years"
              ? "Next years"
              : calendarView === "months"
                ? "Next year"
                : "Next month"
          }
        >

          <Image
            src={icons.arrowRight}
            alt=""
            width={16}
            height={16}
          />

        </button>

      </div>

      {calendarView === "months" ? (

        <div className="neoCalendarMonthGrid">

          {monthNames.map((monthName, index) => {

            const selected = index === monthIndex;

            const monthEnd = new Date(year, index + 1, 0, 23, 59, 59, 999);

            const disabled =
              !!minimumDate &&
              monthEnd.getTime() < minimumDate.getTime();

            return (

              <button
                key={monthName}
                type="button"
                className={selected ? "selected" : ""}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) selectMonth(index);
                }}
                title={monthName}
              >
                {monthName}
              </button>

            );

          })}

        </div>

      ) : calendarView === "years" ? (

        <>

          <div className="neoCalendarYearRange">

            <button
              type="button"
              onClick={() => setYearPageStart((current) => current - 12)}
              aria-label="Previous year range"
            >

              <Image
                src={icons.arrowLeft}
                alt=""
                width={16}
                height={16}
              />

            </button>

            <strong>
              {yearPageStart} - {yearPageStart + 11}
            </strong>

            <button
              type="button"
              onClick={() => setYearPageStart((current) => current + 12)}
              aria-label="Next year range"
            >

              <Image
                src={icons.arrowRight}
                alt=""
                width={16}
                height={16}
              />

            </button>

          </div>

          <div className="neoCalendarYearGrid">

            {yearOptions.map((yearOption) => {

              const selected = yearOption === year;

              const yearEnd = new Date(
                yearOption,
                11,
                31,
                23,
                59,
                59,
                999
              );

              const disabled =
                !!minimumDate &&
                yearEnd.getTime() < minimumDate.getTime();

              return (

                <button
                  key={yearOption}
                  type="button"
                  className={selected ? "selected" : ""}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) selectYear(yearOption);
                  }}
                >
                  {yearOption}
                </button>

              );

            })}

          </div>

        </>

      ) : (

        <>

          <div className="neoCalendarWeek">

            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (

              <span key={day}>{day}</span>

            ))}

          </div>

          <div className="neoCalendarGrid">

            {cells.map((cell, index) => {

              const cellDate = new Date(
                year,
                monthIndex + cell.offset,
                cell.day
              );

              const selected =
                selectedDate &&
                selectedDate.getFullYear() === cellDate.getFullYear() &&
                selectedDate.getMonth() === cellDate.getMonth() &&
                selectedDate.getDate() === cellDate.getDate();

              const disabled =
                !!minimumDate &&
                cellDate.getTime() < minimumDate.getTime();

              return (

                <button
                  type="button"
                  key={`${cell.day}-${index}`}
                  className={`${disabled ? "outside" : ""} ${
                    selected ? "selected" : ""
                  }`}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      selectDay(cell.day, cell.offset);
                    }
                  }}
                >

                  {cell.day}

                </button>

              );

            })}

          </div>

        </>

      )}

    </div>

  );

}


function CustomTimePicker({

  value,

  onSelect,

  minTime,

}: {

  value: string;

  onSelect: (value: string) => void;

  minTime?: string;

}) {

  const validValue = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(value)
    ? value
    : "";

  const initialParts = validValue ? validValue.split(":") : ["", "", ""];

  const [draftHour, setDraftHour] = useState(initialParts[0]);
  const [draftMinute, setDraftMinute] = useState(initialParts[1]);
  const [draftSecond, setDraftSecond] = useState(initialParts[2]);

  useEffect(() => {
    if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(value)) {
      const [nextHour, nextMinute, nextSecond] = value.split(":");
      setDraftHour(nextHour);
      setDraftMinute(nextMinute);
      setDraftSecond(nextSecond);
    } else {
      setDraftHour("");
      setDraftMinute("");
      setDraftSecond("");
    }
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0")
  );

  const minutes = Array.from({ length: 60 }, (_, index) =>
    String(index).padStart(2, "0")
  );

  const seconds = Array.from({ length: 60 }, (_, index) =>
    String(index).padStart(2, "0")
  );

  const normalizedMinTime =
    minTime && /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(minTime)
      ? minTime
      : "";

  const [minHour, minMinute, minSecond] = normalizedMinTime
    ? normalizedMinTime.split(":")
    : ["", "", ""];

  const visibleHours =
    minHour
      ? hours.filter((item) => Number(item) >= Number(minHour))
      : hours;

  const visibleMinutes =
    minHour &&
    minMinute &&
    draftHour === minHour
      ? minutes.filter((item) => Number(item) >= Number(minMinute))
      : minutes;

  const visibleSeconds =
    minHour &&
    minMinute &&
    minSecond &&
    draftHour === minHour &&
    draftMinute === minMinute
      ? seconds.filter((item) => Number(item) > Number(minSecond))
      : seconds;

  const commitIfComplete = (
    nextHour: string,
    nextMinute: string,
    nextSecond: string
  ) => {
    if (nextHour && nextMinute && nextSecond) {
      onSelect(`${nextHour}:${nextMinute}:${nextSecond}`);
    }
  };

  const selectHour = (nextHour: string) => {
    setDraftHour(nextHour);

    let nextMinute = draftMinute;
    let nextSecond = draftSecond;

    if (
      minHour &&
      minMinute &&
      nextHour === minHour &&
      nextMinute &&
      Number(nextMinute) < Number(minMinute)
    ) {
      nextMinute = "";
      nextSecond = "";
      setDraftMinute("");
      setDraftSecond("");
    }

    commitIfComplete(nextHour, nextMinute, nextSecond);
  };

  const selectMinute = (nextMinute: string) => {
    setDraftMinute(nextMinute);

    let nextSecond = draftSecond;

    if (
      minHour &&
      minMinute &&
      minSecond &&
      draftHour === minHour &&
      nextMinute === minMinute &&
      nextSecond &&
      Number(nextSecond) <= Number(minSecond)
    ) {
      nextSecond = "";
      setDraftSecond("");
    }

    commitIfComplete(draftHour, nextMinute, nextSecond);
  };

  const selectSecond = (nextSecond: string) => {
    setDraftSecond(nextSecond);
    commitIfComplete(draftHour, draftMinute, nextSecond);
  };

  return (

    <div className="neoTimePopup neoTimePopupThree">

      <div className="neoTimeColumn">

        <div className="neoTimeHeader">HH</div>

        <div className="neoTimeScroll" role="listbox" aria-label="Hour">

          {visibleHours.map((item) => (

            <button
              type="button"
              key={item}
              className={draftHour === item ? "selected" : ""}
              onClick={() => selectHour(item)}
            >
              {item}
            </button>

          ))}

        </div>

      </div>

      <div className="neoTimeColumn">

        <div className="neoTimeHeader">MM</div>

        <div className="neoTimeScroll" role="listbox" aria-label="Minute">

          {visibleMinutes.map((item) => (

            <button
              type="button"
              key={item}
              className={draftMinute === item ? "selected" : ""}
              onClick={() => selectMinute(item)}
            >
              {item}
            </button>

          ))}

        </div>

      </div>

      <div className="neoTimeColumn">

        <div className="neoTimeHeader">SS</div>

        <div className="neoTimeScroll" role="listbox" aria-label="Second">

          {visibleSeconds.map((item) => (

            <button
              type="button"
              key={item}
              className={draftSecond === item ? "selected" : ""}
              onClick={() => selectSecond(item)}
            >
              {item}
            </button>

          ))}

        </div>

      </div>

    </div>

  );

}

type AddEventPageProps = {

  embedded?: boolean;

  onClose?: () => void;

  onComplete?: () => void;

};



export default function AddEventPage({

  embedded = false,

  onClose,

  onComplete,

}: AddEventPageProps = {}) {

  const [openPicker, setOpenPicker] = useState<

    "startDate" | "endDate" | "startTime" | "endTime" | "publishDate" | "publishTime" | null

  >(null);

  const [calendarMonth, setCalendarMonth] = useState<Date>(

    new Date(2026, 8, 1)

  );



  const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState<"title" | "subtitle" | "priority" | "publishAudience" | "publishTenant" | "publishOrganization" | "publishActor" | null>(null);

  const [title, setTitle] = useState("");

  const [subtitle, setSubtitle] = useState("");

  const [currentRole, setCurrentRole] = useState("");

  const [currentTenant, setCurrentTenant] = useState("");



  useEffect(() => {

    let selectedTenant = "";



    const storedContext = window.localStorage.getItem("calendar:add-event-context");



    if (storedContext) {

      try {

        const context = JSON.parse(storedContext) as {

          tenant?: string;

          role?: string;

        };



        if (context.tenant && context.tenant !== "All Tenants") {

          selectedTenant = context.tenant;

        }

      } catch {

        selectedTenant = "";

      }

    }



    if (!selectedTenant) {

      const storedSelectedTenant =

        window.localStorage.getItem("calendar:selected-tenant") || "";



      if (

        storedSelectedTenant &&

        storedSelectedTenant !== "All Tenants"

      ) {

        selectedTenant = storedSelectedTenant;

      }

    }



    const storedLogin = window.localStorage.getItem("calendar_dummy_login");



    if (storedLogin) {

      try {

        const login = JSON.parse(storedLogin);



        setCurrentRole(

          login.role ||

          window.localStorage.getItem("calendar_current_role") ||

          ""

        );



        const loginTenant =

          login.tenantType && login.tenantType !== "ALL"

            ? login.tenantType

            : login.displayTenant && login.displayTenant !== "All Tenants"

              ? login.displayTenant

              : "";



        setCurrentTenant(

          selectedTenant ||

          loginTenant ||

          window.localStorage.getItem("calendar_current_tenant") ||

          ""

        );



        return;

      } catch {

        // Fall back to the individual role / tenant keys below.

      }

    }



    setCurrentRole(window.localStorage.getItem("calendar_current_role") || "");

    setCurrentTenant(

      selectedTenant ||

      window.localStorage.getItem("calendar_current_tenant") ||

      ""

    );

  }, []);



  const currentEventData = getEventDataForLogin(currentRole, currentTenant);

  const baseEventTitles = Object.keys(currentEventData);

  const eventTitles =

    title && !baseEventTitles.includes(title)

      ? [title, ...baseEventTitles]

      : baseEventTitles;



  const baseEventSubtitles = title ? currentEventData[title] || [] : [];

  const eventSubtitles =

    subtitle && !baseEventSubtitles.includes(subtitle)

      ? [subtitle, ...baseEventSubtitles]

      : baseEventSubtitles;

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [startTime, setStartTime] = useState("");

  const [endTime, setEndTime] = useState("");

  const [priority, setPriority] = useState("");

  const [description, setDescription] = useState("");

  const [attachment, setAttachment] = useState("");

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [formError, setFormError] = useState("");

  const [formMode, setFormMode] = useState<"add" | "edit" | "reuse">("add");

  const [sourceEventId, setSourceEventId] = useState<number | null>(null);

  const [sourceEvent, setSourceEvent] = useState<Record<string, unknown> | null>(null);

  const [reuseOriginalTitle, setReuseOriginalTitle] = useState("");


  type PublishMode = "none" | "publish" | "schedule";

  const [publishMode, setPublishMode] = useState<PublishMode>("none");
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [publishOrganizer, setPublishOrganizer] = useState("");
  type PublishAudienceType =
    | ""
    | "All"
    | "Tenant Only"
    | "Actor Only"
    | "Tenant + Actor"
    | "Specific Tenant"
    | "Specific Actor"
    | "Specific Organization + Actor";

  const [publishAudienceType, setPublishAudienceType] =
    useState<PublishAudienceType>("");
  const [publishTenant, setPublishTenant] = useState("");
  const [publishOrganization, setPublishOrganization] = useState("");
  const [publishActor, setPublishActor] = useState("");
  const [publishSelectedTenants, setPublishSelectedTenants] = useState<string[]>([]);
  const [publishSelectedActors, setPublishSelectedActors] = useState<string[]>([]);
  const [publishOrganizations, setPublishOrganizations] = useState<
    Array<{ tenant: string; organization: string }>
  >([]);
  const [publishTargets, setPublishTargets] = useState<
    Array<{ tenant: string; organization: string; actor: string }>
  >([]);
  const [publishScheduleDate, setPublishScheduleDate] = useState("");
  const [publishScheduleTime, setPublishScheduleTime] = useState("");
  const [isAddingPublishTarget, setIsAddingPublishTarget] = useState(false);

  const publishTenants = [
    "University & College",
    "Skill Academy",
    "Bootcamp",
    "Corporate",
    "Government",
    "NGO",
  ];

  const publishOrganizationsByTenant: Record<string, string[]> = {
    "University & College": [
      "North Valley University",
      "Greenfield University",
      "City Central College",
      "Riverside College",
      "Sunrise Institute of Technology",
      "Horizon School of Management",
      "Metro Arts & Science College",
      "Lakeside Engineering College",
    ],
    "Skill Academy": [
      "NextStep Skill Academy",
      "BrightPath Skills Center",
      "SkillForge Academy",
      "CareerBridge Academy",
      "FutureReady Skills Hub",
      "ProLearn Academy",
      "TalentSpring Academy",
      "Elevate Skills Institute",
    ],
    Bootcamp: [
      "CodeSprint Bootcamp",
      "DevLaunch Bootcamp",
      "TechRise Bootcamp",
      "FullStack Forge",
      "CloudSprint Bootcamp",
      "DataCraft Bootcamp",
      "UX Launchpad",
      "AI Builder Bootcamp",
    ],
    Corporate: [
      "Apex Global Pvt Ltd",
      "NovaTech Solutions",
      "BluePeak Industries",
      "Vertex Systems",
      "Orbit Enterprises",
      "PrimeWorks Ltd",
      "NexaCorp",
      "Summit Business Services",
    ],
    Government: [
      "Department of Digital Services",
      "State Training Institute",
      "Public Administration Academy",
      "District Learning Centre",
      "Government Skills Mission",
      "Civil Services Training Centre",
      "Municipal Training Academy",
      "Public Sector Learning Hub",
    ],
    NGO: [
      "Hope Foundation",
      "Community Reach Trust",
      "BrightFuture Foundation",
      "CareBridge NGO",
      "PeopleFirst Foundation",
      "GreenEarth Trust",
      "YouthRise Foundation",
      "Social Impact Network",
    ],
  };

  /*
   * Publish audience hierarchy follows the signed-in role.
   *
   * SUPER_ADMIN    -> Platform Admin + all tenant actors below
   * PLATFORM_ADMIN -> all tenant actors below
   * TENANT_ADMIN   -> Coordinator + Faculty + Student
   * COORDINATOR    -> Faculty + Student
   * FACULTY        -> Student
   *
   * Platform Admin is global, so it is available for Actor Only /
   * Specific Actor, but it is not shown inside Tenant + Actor or
   * Specific Organization + Actor because those are tenant-scoped.
   */
  const publishActors = (() => {
    switch (currentRole) {
      case "SUPER_ADMIN":
        return [
          "Platform Admins",
          "Institute Admins",
          "Coordinators",
          "Faculty",
          "Students",
        ];

      case "PLATFORM_ADMIN":
        return [
          "Institute Admins",
          "Coordinators",
          "Faculty",
          "Students",
        ];

      case "TENANT_ADMIN":
        return [
          "Coordinators",
          "Faculty",
          "Students",
        ];

      case "COORDINATOR":
        return [
          "Faculty",
          "Students",
        ];

      case "FACULTY":
        return [
          "Students",
        ];

      default:
        return [];
    }
  })();

  const publishTenantActors = publishActors.filter(
    (actor) => actor !== "Platform Admins"
  );


  const normalizePublishTenantLabel = (value: string) => {
    const normalized = (value || "").trim().toUpperCase();

    const tenantLabelMap: Record<string, string> = {
      UNIVERSITY: "University & College",
      UNIVERSITY_COLLEGE: "University & College",
      "UNIVERSITY & COLLEGE": "University & College",
      SKILL_ACADEMY: "Skill Academy",
      "SKILL ACADEMY": "Skill Academy",
      BOOTCAMP: "Bootcamp",
      CORPORATE: "Corporate",
      GOVERNMENT: "Government",
      NGO: "NGO",
    };

    return tenantLabelMap[normalized] || value.trim();
  };

  const availablePublishTenants = (() => {
    if (
      currentRole === "SUPER_ADMIN" ||
      currentRole === "PLATFORM_ADMIN"
    ) {
      return publishTenants;
    }

    if (
      currentRole === "TENANT_ADMIN" ||
      currentRole === "COORDINATOR" ||
      currentRole === "FACULTY"
    ) {
      const tenantLabel = normalizePublishTenantLabel(currentTenant);

      return publishTenants.includes(tenantLabel)
        ? [tenantLabel]
        : [];
    }

    return [];
  })();

  const normalizePublishActorValue = (value: string) => {
    const normalized = (value || "").trim().toLowerCase();

    const actorMap: Record<string, string> = {
      "platform admin": "Platform Admins",
      "platform admins": "Platform Admins",
      "institute admin": "Institute Admins",
      "institute admins": "Institute Admins",
      "academy admin": "Institute Admins",
      "bootcamp admin": "Institute Admins",
      "corporate admin": "Institute Admins",
      "tenant admin": "Institute Admins",
      coordinator: "Coordinators",
      coordinators: "Coordinators",
      "program coordinator": "Coordinators",
      "cohort coordinator": "Coordinators",
      "l&d coordinator": "Coordinators",
      faculty: "Faculty",
      trainer: "Faculty",
      instructor: "Faculty",
      student: "Students",
      students: "Students",
      learner: "Students",
      employee: "Students",
    };

    return actorMap[normalized] || value.trim();
  };

  const getPublishActorLabel = (tenantName: string, actor: string) => {
    const labels: Record<string, Record<string, string>> = {
      "University & College": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Institute Admin",
        "Coordinators": "Coordinator",
        Faculty: "Faculty",
        Students: "Student",
      },
      "Skill Academy": {
        "Platform Admins": "Platform Admin",
        "Institute Admins": "Academy Admin",
        "Coordinators": "Program Coordinator",
        Faculty: "Trainer",
        Students: "Learner",
      },
      Bootcamp: {
        "Institute Admins": "Bootcamp Admin",
        "Coordinators": "Cohort Coordinator",
        Faculty: "Instructor",
        Students: "Learner",
      },
      Corporate: {
        "Institute Admins": "Corporate Admin",
        "Coordinators": "L&D Coordinator",
        Faculty: "Trainer",
        Students: "Employee",
      },
      Government: {
        "Institute Admins": "Department Admin",
        "Coordinators": "Program Coordinator",
        Faculty: "Trainer",
        Students: "Employee",
      },
      NGO: {
        "Institute Admins": "NGO Admin",
        "Coordinators": "Program Coordinator",
        Faculty: "Trainer",
        Students: "Volunteer / Learner",
      },
    };

    return labels[tenantName]?.[actor] || actor;
  };

  const isTenantScopedPublisher =
    currentRole === "TENANT_ADMIN" ||
    currentRole === "COORDINATOR" ||
    currentRole === "FACULTY";


  const resetPublishTargetSelection = () => {
    setPublishTenant("");
    setPublishOrganization("");
    setPublishActor("");
    setOpenDropdown(null);
  };

  const selectPublishAudienceType = (
    value: PublishAudienceType
  ) => {
    setPublishAudienceType(value);
    resetPublishTargetSelection();

    // Broad modes do not need another dropdown.
    // Tenant Only = complete tenant list.
    // Actor Only = complete actor list.
    setPublishSelectedTenants(
      value === "Tenant Only" ? availablePublishTenants : []
    );
    setPublishSelectedActors(
      value === "Actor Only" ? publishActors : []
    );

    // Specific modes keep the existing selector/chip behavior.
    setPublishOrganizations([]);
    setPublishTargets([]);
    setIsAddingPublishTarget(false);
  };

  const addSelectedTenant = (tenantValue: string) => {
    if (!tenantValue) return;

    setPublishSelectedTenants((previous) =>
      previous.includes(tenantValue)
        ? previous
        : [...previous, tenantValue]
    );

    setPublishTenant("");
    setOpenDropdown(null);
  };

  const addSelectedActor = (actorValue: string) => {
    if (!actorValue) return;

    setPublishSelectedActors((previous) =>
      previous.includes(actorValue)
        ? previous
        : [...previous, actorValue]
    );

    setPublishActor("");
    setOpenDropdown(null);
  };

  const addPublishOrganization = (
    tenantValue: string,
    organizationValue: string
  ) => {
    if (!tenantValue || !organizationValue) return;

    setPublishOrganizations((previous) => {
      const exists = previous.some(
        (item) =>
          item.tenant === tenantValue &&
          item.organization === organizationValue
      );

      return exists
        ? previous
        : [
            ...previous,
            {
              tenant: tenantValue,
              organization: organizationValue,
            },
          ];
    });

    setPublishOrganization("");
    setOpenDropdown(null);
    setIsAddingPublishTarget(false);
  };

  const completePublishTargetIfPossible = (
    nextTenant: string,
    nextOrganization: string,
    nextActor: string
  ) => {
    const tenantValue =
      isTenantScopedPublisher && currentTenant
        ? currentTenant
        : nextTenant;

    if (!tenantValue || !nextOrganization || !nextActor) return;

    setPublishTargets((previous) => {
      const exists = previous.some(
        (item) =>
          item.tenant === tenantValue &&
          item.organization === nextOrganization &&
          item.actor === nextActor
      );

      return exists
        ? previous
        : [
            ...previous,
            {
              tenant: tenantValue,
              organization: nextOrganization,
              actor: nextActor,
            },
          ];
    });

    setPublishOrganization("");
    setPublishActor("");
    setOpenDropdown(null);
    setIsAddingPublishTarget(false);
  };

  const publishAudienceDisplayValue =
    publishAudienceType === "All"
      ? "Default"
      : publishAudienceType === "Tenant Only"
        ? "Tenant"
        : publishAudienceType === "Actor Only"
          ? "Actor"
          : publishAudienceType;




  useEffect(() => {

    const storedAction = window.localStorage.getItem("calendar:event-action");



    if (!storedAction) {

      setFormMode("add");

      setSourceEventId(null);

      setSourceEvent(null);

      setReuseOriginalTitle("");

      return;

    }



    try {

      const action = JSON.parse(storedAction) as {

        mode?: "edit" | "reuse";

        event?: {

          id: number;

          backendId?: string;

          title: string;

          eventTitle?: string;

          eventSubtitle?: string;

          subtitle?: string;

          date: string;

          day: number;

          month: number;

          year: number;

          start: string;

          end: string;

          startDate?: string;

          endDate?: string;

          startTime?: string;

          endTime?: string;

          location: string;

          attendees: number;

          status?: string;

          color?: string;

          tenant?: string;

          role?: string;

          audience?: string;

          priority?: string;

          description?: string;

          attachment?: string;
          scheduledPublishAt?: string;
          createdBy?: string;
          organizer?: string;

        };

      };



      if (

        (action.mode !== "edit" && action.mode !== "reuse") ||

        !action.event

      ) {

        window.localStorage.removeItem("calendar:event-action");

        setFormMode("add");

        setSourceEventId(null);

        setSourceEvent(null);

        setReuseOriginalTitle("");

        return;

      }



      const source = action.event;

      const originalTitle = source.eventTitle || source.title || "";



      setFormMode(action.mode);

      setSourceEventId(action.mode === "edit" ? source.id : null);

      setSourceEvent(source as unknown as Record<string, unknown>);

      setReuseOriginalTitle(action.mode === "reuse" ? originalTitle : "");



      setTitle(originalTitle);

      setSubtitle(

        source.eventSubtitle ||

        source.subtitle ||

        (source.location === "TBA" ? "" : source.location || "")

      );



      const selectedDate =

        source.startDate ||

        `${source.year}-${String(source.month + 1).padStart(2, "0")}-${String(source.day).padStart(2, "0")}`;



      setStartDate(selectedDate);

      setEndDate(source.endDate || selectedDate);

      setStartTime(normalizeBackendTime(source.startTime || source.start || ""));

      setEndTime(normalizeBackendTime(source.endTime || source.end || ""));

      setPriority(source.priority || "");

      setDescription(source.description || "");

      setAttachment(source.attachment || "");

      /*
       * EDIT MODE:
       * Open as a normal edit form.
       *
       * Do NOT automatically select Publish / Schedule Publish and do NOT
       * preselect an Audience. The existing status/audience stay preserved
       * on the event until the user explicitly clicks Publish or
       * Schedule Publish and chooses new publish options.
       */
      if (action.mode === "edit") {
        const statusValue = String(source.status || "Saved").toLowerCase();

        setPublishMode("none");
        setShowPublishOptions(false);
        setPublishAudienceType("");
        setPublishSelectedTenants([]);
        setPublishSelectedActors([]);
        setPublishOrganizations([]);
        setPublishTargets([]);
        setPublishTenant("");
        setPublishOrganization("");
        setPublishActor("");
        setPublishOrganizer(source.organizer || "");

        if (
          statusValue === "scheduled" &&
          source.scheduledPublishAt
        ) {
          const scheduledDate = new Date(source.scheduledPublishAt);

          if (!Number.isNaN(scheduledDate.getTime())) {
            setPublishScheduleDate(
              `${scheduledDate.getFullYear()}-${String(
                scheduledDate.getMonth() + 1
              ).padStart(2, "0")}-${String(
                scheduledDate.getDate()
              ).padStart(2, "0")}`
            );

            setPublishScheduleTime(
              `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(
                scheduledDate.getMinutes()
              ).padStart(2, "0")}:${String(
                scheduledDate.getSeconds()
              ).padStart(2, "0")}`
            );
          }
        } else {
          setPublishScheduleDate("");
          setPublishScheduleTime("");
        }
      } else {
        setPublishMode("none");
        setPublishAudienceType("");
        setPublishTargets([]);
        setPublishTenant("");
        setPublishActor("");
        setPublishScheduleDate("");
        setPublishScheduleTime("");
      }

      setCalendarMonth(new Date(source.year, source.month, 1));

    } catch {

      window.localStorage.removeItem("calendar:event-action");

      setFormMode("add");

      setSourceEventId(null);

      setSourceEvent(null);

      setReuseOriginalTitle("");

    }

  }, []);

  const cancelForm = () => {

    window.localStorage.removeItem("calendar:event-action");

    window.localStorage.removeItem("calendar:selected-event");

    window.localStorage.removeItem("calendar:reuse-event");

    if (embedded) {

      onClose?.();

      return;

    }

    router.push("/calendarmanagment");

  };



  const deleteEvent = async () => {

    if (sourceEventId === null) return;



    const token = window.localStorage.getItem("calendar_access_token") || "";



    if (!token) {

      alert("Backend login token is missing. Please sign in again.");

      return;

    }



    let backendId =

      sourceEvent && typeof sourceEvent.backendId === "string"

        ? sourceEvent.backendId

        : "";



    try {

      /*

       * Backend-only delete integration.

       * Existing UI, button behavior, localStorage flow and layout are unchanged.

       *

       * If the selected event already has backendId, delete it directly.

       * Otherwise load the tenant-scoped backend events and resolve the exact

       * record using title + description/subtitle first. This avoids timezone

       * differences between the calendar display and PostgreSQL DateTime values.

       */

      if (!backendId) {

        const response = await fetch(`${API_URL}/events`, {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

          cache: "no-store",

        });



        if (!response.ok) {

          throw new Error(

            await getBackendErrorMessage(

              response,

              "Unable to locate the event in the backend."

            )

          );

        }



        const backendEvents = (await response.json()) as Array<{

          id?: string;

          title?: string;

          subtitle?: string | null;

          description?: string | null;

          startDate?: string;

          endDate?: string;

        }>;



        const sourceTitle = String(

          sourceEvent?.eventTitle || sourceEvent?.title || ""

        ).trim();



        const sourceDescription = String(

          sourceEvent?.description || ""

        ).trim();



        const sourceSubtitle = String(

          sourceEvent?.eventSubtitle || sourceEvent?.subtitle || ""

        ).trim();



        /*

         * First match the title. Then narrow it with description and subtitle.

         * The user's test event has a unique description, so this identifies

         * the PostgreSQL row without depending on local/UTC date conversion.

         */

        let candidates = backendEvents.filter(

          (event) =>

            Boolean(event.id) &&

            String(event.title || "").trim() === sourceTitle

        );



        if (sourceDescription) {

          const descriptionMatches = candidates.filter(

            (event) =>

              String(event.description || "").trim() === sourceDescription

          );



          if (descriptionMatches.length > 0) {

            candidates = descriptionMatches;

          }

        }



        if (sourceSubtitle && candidates.length > 1) {

          const subtitleMatches = candidates.filter(

            (event) =>

              String(event.subtitle || "").trim() === sourceSubtitle

          );



          if (subtitleMatches.length > 0) {

            candidates = subtitleMatches;

          }

        }



        /*

         * If more than one backend event remains, use the frontend date/time

         * only as a secondary discriminator with a 2-minute tolerance.

         */

        if (candidates.length > 1) {

          const sourceStartDate = String(sourceEvent?.startDate || "");

          const sourceEndDate = String(

            sourceEvent?.endDate || sourceEvent?.startDate || ""

          );

          const sourceStartTime = String(

            sourceEvent?.startTime || sourceEvent?.start || ""

          );

          const sourceEndTime = String(

            sourceEvent?.endTime || sourceEvent?.end || sourceStartTime

          );



          let sourceStartMs = NaN;

          let sourceEndMs = NaN;



          try {

            if (sourceStartDate && sourceStartTime) {

              sourceStartMs = new Date(

                toBackendDateTime(sourceStartDate, sourceStartTime)

              ).getTime();

            }



            if (sourceEndDate && sourceEndTime) {

              sourceEndMs = new Date(

                toBackendDateTime(sourceEndDate, sourceEndTime)

              ).getTime();

            }

          } catch {

            // Keep the metadata match as the fallback.

          }



          const TIME_TOLERANCE_MS = 2 * 60 * 1000;



          const timedMatches = candidates.filter((event) => {

            const backendStart = event.startDate

              ? new Date(event.startDate).getTime()

              : NaN;



            const backendEnd = event.endDate

              ? new Date(event.endDate).getTime()

              : NaN;



            const startMatches =

              Number.isNaN(sourceStartMs) ||

              Number.isNaN(backendStart) ||

              Math.abs(backendStart - sourceStartMs) <= TIME_TOLERANCE_MS;



            const endMatches =

              Number.isNaN(sourceEndMs) ||

              Number.isNaN(backendEnd) ||

              Math.abs(backendEnd - sourceEndMs) <= TIME_TOLERANCE_MS;



            return startMatches && endMatches;

          });



          if (timedMatches.length > 0) {

            candidates = timedMatches;

          }

        }



        if (candidates.length === 1 && candidates[0]?.id) {

          backendId = candidates[0].id;

        } else if (candidates.length > 1) {

          /*

           * Never delete an ambiguous backend record.

           * This protects existing data if several events have identical

           * visible metadata.

           */

          throw new Error(

            "More than one backend event matches this calendar event. Delete was not performed."

          );

        }

      }



      if (!backendId) {

        throw new Error(

          "This event does not have a matching backend record, so PostgreSQL was not changed."

        );

      }



      /*

       * Actual PostgreSQL delete.

       */

      const deleteResponse = await fetch(

        `${API_URL}/events/${encodeURIComponent(backendId)}`,

        {

          method: "DELETE",

          headers: {

            Authorization: `Bearer ${token}`,

          },

          cache: "no-store",

        }

      );



      if (!deleteResponse.ok) {

        throw new Error(

          await getBackendErrorMessage(

            deleteResponse,

            "Unable to delete the event from the backend."

          )

        );

      }

    } catch (error) {

      const message =

        error instanceof Error

          ? error.message

          : "Unable to delete the event from the backend.";



      alert(message);

      return;

    }



    window.localStorage.setItem(

      "calendar:event-result",

      JSON.stringify({

        mode: "delete",

        sourceEventId,

        backendId,

      })

    );



    window.localStorage.removeItem("calendar:event-action");

    window.localStorage.removeItem("calendar:selected-event");

    window.localStorage.removeItem("calendar:reuse-event");



    if (embedded) {

      onComplete?.();

      return;

    }



    router.push("/calendarmanagment");

  };



  const getFinalEventTitle = () => {

    const enteredTitle = title.trim() || "New Event";



    if (

      formMode !== "reuse" ||

      !reuseOriginalTitle ||

      enteredTitle !== reuseOriginalTitle

    ) {

      return enteredTitle;

    }



    let existingEvents: Array<{ title?: string; eventTitle?: string }> = [];



    try {

      const storedEvents = window.localStorage.getItem("calendar:events");

      if (storedEvents) {

        const parsed = JSON.parse(storedEvents);

        if (Array.isArray(parsed)) existingEvents = parsed;

      }

    } catch {

      existingEvents = [];

    }



    const usedTitles = new Set(

      existingEvents

        .map((event) => (event.eventTitle || event.title || "").trim())

        .filter(Boolean)

    );



    let copyNumber = 2;

    let candidate = `${reuseOriginalTitle} ${copyNumber}`;



    while (usedTitles.has(candidate)) {

      copyNumber += 1;

      candidate = `${reuseOriginalTitle} ${copyNumber}`;

    }



    return candidate;

  };



  const normalizeBackendTime = (value: string) => {

    const trimmed = (value || "").trim();

    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }

    const twelveHourMatch = trimmed.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
    );

    if (twelveHourMatch) {

      let hour = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const second = twelveHourMatch[3] || "00";
      const period = twelveHourMatch[4].toUpperCase();

      if (period === "AM" && hour === 12) hour = 0;
      if (period === "PM" && hour !== 12) hour += 12;

      return `${String(hour).padStart(2, "0")}:${minute}:${second}`;
    }

    return "00:00:00";

  };

  const toBackendDateTime = (dateValue: string, timeValue: string) => {

    const selectedDate = dateValue || new Date().toISOString().slice(0, 10);

    const selectedTime = normalizeBackendTime(timeValue);

    const value = new Date(`${selectedDate}T${selectedTime}`);



    if (Number.isNaN(value.getTime())) {

      throw new Error("Invalid event date or time.");

    }



    return value.toISOString();

  };



  const toBackendStatus = (value: unknown) => {

    const normalized = String(value || "Saved").trim().toUpperCase();



    if (

      normalized === "SAVED" ||

      normalized === "SCHEDULED" ||

      normalized === "PUBLISHED" ||

      normalized === "PAUSED" ||

      normalized === "CLOSED"

    ) {

      return normalized;

    }



    return "SAVED";

  };



  const getBackendErrorMessage = async (response: Response, fallback: string) => {

    try {

      const errorBody = await response.json();



      if (Array.isArray(errorBody?.message)) {

        return errorBody.message.join(", ");

      }



      if (typeof errorBody?.message === "string") {

        return errorBody.message;

      }

    } catch {

      // Keep the supplied fallback message.

    }



    return fallback;

  };



  const uploadAttachmentToBackend = async (file: File) => {
    const token = window.localStorage.getItem("calendar_access_token") || "";

    if (!token) {
      throw new Error("Backend login token is missing. Please sign in again.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/events/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        await getBackendErrorMessage(
          response,
          "Unable to upload the attachment."
        )
      );
    }

    const result = (await response.json()) as {
      attachment?: string;
    };

    if (!result.attachment) {
      throw new Error("Attachment upload did not return a file reference.");
    }

    return result.attachment;
  };

  const saveEventToBackend = async (

    finalTitle: string,

    currentStatus: unknown,

    backendId?: string,

    attachmentValue?: string,

    publishOptions?: {
      audiences?: Array<{ audienceId: string; audienceType: string }>;
      scheduledPublishAt?: string | null;
    }

  ) => {

    const token = window.localStorage.getItem("calendar_access_token") || "";



    if (!token) {

      throw new Error("Backend login token is missing. Please sign in again.");

    }


    const backendPayload = {
      title: finalTitle,
      subtitle: subtitle || undefined,
      description: description || undefined,
      startDate: toBackendDateTime(startDate, startTime),
      endDate: toBackendDateTime(endDate || startDate, endTime || startTime),
      startTime: normalizeBackendTime(startTime),
      endTime: normalizeBackendTime(endTime || startTime),
      location: subtitle || "TBA",
      priority: priority || undefined,
      attachment: attachmentValue ?? (attachment || undefined),
      status: toBackendStatus(currentStatus),

      scheduledPublishAt:
        publishOptions?.scheduledPublishAt === undefined
          ? undefined
          : publishOptions.scheduledPublishAt,

      ...(backendId && publishOptions?.audiences === undefined
        ? {}
        : {
            audiences:
              publishOptions?.audiences !== undefined
                ? publishOptions.audiences
                : currentTenant
                  ? [
                      {
                        audienceId: normalizeEventTenant(currentTenant),
                        audienceType: "TENANT",
                      },
                    ]
                  : [],
          }),

    };



    if (backendId) {

      const response = await fetch(`${API_URL}/events/${backendId}`, {

        method: "PATCH",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify(backendPayload),

      });



      if (!response.ok) {

        throw new Error(

          await getBackendErrorMessage(response, "Unable to update the event in the backend.")

        );

      }



      return (await response.json()) as { id?: string };

    }



    const response = await fetch(`${API_URL}/events`, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify({

        ...backendPayload,

        status: toBackendStatus(currentStatus),

      }),

    });



    if (!response.ok) {

      throw new Error(

        await getBackendErrorMessage(response, "Unable to save the event in the backend.")

      );

    }



    return (await response.json()) as { id?: string };

  };



  const validateEventForm = () => {
    const saveOnlyRequiredFields = [
      title,
      subtitle,
      startDate,
      endDate,
      startTime,
      endTime,
      priority,
      description,
    ];

    const publishRequiredFields = [
      title,
      startDate,
      endDate,
      startTime,
      endTime,
    ];

    const requiredFields =
      publishMode === "none"
        ? saveOnlyRequiredFields
        : publishRequiredFields;

    if (requiredFields.some((value) => !String(value || "").trim())) {
      setFormError(
        publishMode === "none"
          ? "Please fill all required fields before saving or updating the event."
          : "Please fill Event Title, Start Date, End Date, Start Time and End Time before publishing."
      );
      return false;
    }

    const startDateTime = new Date(
      `${startDate}T${normalizeBackendTime(startTime)}`
    );
    const endDateTime = new Date(
      `${endDate}T${normalizeBackendTime(endTime)}`
    );

    if (
      Number.isNaN(startDateTime.getTime()) ||
      Number.isNaN(endDateTime.getTime())
    ) {
      setFormError("Please select a valid start and end date/time.");
      return false;
    }

    if (
      startDate === getLocalTodayValue() &&
      startDateTime.getTime() <= Date.now()
    ) {
      setFormError(
        "Start time for today must be later than the current time."
      );
      return false;
    }

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setFormError(
        startDate === endDate
          ? "End time must be later than start time."
          : "End date must be later than or equal to start date."
      );
      return false;
    }

    if (publishMode !== "none") {
      if (!publishAudienceType) {
        setFormError("Please select Audience before publishing.");
        return false;
      }

      if (
        publishAudienceType === "Specific Tenant" &&
        publishOrganizations.length === 0
      ) {
        setFormError(
          "Please select at least one Institute / Organization before publishing."
        );
        return false;
      }

      if (
        publishAudienceType === "Tenant + Actor" &&
        publishSelectedTenants.length === 0
      ) {
        setFormError("Please select at least one Tenant before publishing.");
        return false;
      }

      if (
        (publishAudienceType === "Specific Actor" ||
          publishAudienceType === "Tenant + Actor") &&
        publishSelectedActors.length === 0
      ) {
        setFormError("Please select at least one Actor before publishing.");
        return false;
      }

      if (
        publishAudienceType === "Specific Organization + Actor" &&
        publishTargets.length === 0
      ) {
        setFormError(
          "Please select the Institute / Organization and Actor before publishing."
        );
        return false;
      }
    }

    if (publishMode === "schedule") {
      if (!publishScheduleDate || !publishScheduleTime) {
        setFormError("Please select publish date and time.");
        return false;
      }

      const scheduledDate = new Date(
        `${publishScheduleDate}T${normalizeBackendTime(publishScheduleTime)}`
      );

      if (
        Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate.getTime() <= Date.now()
      ) {
        setFormError("Please select a future publish date and time.");
        return false;
      }
    }

    setFormError("");
    return true;
  };

  const saveEvent = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setFormError("");

    if (!validateEventForm()) {
      return;
    }



    const eventDate = startDate

      ? new Date(`${startDate}T00:00:00`)

      : new Date();



    const finalTitle = getFinalEventTitle();

    const existingBackendId =

      formMode === "edit" &&

      sourceEvent &&

      typeof sourceEvent.backendId === "string"

        ? sourceEvent.backendId

        : undefined;



    let finalAttachment = attachment;

    try {

      if (attachmentFile) {

        finalAttachment = await uploadAttachmentToBackend(attachmentFile);

      }

    } catch (error) {

      alert(

        error instanceof Error

          ? error.message

          : "Unable to upload the attachment."

      );

      return;

    }



    const savedLogin = window.localStorage.getItem("calendar_dummy_login");
    let localOwner = "";
    try {
      const activeLogin = savedLogin ? JSON.parse(savedLogin) as { role?: string; tenantType?: string } : null;
      if (activeLogin?.role) {
        localOwner = `${activeLogin.role}::${activeLogin.tenantType || ""}`;
      }
    } catch {
      // An invalid login record should not prevent saving the event.
    }

    const backendAudiences =
      publishAudienceType === "All"
        ? []
        : publishAudienceType === "Tenant Only"
          ? availablePublishTenants.map((tenantValue) => ({
              audienceId: tenantValue,
              audienceType: "TENANT",
            }))
          : publishAudienceType === "Actor Only"
            ? publishActors.map((actorValue) => ({
                audienceId: actorValue,
                audienceType: "ROLE",
              }))
            : publishAudienceType === "Specific Tenant"
              ? publishOrganizations.map((item) => ({
                  audienceId: `${item.tenant}::${item.organization}`,
                  audienceType: "ORGANIZATION",
                }))
              : publishAudienceType === "Specific Actor"
                ? publishSelectedActors.map((actorValue) => ({
                    audienceId: actorValue,
                    audienceType: "ROLE",
                  }))
                : publishAudienceType === "Tenant + Actor"
                  ? publishSelectedTenants.flatMap((tenantValue) =>
                      publishSelectedActors.map((actorValue) => ({
                        audienceId: `${tenantValue}::${actorValue}`,
                        audienceType: "TARGET",
                      }))
                    )
                  : publishTargets.map((item) => ({
                      audienceId: `${item.tenant}::${item.organization}::${item.actor}`,
                      audienceType: "TARGET",
                    }));

    const scheduledPublishAt =
      publishMode === "schedule"
        ? new Date(
            `${publishScheduleDate}T${normalizeBackendTime(publishScheduleTime)}`
          ).toISOString()
        : null;

    const sourceStatusForEdit =
      formMode === "edit"
        ? String(sourceEvent?.status || "Saved")
        : "Saved";

    const finalBackendStatus =
      publishMode === "publish"
        ? "Published"
        : publishMode === "schedule"
          ? "Scheduled"
          : formMode === "edit"
            ? sourceStatusForEdit
            : "Saved";

    const publishAudienceLabel =
      publishAudienceType === "All"
        ? "All Tenants & Actors"
        : publishAudienceType === "Tenant Only"
          ? "All Tenants"
          : publishAudienceType === "Actor Only"
            ? "All Actors"
            : publishAudienceType === "Specific Tenant"
              ? publishOrganizations
                  .map((item) => `${item.tenant} - ${item.organization}`)
                  .join(", ")
              : publishAudienceType === "Specific Actor"
                ? publishSelectedActors.join(", ")
                : publishAudienceType === "Tenant + Actor"
                  ? `${publishSelectedTenants.join(", ")} | ${publishSelectedActors.join(", ")}`
                  : publishTargets
                      .map(
                        (item) =>
                          `${item.tenant} - ${item.organization} - ${getPublishActorLabel(
                            item.tenant,
                            item.actor
                          )}`
                      )
                      .join(", ");

    const eventPayload = {

      ...(formMode === "edit" && sourceEvent ? sourceEvent : {}),

      id: formMode === "edit" && sourceEventId !== null ? sourceEventId : Date.now(),

      backendId: existingBackendId,

      localOwner: localOwner || (formMode === "edit" ? sourceEvent?.localOwner : undefined),

      title: finalTitle,

      eventTitle: finalTitle,

      eventSubtitle: subtitle,

      subtitle,

      startDate,

      endDate,

      startTime,

      endTime,

      date: eventDate.toLocaleDateString("en-US", {

        month: "short",

        day: "numeric",

        year: "numeric",

      }),

      day: eventDate.getDate(),

      month: eventDate.getMonth(),

      year: eventDate.getFullYear(),

      start: startTime || "00:00",

      end: endTime || "00:00",

      location: subtitle || "TBA",

      attendees:

        formMode === "edit" && sourceEvent && typeof sourceEvent.attendees === "number"

          ? sourceEvent.attendees

          : 0,

      status: finalBackendStatus,

      organizer:
        publishMode === "none"
          ? (formMode === "edit" ? (sourceEvent as any)?.organizer : undefined)
          : publishOrganizer.trim() || undefined,

      scheduledPublishAt:
        publishMode === "schedule"
          ? scheduledPublishAt || undefined
          : formMode === "edit"
            ? sourceEvent?.scheduledPublishAt
            : undefined,

      audience:
        publishMode === "none"
          ? (formMode === "edit" ? sourceEvent?.audience : undefined)
          : publishAudienceLabel,

      tenant:
        publishMode === "none"
          ? (formMode === "edit" ? sourceEvent?.tenant : undefined)
          : publishAudienceType === "All" ||
              publishAudienceType === "Actor Only" ||
              publishAudienceType === "Specific Actor"
            ? undefined
            : publishAudienceType === "Tenant Only"
              ? availablePublishTenants.join(", ")
              : publishAudienceType === "Specific Tenant"
                ? Array.from(
                    new Set(publishOrganizations.map((item) => item.tenant))
                  ).join(", ")
                : publishAudienceType === "Tenant + Actor"
                  ? publishSelectedTenants.join(", ")
                : publishTargets.map((item) => item.tenant).join(", "),

      role:
        publishMode === "none"
          ? (formMode === "edit" ? sourceEvent?.role : undefined)
          : publishAudienceType === "Actor Only"
            ? publishActors.join(", ")
            : publishAudienceType === "Specific Actor" ||
                publishAudienceType === "Tenant + Actor"
              ? publishSelectedActors.join(", ")
              : publishAudienceType === "Specific Organization + Actor"
                ? publishTargets.map((item) => item.actor).join(", ")
                : undefined,

      color:

        formMode === "edit" && sourceEvent && typeof sourceEvent.color === "string"

          ? sourceEvent.color

          : "#2D55D7",

      priority,

      description,

      attachment: finalAttachment,

    };



    try {

      if (formMode === "edit" && existingBackendId) {

        const updatedBackendEvent = await saveEventToBackend(

          finalTitle,

          finalBackendStatus,

          existingBackendId,

          finalAttachment,

          {
            audiences:
              publishMode === "none" ? undefined : backendAudiences,
            scheduledPublishAt:
              publishMode === "none"
                ? undefined
                : publishMode === "schedule"
                  ? scheduledPublishAt
                  : null,
          }

        );



        if (updatedBackendEvent.id) {

          eventPayload.backendId = updatedBackendEvent.id;

        }

      } else if (formMode !== "edit") {

        const createdBackendEvent = await saveEventToBackend(

          finalTitle,

          finalBackendStatus,

          undefined,

          finalAttachment,

          {
            audiences:
              publishMode === "none" ? undefined : backendAudiences,
            scheduledPublishAt:
              publishMode === "schedule"
                ? scheduledPublishAt
                : null,
          }

        );



        if (createdBackendEvent.id) {

          eventPayload.backendId = createdBackendEvent.id;

        }

      }

    } catch (error) {

      const message =

        error instanceof Error

          ? error.message

          : "Unable to save the event to the backend.";



      alert(message);

      return;

    }



    if (formMode === "edit") {

      window.localStorage.setItem(

        "calendar:event-result",

        JSON.stringify({

          mode: "edit",

          sourceEventId,

          event: eventPayload,

        })

      );

    } else {

      window.localStorage.setItem(

        "calendar:new-event",

        JSON.stringify(eventPayload)

      );

    }



    window.localStorage.removeItem("calendar:event-action");

    window.localStorage.removeItem("calendar:selected-event");

    window.localStorage.removeItem("calendar:reuse-event");



    if (embedded) {

      onComplete?.();

      return;

    }

    router.push("/calendarmanagment");

  };



  return (

    <main

      className={`addEventPage ${embedded ? "embeddedAddEventPage" : ""}`}

      style={

        embedded

          ? {

              position: "fixed",

              inset: 0,

              zIndex: 2147483000,

              width: "100%",

              height: "100dvh",

              minHeight: 0,

              padding: "20px",

              overflowY: "auto",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background: "rgba(31, 41, 55, 0.18)",

            }

          : undefined

      }

    >

      <section className="addEventModal">

        <div className="modalScrollRail" aria-hidden="true">

        <span className="modalScrollThumb" />

      </div>

      <div

        className="modalScroller"

        onScroll={(event) => {

          const scroller = event.currentTarget;

          const rail = scroller.parentElement?.querySelector(".modalScrollRail");

          const thumb = rail?.querySelector(".modalScrollThumb") as HTMLElement | null;

          if (!rail || !thumb) return;



          const maxScroll = scroller.scrollHeight - scroller.clientHeight;

          const startOffset = 68;

          const maxTravel = Math.max(startOffset, rail.clientHeight - thumb.offsetHeight);

          const progress = maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;

          const thumbTravel = progress * (maxTravel - startOffset);

          thumb.style.transform = `translateY(${thumbTravel}px)`;

          (rail as HTMLElement).style.setProperty(

            "--scroll-thumb-center",

            `${startOffset + thumbTravel + thumb.offsetHeight / 2}px`

          );

        }}

      >

          <button type="button" className="closeButton" aria-label="Close" onClick={cancelForm}>

            <Image src={icons.close} alt="" width={24} height={24} />

          </button>

          <header className="addEventHero">

            <Image

              src="/assets/calendar-icons/bg.png"

              alt=""

              fill

              priority

              className="addEventHeroBackground"

              sizes="255px"

            />

            <div className="heroTitle">

              <Image src={icons.heading} alt="" width={28} height={28} />

              <h1>{formMode === "edit" ? "Edit Event" : "Add Event"}</h1>

            </div>

            <p>{formMode === "edit" ? "Update Event Details" : "Turn Plans Into Action"}</p>

          </header>



          <form onSubmit={saveEvent}>

            <div className="fieldGroup">

              <label>EVENT TITLE</label>

              <FormDropdown

                placeholder="Select event Title"

                value={title}

                options={eventTitles}

                open={openDropdown === "title"}

                searchable

                onToggle={() => setOpenDropdown(openDropdown === "title" ? null : "title")}

                onSelect={(v) => {

                  setTitle(v);

                  setSubtitle("");

                  setOpenDropdown(null);

                }}

              />

            </div>



            <div className="fieldGroup">

              <label>EVENT SUBTITLE</label>

              <FormDropdown

                placeholder={title ? "Select event Subtitle" : "Select Event Title first"}

                value={subtitle}

                options={eventSubtitles}

                open={openDropdown === "subtitle"}

                searchable

                disabled={!title}

                onToggle={() => setOpenDropdown(openDropdown === "subtitle" ? null : "subtitle")}

                onSelect={(v) => {

                  setSubtitle(v);

                  setOpenDropdown(null);

                }}

              />

            </div>



            <div className="twoColumns">

              <div className="fieldGroup">

                <label>START DATE</label>

                <div className="customPickerWrap">

                  <button

                    type="button"

                    className="neoPickerField"

                    onClick={() => setOpenPicker(openPicker === "startDate" ? null : "startDate")}

                  >

                    <span>{startDate ? formatDisplayDate(startDate) : "Select date"}</span>

                    <span className="neoPickerIcon">

                      <Image src={icons.calendar} alt="" width={18} height={18} />

                    </span>

                  </button>



                  {openPicker === "startDate" && (

                    <CustomDatePicker

                      value={startDate}

                      month={calendarMonth}

                      onMonthChange={setCalendarMonth}

                      minDate={new Date().toLocaleDateString("en-CA")}

                      onSelect={(value) => {

                        setFormError("");
                        setStartDate(value);

                        if (
                          value === getLocalTodayValue() &&
                          startTime &&
                          normalizeBackendTime(startTime) <=
                            getCurrentLocalTimeValue()
                        ) {
                          setStartTime("");
                          setEndTime("");
                          setFormError(
                            "Today selected. Please choose a start time later than the current time."
                          );
                        }

                        if (endDate && endDate < value) {
                          setEndDate("");
                          setEndTime("");
                        }

                        setOpenPicker(null);

                      }}

                    />

                  )}

                </div>

              </div>

              <div className="fieldGroup">

                <label>END DATE</label>

                <div className="customPickerWrap">

                  <button

                    type="button"

                    className="neoPickerField"

                    onClick={() => setOpenPicker(openPicker === "endDate" ? null : "endDate")}

                  >

                    <span>{endDate ? formatDisplayDate(endDate) : "Select date"}</span>

                    <span className="neoPickerIcon">

                      <Image src={icons.calendar} alt="" width={18} height={18} />

                    </span>

                  </button>



                  {openPicker === "endDate" && (

                    <CustomDatePicker

                      value={endDate}

                      month={calendarMonth}

                      onMonthChange={setCalendarMonth}

                      minDate={startDate || new Date().toLocaleDateString("en-CA")}

                      onSelect={(value) => {

                        if (startDate && value < startDate) {
                          setFormError("Please select today or a date after the start date.");
                          return;
                        }

                        setFormError("");

                        setFormError("");
                        setEndDate(value);

                        if (
                          value === startDate &&
                          startTime &&
                          endTime &&
                          normalizeBackendTime(endTime) <= normalizeBackendTime(startTime)
                        ) {
                          setEndTime("");
                        }

                        setOpenPicker(null);

                      }}

                    />

                  )}

                </div>

              </div>

            </div>



            <div className="twoColumns">

              <div className="fieldGroup">

                <label>START TIME</label>

                <div className="customPickerWrap">

                  <button

                    type="button"

                    className="neoPickerField"

                    onClick={() => {

                      setOpenDropdown(null);

                      const willOpen = openPicker !== "startTime";

                      if (
                        willOpen &&
                        startDate === getLocalTodayValue()
                      ) {
                        setFormError(
                          `Today selected. Choose a start time later than ${getCurrentLocalTimeValue()}.`
                        );
                      } else {
                        setFormError("");
                      }

                      setOpenPicker(
                        openPicker === "startTime" ? null : "startTime"
                      );

                    }}

                  >

                    <span>{startTime || "00:00:00"}</span>

                    <span className="neoPickerIcon">

                      <Image src={icons.clock} alt="" width={18} height={18} />

                    </span>

                  </button>



                  {openPicker === "startTime" && (

                    <CustomTimePicker

                      value={startTime}

                      minTime={
                        startDate === getLocalTodayValue()
                          ? getCurrentLocalTimeValue()
                          : undefined
                      }

                      onSelect={(value) => {

                        if (
                          startDate === getLocalTodayValue() &&
                          normalizeBackendTime(value) <=
                            getCurrentLocalTimeValue()
                        ) {
                          setFormError(
                            "That time has already passed. Please select a later start time."
                          );
                          return;
                        }

                        setFormError("");
                        setStartTime(value);

                        if (
                          endTime &&
                          startDate &&
                          endDate &&
                          startDate === endDate &&
                          normalizeBackendTime(endTime) <=
                            normalizeBackendTime(value)
                        ) {
                          setEndTime("");
                        }


                      }}

                    />

                  )}

                </div>

              </div>

              <div className="fieldGroup">

                <label>END TIME</label>

                <div className="customPickerWrap">

                  <button

                    type="button"

                    className="neoPickerField"

                    onClick={() => {

                      setOpenDropdown(null);

                      setFormError("");

                      setOpenPicker(
                        openPicker === "endTime" ? null : "endTime"
                      );

                    }}

                  >

                    <span>{endTime || "00:00:00"}</span>

                    <span className="neoPickerIcon">

                      <Image src={icons.clock} alt="" width={18} height={18} />

                    </span>

                  </button>



                  {openPicker === "endTime" && (

                    <CustomTimePicker

                      value={endTime}


                      minTime={
                        startDate &&
                        endDate &&
                        startDate === endDate &&
                        startTime
                          ? normalizeBackendTime(startTime)
                          : undefined
                      }

                      onSelect={(value) => {

                        if (
                          startTime &&
                          startDate &&
                          endDate &&
                          startDate === endDate &&
                          normalizeBackendTime(value) <=
                            normalizeBackendTime(startTime)
                        ) {
                          setFormError("End time must be later than start time.");
                          return;
                        }

                        setFormError("");
                        setEndTime(value);


                      }}

                    />

                  )}

                </div>

              </div>

            </div>



            <div className="fieldGroup">

              <label>PRIORITY</label>

              <FormDropdown

                placeholder="Select Priority"

                value={priority}

                options={priorities}

                open={openDropdown === "priority"}

                onToggle={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}

                onSelect={(v) => {

                  setPriority(v);

                  setOpenDropdown(null);

                }}

              />

            </div>



            <div className="fieldGroup descriptionFieldGroup">

              <div className="descriptionLabelRow">

                <label>DESCRIPTION</label>

                <span className="descriptionCounter">{description.length}/250</span>

              </div>

              <textarea

                placeholder="Type your Details  here....."

                value={description}

                maxLength={250}

                onChange={(e) => setDescription(e.target.value)}

              />

            </div>



            <div className="fieldGroup">

              <label>ATTACHMENT</label>

              <label className="attachmentControl">

                <span className="attachmentIcon"><Image src={icons.attachment} alt="" width={20} height={20} /></span>

                <span className="attachmentText"><strong>{attachment || "Choose File Drag and Drop"}</strong><small>pdf, jpg, png, etc...</small></span>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAttachmentFile(file);
                    if (file) {
                      setFormError("");
                      setAttachment(file.name);
                    }
                  }}
                />

              </label>

            </div>


            {showPublishOptions && publishMode !== "none" && (
              <div className="publishInlineSection">
                <label className="publishInlineLabel">
                  {publishMode === "schedule" ? "SCHEDULE PUBLISH" : "PUBLISH"}
                </label>

                <div className="publishInlineFields">

                  <div className="fieldGroup publishInlineField">
                    <label>ORGANIZER</label>
                    <input
                      className="publishOrganizerInput"
                      value={publishOrganizer}
                      placeholder="Enter Organizer (Optional)"
                      onChange={(event) => {
                        setPublishOrganizer(event.target.value);
                        setFormError("");
                      }}
                    />
                  </div>

                  <div className="fieldGroup publishInlineField">
                    <label>AUDIENCE</label>

                    <FormDropdown
                      placeholder="Select Audience"
                      value={publishAudienceDisplayValue}
                      options={[
                        "Default",
                        "Tenant",
                        "Actor",
                        "Specific Tenant",
                      ]}
                      open={openDropdown === "publishAudience"}
                      onToggle={() =>
                        setOpenDropdown(
                          openDropdown === "publishAudience"
                            ? null
                            : "publishAudience"
                        )
                      }
                      onSelect={(value) => {
                        selectPublishAudienceType(
                          (
                            value === "Default"
                              ? "All"
                              : value === "Tenant"
                                ? "Tenant Only"
                                : value === "Actor"
                                  ? "Actor Only"
                                  : value
                          ) as PublishAudienceType
                        );
                        setOpenDropdown(null);
                        setFormError("");
                      }}
                    />

                  </div>

                  {publishAudienceType === "Specific Tenant" && (
                    <>
                      {!isTenantScopedPublisher && (
                        <div className="fieldGroup publishInlineField">
                          <label>TENANT</label>
                          <FormDropdown
                            placeholder="Select Tenant"
                            value={publishTenant}
                            options={availablePublishTenants}
                            open={openDropdown === "publishTenant"}
                            onToggle={() =>
                              setOpenDropdown(
                                openDropdown === "publishTenant"
                                  ? null
                                  : "publishTenant"
                              )
                            }
                            onSelect={(value) => {
                              setPublishTenant(value);
                              setPublishOrganization("");
                              setOpenDropdown(null);
                              setFormError("");
                            }}
                          />
                        </div>
                      )}

                      {isTenantScopedPublisher && (
                        <div className="fieldGroup publishInlineField">
                          <label>TENANT</label>
                          <div className="publishReadOnlyField">
                            {normalizePublishTenantLabel(currentTenant) || "Current Tenant"}
                          </div>
                        </div>
                      )}

                      {(isTenantScopedPublisher || publishTenant) && (
                        <div className="fieldGroup publishInlineField">
                          <label>INSTITUTE / ORGANIZATION</label>
                          <FormDropdown
                            placeholder="Select Institute / Organization"
                            value={publishOrganization}
                            options={
                              publishOrganizationsByTenant[
                                isTenantScopedPublisher
                                  ? normalizePublishTenantLabel(currentTenant)
                                  : publishTenant
                              ] || []
                            }
                            open={openDropdown === "publishOrganization"}
                            onToggle={() =>
                              setOpenDropdown(
                                openDropdown === "publishOrganization"
                                  ? null
                                  : "publishOrganization"
                              )
                            }
                            onSelect={(value) => {
                              const tenantValue = isTenantScopedPublisher
                                ? normalizePublishTenantLabel(currentTenant)
                                : publishTenant;

                              setPublishOrganization(value);
                              addPublishOrganization(tenantValue, value);
                              setFormError("");
                            }}
                            searchable
                          />
                        </div>
                      )}

                      {publishOrganizations.length > 0 && (
                        <div className="publishTargetList">
                          {publishOrganizations.map((item) => (
                            <span
                              key={`${item.tenant}-${item.organization}`}
                              className="publishTargetChip"
                            >
                              <span className="publishTargetChipText">
                                {item.tenant} - {item.organization}
                              </span>
                              <button
                                type="button"
                                className="publishTargetRemove"
                                onClick={() =>
                                  setPublishOrganizations((previous) =>
                                    previous.filter(
                                      (target) =>
                                        !(
                                          target.tenant === item.tenant &&
                                          target.organization === item.organization
                                        )
                                    )
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {publishAudienceType === "Specific Actor" && (
                    <>
                      <div className="fieldGroup publishInlineField">
                        <label>ACTOR</label>
                        <FormDropdown
                          placeholder="Select Actor"
                          value={publishActor}
                          options={publishActors}
                          open={openDropdown === "publishActor"}
                          onToggle={() =>
                            setOpenDropdown(
                              openDropdown === "publishActor"
                                ? null
                                : "publishActor"
                            )
                          }
                          onSelect={(value) => {
                            addSelectedActor(value);
                            setFormError("");
                          }}
                        />
                      </div>

                      {publishSelectedActors.length > 0 && (
                        <div className="publishTargetList">
                          {publishSelectedActors.map((actorValue) => (
                            <span key={actorValue} className="publishTargetChip">
                              <span className="publishTargetChipText">{actorValue}</span>
                              <button
                                type="button"
                                className="publishTargetRemove"
                                onClick={() =>
                                  setPublishSelectedActors((previous) =>
                                    previous.filter((item) => item !== actorValue)
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {publishAudienceType === "Tenant + Actor" && (
                    <>
                      <div className="fieldGroup publishInlineField">
                        <label>TENANT</label>
                        <FormDropdown
                          placeholder="Select Tenant"
                          value={publishTenant}
                          options={availablePublishTenants}
                          open={openDropdown === "publishTenant"}
                          onToggle={() =>
                            setOpenDropdown(
                              openDropdown === "publishTenant"
                                ? null
                                : "publishTenant"
                            )
                          }
                          onSelect={(value) => {
                            addSelectedTenant(value);
                            setFormError("");
                          }}
                        />
                      </div>

                      <div className="fieldGroup publishInlineField">
                        <label>ACTOR</label>
                        <FormDropdown
                          placeholder="Select Actor"
                          value={publishActor}
                          options={publishTenantActors}
                          open={openDropdown === "publishActor"}
                          onToggle={() =>
                            setOpenDropdown(
                              openDropdown === "publishActor"
                                ? null
                                : "publishActor"
                            )
                          }
                          onSelect={(value) => {
                            addSelectedActor(value);
                            setFormError("");
                          }}
                        />
                      </div>

                      {(publishSelectedTenants.length > 0 ||
                        publishSelectedActors.length > 0) && (
                        <div className="publishTargetList">
                          {publishSelectedTenants.map((tenantValue) => (
                            <span
                              key={`tenant-${tenantValue}`}
                              className="publishTargetChip"
                            >
                              <span className="publishTargetChipText">{tenantValue}</span>
                              <button
                                type="button"
                                className="publishTargetRemove"
                                onClick={() =>
                                  setPublishSelectedTenants((previous) =>
                                    previous.filter((item) => item !== tenantValue)
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {publishSelectedActors.map((actorValue) => (
                            <span
                              key={`actor-${actorValue}`}
                              className="publishTargetChip"
                            >
                              <span className="publishTargetChipText">{actorValue}</span>
                              <button
                                type="button"
                                className="publishTargetRemove"
                                onClick={() =>
                                  setPublishSelectedActors((previous) =>
                                    previous.filter((item) => item !== actorValue)
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {publishAudienceType === "Specific Organization + Actor" && (
                    <>
                      {!isTenantScopedPublisher && (
                        <div className="fieldGroup publishInlineField">
                          <label>TENANT</label>
                          <FormDropdown
                            placeholder="Select Tenant"
                            value={publishTenant}
                            options={availablePublishTenants}
                            open={openDropdown === "publishTenant"}
                            onToggle={() =>
                              setOpenDropdown(
                                openDropdown === "publishTenant"
                                  ? null
                                  : "publishTenant"
                              )
                            }
                            onSelect={(value) => {
                              setPublishTenant(value);
                              setPublishOrganization("");
                              setPublishActor("");
                              setOpenDropdown(null);
                              setFormError("");
                            }}
                          />
                        </div>
                      )}

                      {isTenantScopedPublisher && (
                        <div className="fieldGroup publishInlineField">
                          <label>TENANT</label>
                          <div className="publishReadOnlyField">
                            {currentTenant || "Current Tenant"}
                          </div>
                        </div>
                      )}

                      {(isTenantScopedPublisher || publishTenant) && (
                        <div className="fieldGroup publishInlineField">
                          <label>INSTITUTE / ORGANIZATION</label>
                          <FormDropdown
                            placeholder="Select Institute / Organization"
                            value={publishOrganization}
                            options={
                              publishOrganizationsByTenant[
                                isTenantScopedPublisher
                                  ? normalizePublishTenantLabel(currentTenant)
                                  : publishTenant
                              ] || []
                            }
                            open={openDropdown === "publishOrganization"}
                            onToggle={() =>
                              setOpenDropdown(
                                openDropdown === "publishOrganization"
                                  ? null
                                  : "publishOrganization"
                              )
                            }
                            onSelect={(value) => {
                              const tenantValue = isTenantScopedPublisher
                                ? normalizePublishTenantLabel(currentTenant)
                                : publishTenant;

                              setPublishOrganization(value);
                              setOpenDropdown(null);
                              setFormError("");

                            }}
                          />
                        </div>
                      )}

                      {publishAudienceType === "Specific Organization + Actor" &&
                        publishOrganization && (
                          <div className="fieldGroup publishInlineField">
                            <label>ACTOR</label>
                            <FormDropdown
                              placeholder="Select Actor"
                              value={publishActor}
                              options={publishTenantActors.map((actor) =>
                                getPublishActorLabel(
                                  isTenantScopedPublisher
                                    ? normalizePublishTenantLabel(currentTenant)
                                    : publishTenant,
                                  actor
                                )
                              )}
                              open={openDropdown === "publishActor"}
                              onToggle={() =>
                                setOpenDropdown(
                                  openDropdown === "publishActor"
                                    ? null
                                    : "publishActor"
                                )
                              }
                              onSelect={(displayValue) => {
                                const tenantValue = isTenantScopedPublisher
                                  ? normalizePublishTenantLabel(currentTenant)
                                  : publishTenant;

                                const actorValue =
                                  publishTenantActors.find(
                                    (actor) =>
                                      getPublishActorLabel(tenantValue, actor) ===
                                      displayValue
                                  ) || displayValue;

                                setPublishActor(actorValue);
                                setOpenDropdown(null);
                                setFormError("");

                                completePublishTargetIfPossible(
                                  tenantValue,
                                  publishOrganization,
                                  actorValue
                                );
                              }}
                            />
                          </div>
                        )}

                      {publishTargets.length > 0 &&
                        publishAudienceType === "Specific Organization + Actor" && (
                          <div className="publishTargetList">
                            {publishTargets.map((item) => (
                              <span
                                key={`${item.tenant}-${item.organization}-${item.actor}`}
                                className="publishTargetChip"
                              >
                                <span className="publishTargetChipText">
                                  {item.tenant} - {item.organization} -{" "}
                                  {getPublishActorLabel(item.tenant, item.actor)}
                                </span>
                                <button
                                  type="button"
                                  className="publishTargetRemove"
                                  onClick={() =>
                                    setPublishTargets((previous) =>
                                      previous.filter(
                                        (target) =>
                                          !(
                                            target.tenant === item.tenant &&
                                            target.organization === item.organization &&
                                            target.actor === item.actor
                                          )
                                      )
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                    </>
                  )}

                  {publishMode === "schedule" && (
                    <div className="publishScheduleGrid">

                      <div className="fieldGroup publishInlineField">
                        <label>PUBLISH DATE</label>
                        <div className="customPickerWrap">
                          <button
                            type="button"
                            className="neoPickerField"
                            onClick={() => {
                              setOpenDropdown(null);
                              setOpenPicker(
                                openPicker === "publishDate"
                                  ? null
                                  : "publishDate"
                              );
                            }}
                          >
                            <span>
                              {publishScheduleDate
                                ? formatDisplayDate(publishScheduleDate)
                                : "Select date"}
                            </span>

                            <span className="neoPickerIcon">
                              <Image
                                src={icons.calendar}
                                alt=""
                                width={18}
                                height={18}
                              />
                            </span>
                          </button>

                          {openPicker === "publishDate" && (
                            <CustomDatePicker
                              value={publishScheduleDate}
                              month={calendarMonth}
                              onMonthChange={setCalendarMonth}
                              minDate={new Date().toLocaleDateString("en-CA")}
                              onSelect={(value) => {
                                setPublishScheduleDate(value);
                                setOpenPicker(null);
                                setFormError("");
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="fieldGroup publishInlineField">
                        <label>PUBLISH TIME</label>
                        <div className="customPickerWrap">
                          <button
                            type="button"
                            className="neoPickerField"
                            onClick={() => {
                              setOpenDropdown(null);
                              setOpenPicker(
                                openPicker === "publishTime"
                                  ? null
                                  : "publishTime"
                              );
                            }}
                          >
                            <span>
                              {publishScheduleTime || "00:00:00"}
                            </span>

                            <span className="neoPickerIcon">
                              <Image
                                src={icons.clock}
                                alt=""
                                width={18}
                                height={18}
                              />
                            </span>
                          </button>

                          {openPicker === "publishTime" && (
                            <CustomTimePicker
                              value={publishScheduleTime}
                              onSelect={(value) => {
                                setPublishScheduleTime(value);
                                setFormError("");
                              }}
                            />
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            )}



            {formError && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  margin: "8px 0 12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(211, 47, 47, 0.08)",
                  color: "#d32f2f",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {formError}
              </div>
            )}

            {formMode === "edit" ? (
              <div className="formActions editEventActions footerActionButtons">
                <button
                  type="button"
                  className="cancelButton"
                  onClick={cancelForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="updateButton"
                  onClick={() => {
                    setPublishMode("none");
                    setShowPublishOptions(false);
                    setOpenDropdown(null);
                    setOpenPicker(null);
                    setFormError("");
                  }}
                >
                  Update Event
                </button>

                <button
                  type={
                    showPublishOptions && publishMode === "publish"
                      ? "submit"
                      : "button"
                  }
                  className={`publishFooterButton ${
                    showPublishOptions && publishMode === "publish"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      !showPublishOptions ||
                      publishMode !== "publish"
                    ) {
                      setPublishMode("publish");
                      setShowPublishOptions(true);
                      setOpenDropdown(null);
                      setOpenPicker(null);
                      setFormError("");
                    }
                  }}
                >
                  Publish
                </button>

                <button
                  type={
                    showPublishOptions && publishMode === "schedule"
                      ? "submit"
                      : "button"
                  }
                  className={`schedulePublishFooterButton ${
                    showPublishOptions && publishMode === "schedule"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      !showPublishOptions ||
                      publishMode !== "schedule"
                    ) {
                      setPublishMode("schedule");
                      setShowPublishOptions(true);
                      setOpenDropdown(null);
                      setOpenPicker(null);
                      setFormError("");
                    }
                  }}
                >
                  Schedule Publish
                </button>
              </div>
            ) : (
              <div className="formActions footerActionButtons">
                <button
                  type="button"
                  className="cancelButton"
                  onClick={cancelForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="saveButton"
                  onClick={() => {
                    setPublishMode("none");
                    setShowPublishOptions(false);
                    setFormError("");
                  }}
                >
                  {formMode === "reuse" ? "Save as New" : "Save Event"}
                </button>

                <button
                  type={
                    showPublishOptions && publishMode === "publish"
                      ? "submit"
                      : "button"
                  }
                  className={`publishFooterButton ${
                    showPublishOptions && publishMode === "publish"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      !showPublishOptions ||
                      publishMode !== "publish"
                    ) {
                      setPublishMode("publish");
                      setShowPublishOptions(true);
                      setOpenDropdown(null);
                      setOpenPicker(null);
                      setFormError("");
                    }
                  }}
                >
                  Publish
                </button>

                <button
                  type={
                    showPublishOptions && publishMode === "schedule"
                      ? "submit"
                      : "button"
                  }
                  className={`schedulePublishFooterButton ${
                    showPublishOptions && publishMode === "schedule"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      !showPublishOptions ||
                      publishMode !== "schedule"
                    ) {
                      setPublishMode("schedule");
                      setShowPublishOptions(true);
                      setOpenDropdown(null);
                      setOpenPicker(null);
                      setFormError("");
                    }
                  }}
                >
                  Schedule Publish
                </button>
              </div>
            )}

          </form>

        </div>

      </section>

    </main>

  );

}
