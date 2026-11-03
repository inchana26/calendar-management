"use client";

import Image from "next/image";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  more: "/assets/calendar-icons/message.svg",
  download: "/assets/calendar-icons/download.svg",
  uploadFile: "/assets/calendar-icons/upload.svg",
};

type CalendarView = "month" | "week" | "day";
type EventStatus = "Published" | "Saved" | "Scheduled" | "Paused" | "Closed" | "Cancelled";

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
  audienceDetails?: string;
  audienceIds?: string[];
  audienceTypes?: string[];
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
  publisherName?: string;
  localOwner?: string;
};

                                           
                                
                                         
                                   
                                           

type BackendEventStatus =
  | "SAVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PAUSED"
  | "CLOSED"
  | "CANCELLED";

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
  // Optional publisher-name fields from event APIs that include user details.
  publisherName?: string | null;
  publishedByName?: string | null;
  createdByName?: string | null;
  publishedBy?: string | null;
  creator?: { name?: string | null } | null;
  createdByUser?: { name?: string | null } | null;
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
    CANCELLED: "Cancelled",
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

// Only display an actual person's name as publisher, never a role or synthetic ID.
function actualCalendarPublisherName(value: unknown): string {
  if (typeof value !== "string") return "";
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.includes("@")) return "";

  const normalized = name.replace(/[-_]+/g, " ").toUpperCase();
  const roleOrPlaceholder = new Set([
    "SUPER ADMIN", "PLATFORM ADMIN", "TENANT ADMIN", "INSTITUTE ADMIN",
    "COORDINATOR", "FACULTY", "STUDENT", "LEARNER", "USER ROLE",
    "ADMIN", "USER", "UNKNOWN", "NOT RECORDED", "NAME UNAVAILABLE",
    "ACADEMY ADMIN", "BOOTCAMP ADMIN", "CORPORATE ADMIN",
    "DEPARTMENT ADMIN", "PROGRAM COORDINATOR", "COHORT COORDINATOR",
    "TRAINER", "INSTRUCTOR", "EMPLOYEE", "VOLUNTEER",
  ]);
  if (
    roleOrPlaceholder.has(normalized) ||
    /^calendar[-_]/i.test(name) ||
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(name)
  ) return "";

  return name;
}

function backendCalendarPublisherName(event: BackendEvent): string {
  return [
    event.publisherName,
    event.publishedByName,
    event.createdByName,
    event.creator?.name,
    event.createdByUser?.name,
    event.publishedBy,
    event.createdBy,
  ].map(actualCalendarPublisherName).find(Boolean) || "";
}

// For an event being created in this browser, retain the authenticated
// user's name if it is available and the login role matches.
function getSignedInCalendarPublisherName(): string {
  if (typeof window === "undefined") return "";
  try {
    const auth = JSON.parse(window.localStorage.getItem("calendar_auth_user") || "null") as
      | { name?: unknown; role?: string }
      | null;
    const session = JSON.parse(window.localStorage.getItem("calendar_dummy_login") || "null") as
      | { role?: string }
      | null;
    if (!auth || !session?.role || !auth.role ||
        auth.role.toUpperCase() !== session.role.toUpperCase()) return "";
    return actualCalendarPublisherName(auth.name);
  } catch {
    return "";
  }
}

function getCalendarEventPublisherLabel(event: CalendarEvent): string {
  // Keep the real creator/publisher name when it is available.
  const personName = actualCalendarPublisherName(event.publisherName) ||
    actualCalendarPublisherName(event.createdBy);
  if (personName) return personName;

  // Older calendar events identify their creator by role instead of name.
  // Restore the previous role label rather than displaying "Name unavailable".
  const creator = (event.createdBy || "").trim();
  const normalizedRole = creator
    .replace(/^calendar[-_]/i, "")
    .replace(/[-_]+/g, " ")
    .toUpperCase();
  if (/^(SUPER ADMIN|PLATFORM ADMIN|TENANT ADMIN|INSTITUTE ADMIN|COORDINATOR|FACULTY|LEARNER|STUDENT)(\s|$)/.test(normalizedRole)) {
    return eventCreatorLabel(creator);
  }

  const localRole = (event.localOwner || "").split("::")[0]?.trim();
  return localRole ? eventCreatorLabel(localRole) : "Not recorded";
}

function formatAudienceTenantLabel(value: string) {
  const normalized = (value || "").trim().toUpperCase();

  const tenantLabels: Record<string, string> = {
    ALL: "All Tenants",
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

  return tenantLabels[normalized] || value.trim();
}

function formatAudienceActorLabel(tenantName: string, value: string) {
  const normalizedActor = (value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .toUpperCase();

  const actorKey =
    normalizedActor === "PLATFORM ADMIN" ||
    normalizedActor === "PLATFORM ADMINS"
      ? "Platform Admins"
      : normalizedActor === "TENANT ADMIN" ||
          normalizedActor === "INSTITUTE ADMIN" ||
          normalizedActor === "INSTITUTE ADMINS" ||
          normalizedActor === "ACADEMY ADMIN" ||
          normalizedActor === "BOOTCAMP ADMIN" ||
          normalizedActor === "CORPORATE ADMIN"
        ? "Institute Admins"
        : normalizedActor === "COORDINATOR" ||
            normalizedActor === "COORDINATORS" ||
            normalizedActor === "PROGRAM COORDINATOR" ||
            normalizedActor === "COHORT COORDINATOR" ||
            normalizedActor === "L&D COORDINATOR"
          ? "Coordinators"
          : normalizedActor === "FACULTY" ||
              normalizedActor === "TRAINER" ||
              normalizedActor === "INSTRUCTOR"
            ? "Faculty"
            : normalizedActor === "STUDENT" ||
                normalizedActor === "STUDENTS" ||
                normalizedActor === "LEARNER" ||
                normalizedActor === "EMPLOYEE"
              ? "Students"
              : value.trim();

  if (actorKey === "Platform Admins") {
    return "Platform Admin";
  }

  const labels: Record<string, Record<string, string>> = {
    "University & College": {
      "Institute Admins": "Institute Admin",
      Coordinators: "Coordinator",
      Faculty: "Faculty",
      Students: "Student",
    },
    "Skill Academy": {
      "Institute Admins": "Academy Admin",
      Coordinators: "Program Coordinator",
      Faculty: "Trainer",
      Students: "Learner",
    },
    Bootcamp: {
      "Institute Admins": "Bootcamp Admin",
      Coordinators: "Cohort Coordinator",
      Faculty: "Instructor",
      Students: "Learner",
    },
    Corporate: {
      "Institute Admins": "Corporate Admin",
      Coordinators: "L&D Coordinator",
      Faculty: "Trainer",
      Students: "Employee",
    },
    Government: {
      "Institute Admins": "Department Admin",
      Coordinators: "Program Coordinator",
      Faculty: "Trainer",
      Students: "Employee",
    },
    NGO: {
      "Institute Admins": "NGO Admin",
      Coordinators: "Program Coordinator",
      Faculty: "Trainer",
      Students: "Volunteer / Learner",
    },
  };

  return labels[tenantName]?.[actorKey] || actorKey;
}

function getBackendAudienceDetails(event: BackendEvent) {
  const audiences = event.audiences || [];

  if (audiences.length === 0) {
    return event.status === "SAVED" ? "" : "All";
  }

    
                                                                       
                                                                      
                                           
     
  const tenantAudienceIds = audiences
    .filter(
      (item) => String(item.audienceType || "").toUpperCase() === "TENANT"
    )
    .map((item) => formatAudienceTenantLabel(item.audienceId))
    .filter(Boolean);

  const allTenantLabels = [
    "University & College",
    "Skill Academy",
    "Bootcamp",
    "Corporate",
    "Government",
    "NGO",
  ];

  const isAllTenantAudience =
    audiences.length === tenantAudienceIds.length &&
    allTenantLabels.every((tenantName) =>
      tenantAudienceIds.includes(tenantName)
    );

  if (isAllTenantAudience) {
    return "Tenant";
  }

    
                                                                           
                                                                         
     
  const roleAudienceCount = audiences.filter(
    (item) => String(item.audienceType || "").toUpperCase() === "ROLE"
  ).length;

  const creator = String(event.createdBy || "").toUpperCase();
  const expectedBroadActorCount =
    creator.includes("SUPER_ADMIN") || creator.includes("SUPER-ADMIN")
      ? 5
      : creator.includes("PLATFORM_ADMIN") || creator.includes("PLATFORM-ADMIN")
        ? 4
        : creator.includes("TENANT_ADMIN") || creator.includes("TENANT-ADMIN")
          ? 3
          : creator.includes("COORDINATOR")
            ? 2
            : creator.includes("FACULTY")
              ? 1
              : 0;

  if (
    expectedBroadActorCount > 0 &&
    audiences.length === roleAudienceCount &&
    roleAudienceCount === expectedBroadActorCount
  ) {
    return "Actor";
  }

  const details = audiences
    .map((item) => {
      const audienceId = (item.audienceId || "").trim();
      const audienceType = (item.audienceType || "").trim().toUpperCase();

      if (!audienceId) return "";

      if (audienceType === "TENANT") {
        return `Tenant: ${formatAudienceTenantLabel(audienceId)}`;
      }

      if (audienceType === "ROLE") {
        return `Actor: ${formatAudienceActorLabel("", audienceId)}`;
      }

      const parts = audienceId
        .split("::")
        .map((part) => part.trim())
        .filter(Boolean);

      if (audienceType === "ORGANIZATION") {
        const tenantLabel = formatAudienceTenantLabel(parts[0] || "");
        const organization = parts[1] || "";

        return [tenantLabel, organization].filter(Boolean).join(" · ");
      }

      if (audienceType === "TARGET") {
        const tenantLabel = formatAudienceTenantLabel(parts[0] || "");

        if (parts.length >= 3) {
          const organization = parts.slice(1, -1).join(" · ");
          const actor = formatAudienceActorLabel(
            tenantLabel,
            parts[parts.length - 1] || ""
          );

          return [tenantLabel, organization, actor]
            .filter(Boolean)
            .join(" · ");
        }

        const actor = formatAudienceActorLabel(
          tenantLabel,
          parts[parts.length - 1] || ""
        );

        return [tenantLabel, actor].filter(Boolean).join(" · ");
      }

      return audienceId;
    })
    .filter(Boolean);

  return Array.from(new Set(details)).join("; ");
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
        .map((item) => {
          const parts = item.audienceId.split("::").filter(Boolean);
          return parts[parts.length - 1] || "";
        })
        .filter(Boolean)
        .join(", ") ||
      event.audiences?.find((item) => item.audienceType === "ROLE")?.audienceId,
    audience:
      event.audiences?.map((item) => item.audienceId).join(", ") || undefined,
    audienceDetails: getBackendAudienceDetails(event) || undefined,
    audienceIds:
      event.audiences?.map((item) => item.audienceId).filter(Boolean) || [],
    audienceTypes:
      event.audiences
        ?.map((item) => String(item.audienceType || "").toUpperCase())
        .filter(Boolean) || [],
    priority: event.priority || undefined,
    attachment: event.attachment || undefined,
    scheduledPublishAt: event.scheduledPublishAt || undefined,
    description: event.description || "",
    createdBy: event.createdBy || undefined,
    publisherName: backendCalendarPublisherName(event) || undefined,
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

                                                                          
                                                                        
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

const initialEvents: CalendarEvent[] = [
  {
    id: 880001,
    title: "Academic Calendar Review",
    eventTitle: "Academic Calendar Review",
    eventSubtitle: "Demo event 1",
    subtitle: "Demo event 1",
    date: "Oct 5, 2026",
    day: 5,
    month: 9,
    year: 2026,
    start: "09:00",
    end: "10:00",
    startDate: "2026-10-05",
    endDate: "2026-10-05",
    startTime: "09:00",
    endTime: "10:00",
    location: "North Valley University",
    attendees: 30,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880002,
    title: "Skill Development Workshop",
    eventTitle: "Skill Development Workshop",
    eventSubtitle: "Demo event 2",
    subtitle: "Demo event 2",
    date: "Oct 6, 2026",
    day: 6,
    month: 9,
    year: 2026,
    start: "10:00",
    end: "11:00",
    startDate: "2026-10-06",
    endDate: "2026-10-06",
    startTime: "10:00",
    endTime: "11:00",
    location: "NextStep Skill Academy",
    attendees: 39,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "",
    audience: "Skill Academy",
    audienceDetails: "Tenant: Skill Academy",
    audienceIds: ["Skill Academy"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880003,
    title: "Bootcamp Kickoff",
    eventTitle: "Bootcamp Kickoff",
    eventSubtitle: "Demo event 3",
    subtitle: "Demo event 3",
    date: "Oct 7, 2026",
    day: 7,
    month: 9,
    year: 2026,
    start: "11:00",
    end: "12:00",
    startDate: "2026-10-07",
    endDate: "2026-10-07",
    startTime: "11:00",
    endTime: "12:00",
    location: "CodeSprint Bootcamp",
    attendees: 48,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-10-07T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880004,
    title: "Employee Onboarding",
    eventTitle: "Employee Onboarding",
    eventSubtitle: "Demo event 4",
    subtitle: "Demo event 4",
    date: "Oct 8, 2026",
    day: 8,
    month: 9,
    year: 2026,
    start: "12:00",
    end: "13:00",
    startDate: "2026-10-08",
    endDate: "2026-10-08",
    startTime: "12:00",
    endTime: "13:00",
    location: "Apex Global Pvt Ltd",
    attendees: 57,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "Faculty",
    audience: "Corporate::Apex Global Pvt Ltd::Faculty",
    audienceDetails: "Corporate · Apex Global Pvt Ltd · Faculty",
    audienceIds: ["Corporate::Apex Global Pvt Ltd::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880005,
    title: "Digital Services Training",
    eventTitle: "Digital Services Training",
    eventSubtitle: "Demo event 5",
    subtitle: "Demo event 5",
    date: "Oct 9, 2026",
    day: 9,
    month: 9,
    year: 2026,
    start: "13:00",
    end: "14:00",
    startDate: "2026-10-09",
    endDate: "2026-10-09",
    startTime: "13:00",
    endTime: "14:00",
    location: "Department of Digital Services",
    attendees: 66,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880006,
    title: "Volunteer Orientation",
    eventTitle: "Volunteer Orientation",
    eventSubtitle: "Demo event 6",
    subtitle: "Demo event 6",
    date: "Oct 10, 2026",
    day: 10,
    month: 9,
    year: 2026,
    start: "14:00",
    end: "15:00",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    startTime: "14:00",
    endTime: "15:00",
    location: "Hope Foundation",
    attendees: 75,
    status: "Cancelled",
    color: "#2D55D7",
    tenant: "NGO",
    role: "",
    audience: "NGO",
    audienceDetails: "Tenant: NGO",
    audienceIds: ["NGO"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880007,
    title: "Faculty Orientation",
    eventTitle: "Faculty Orientation",
    eventSubtitle: "Demo event 7",
    subtitle: "Demo event 7",
    date: "Oct 11, 2026",
    day: 11,
    month: 9,
    year: 2026,
    start: "15:00",
    end: "16:00",
    startDate: "2026-10-11",
    endDate: "2026-10-11",
    startTime: "15:00",
    endTime: "16:00",
    location: "North Valley University",
    attendees: 84,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880008,
    title: "Generative AI Session",
    eventTitle: "Generative AI Session",
    eventSubtitle: "Demo event 8",
    subtitle: "Demo event 8",
    date: "Oct 12, 2026",
    day: 12,
    month: 9,
    year: 2026,
    start: "09:00",
    end: "10:00",
    startDate: "2026-10-12",
    endDate: "2026-10-12",
    startTime: "09:00",
    endTime: "10:00",
    location: "NextStep Skill Academy",
    attendees: 93,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "Faculty",
    audience: "Skill Academy::NextStep Skill Academy::Faculty",
    audienceDetails: "Skill Academy · NextStep Skill Academy · Faculty",
    audienceIds: ["Skill Academy::NextStep Skill Academy::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880009,
    title: "Live Coding Session",
    eventTitle: "Live Coding Session",
    eventSubtitle: "Demo event 9",
    subtitle: "Demo event 9",
    date: "Oct 13, 2026",
    day: 13,
    month: 9,
    year: 2026,
    start: "10:00",
    end: "11:00",
    startDate: "2026-10-13",
    endDate: "2026-10-13",
    startTime: "10:00",
    endTime: "11:00",
    location: "CodeSprint Bootcamp",
    attendees: 102,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-10-13T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880010,
    title: "Compliance Training",
    eventTitle: "Compliance Training",
    eventSubtitle: "Demo event 10",
    subtitle: "Demo event 10",
    date: "Oct 14, 2026",
    day: 14,
    month: 9,
    year: 2026,
    start: "11:00",
    end: "12:00",
    startDate: "2026-10-14",
    endDate: "2026-10-14",
    startTime: "11:00",
    endTime: "12:00",
    location: "Apex Global Pvt Ltd",
    attendees: 111,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "",
    audience: "Corporate",
    audienceDetails: "Tenant: Corporate",
    audienceIds: ["Corporate"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880011,
    title: "Governance Review",
    eventTitle: "Governance Review",
    eventSubtitle: "Demo event 11",
    subtitle: "Demo event 11",
    date: "Oct 15, 2026",
    day: 15,
    month: 9,
    year: 2026,
    start: "12:00",
    end: "13:00",
    startDate: "2026-10-15",
    endDate: "2026-10-15",
    startTime: "12:00",
    endTime: "13:00",
    location: "Department of Digital Services",
    attendees: 120,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880012,
    title: "Community Outreach",
    eventTitle: "Community Outreach",
    eventSubtitle: "Demo event 12",
    subtitle: "Demo event 12",
    date: "Oct 16, 2026",
    day: 16,
    month: 9,
    year: 2026,
    start: "13:00",
    end: "14:00",
    startDate: "2026-10-16",
    endDate: "2026-10-16",
    startTime: "13:00",
    endTime: "14:00",
    location: "Hope Foundation",
    attendees: 129,
    status: "Cancelled",
    color: "#2D55D7",
    tenant: "NGO",
    role: "Faculty",
    audience: "NGO::Hope Foundation::Faculty",
    audienceDetails: "NGO · Hope Foundation · Faculty",
    audienceIds: ["NGO::Hope Foundation::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880013,
    title: "Student Induction",
    eventTitle: "Student Induction",
    eventSubtitle: "Demo event 13",
    subtitle: "Demo event 13",
    date: "Oct 17, 2026",
    day: 17,
    month: 9,
    year: 2026,
    start: "14:00",
    end: "15:00",
    startDate: "2026-10-17",
    endDate: "2026-10-17",
    startTime: "14:00",
    endTime: "15:00",
    location: "North Valley University",
    attendees: 138,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880014,
    title: "Career Readiness Program",
    eventTitle: "Career Readiness Program",
    eventSubtitle: "Demo event 14",
    subtitle: "Demo event 14",
    date: "Oct 18, 2026",
    day: 18,
    month: 9,
    year: 2026,
    start: "15:00",
    end: "16:00",
    startDate: "2026-10-18",
    endDate: "2026-10-18",
    startTime: "15:00",
    endTime: "16:00",
    location: "NextStep Skill Academy",
    attendees: 147,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "",
    audience: "Skill Academy",
    audienceDetails: "Tenant: Skill Academy",
    audienceIds: ["Skill Academy"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880015,
    title: "Technical Assessment",
    eventTitle: "Technical Assessment",
    eventSubtitle: "Demo event 15",
    subtitle: "Demo event 15",
    date: "Oct 19, 2026",
    day: 19,
    month: 9,
    year: 2026,
    start: "09:00",
    end: "10:00",
    startDate: "2026-10-19",
    endDate: "2026-10-19",
    startTime: "09:00",
    endTime: "10:00",
    location: "CodeSprint Bootcamp",
    attendees: 36,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-10-19T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880016,
    title: "Leadership Training",
    eventTitle: "Leadership Training",
    eventSubtitle: "Demo event 16",
    subtitle: "Demo event 16",
    date: "Oct 20, 2026",
    day: 20,
    month: 9,
    year: 2026,
    start: "10:00",
    end: "11:00",
    startDate: "2026-10-20",
    endDate: "2026-10-20",
    startTime: "10:00",
    endTime: "11:00",
    location: "Apex Global Pvt Ltd",
    attendees: 45,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "Faculty",
    audience: "Corporate::Apex Global Pvt Ltd::Faculty",
    audienceDetails: "Corporate · Apex Global Pvt Ltd · Faculty",
    audienceIds: ["Corporate::Apex Global Pvt Ltd::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880017,
    title: "Capacity Building Program",
    eventTitle: "Capacity Building Program",
    eventSubtitle: "Demo event 17",
    subtitle: "Demo event 17",
    date: "Oct 21, 2026",
    day: 21,
    month: 9,
    year: 2026,
    start: "11:00",
    end: "12:00",
    startDate: "2026-10-21",
    endDate: "2026-10-21",
    startTime: "11:00",
    endTime: "12:00",
    location: "Department of Digital Services",
    attendees: 54,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880018,
    title: "Impact Assessment Review",
    eventTitle: "Impact Assessment Review",
    eventSubtitle: "Demo event 18",
    subtitle: "Demo event 18",
    date: "Oct 22, 2026",
    day: 22,
    month: 9,
    year: 2026,
    start: "12:00",
    end: "13:00",
    startDate: "2026-10-22",
    endDate: "2026-10-22",
    startTime: "12:00",
    endTime: "13:00",
    location: "Hope Foundation",
    attendees: 63,
    status: "Cancelled",
    color: "#2D55D7",
    tenant: "NGO",
    role: "",
    audience: "NGO",
    audienceDetails: "Tenant: NGO",
    audienceIds: ["NGO"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880019,
    title: "Research Review",
    eventTitle: "Research Review",
    eventSubtitle: "Demo event 19",
    subtitle: "Demo event 19",
    date: "Oct 23, 2026",
    day: 23,
    month: 9,
    year: 2026,
    start: "13:00",
    end: "14:00",
    startDate: "2026-10-23",
    endDate: "2026-10-23",
    startTime: "13:00",
    endTime: "14:00",
    location: "North Valley University",
    attendees: 72,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880020,
    title: "Cloud Fundamentals",
    eventTitle: "Cloud Fundamentals",
    eventSubtitle: "Demo event 20",
    subtitle: "Demo event 20",
    date: "Oct 24, 2026",
    day: 24,
    month: 9,
    year: 2026,
    start: "14:00",
    end: "15:00",
    startDate: "2026-10-24",
    endDate: "2026-10-24",
    startTime: "14:00",
    endTime: "15:00",
    location: "NextStep Skill Academy",
    attendees: 81,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "Faculty",
    audience: "Skill Academy::NextStep Skill Academy::Faculty",
    audienceDetails: "Skill Academy · NextStep Skill Academy · Faculty",
    audienceIds: ["Skill Academy::NextStep Skill Academy::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880021,
    title: "Sprint Planning",
    eventTitle: "Sprint Planning",
    eventSubtitle: "Demo event 21",
    subtitle: "Demo event 21",
    date: "Oct 25, 2026",
    day: 25,
    month: 9,
    year: 2026,
    start: "15:00",
    end: "16:00",
    startDate: "2026-10-25",
    endDate: "2026-10-25",
    startTime: "15:00",
    endTime: "16:00",
    location: "CodeSprint Bootcamp",
    attendees: 90,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-10-25T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880022,
    title: "Cybersecurity Awareness",
    eventTitle: "Cybersecurity Awareness",
    eventSubtitle: "Demo event 22",
    subtitle: "Demo event 22",
    date: "Oct 26, 2026",
    day: 26,
    month: 9,
    year: 2026,
    start: "09:00",
    end: "10:00",
    startDate: "2026-10-26",
    endDate: "2026-10-26",
    startTime: "09:00",
    endTime: "10:00",
    location: "Apex Global Pvt Ltd",
    attendees: 99,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "",
    audience: "Corporate",
    audienceDetails: "Tenant: Corporate",
    audienceIds: ["Corporate"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880023,
    title: "Public Service Workshop",
    eventTitle: "Public Service Workshop",
    eventSubtitle: "Demo event 23",
    subtitle: "Demo event 23",
    date: "Oct 27, 2026",
    day: 27,
    month: 9,
    year: 2026,
    start: "10:00",
    end: "11:00",
    startDate: "2026-10-27",
    endDate: "2026-10-27",
    startTime: "10:00",
    endTime: "11:00",
    location: "Department of Digital Services",
    attendees: 108,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880024,
    title: "Safeguarding Training",
    eventTitle: "Safeguarding Training",
    eventSubtitle: "Demo event 24",
    subtitle: "Demo event 24",
    date: "Oct 28, 2026",
    day: 28,
    month: 9,
    year: 2026,
    start: "11:00",
    end: "12:00",
    startDate: "2026-10-28",
    endDate: "2026-10-28",
    startTime: "11:00",
    endTime: "12:00",
    location: "Hope Foundation",
    attendees: 117,
    status: "Cancelled",
    color: "#2D55D7",
    tenant: "NGO",
    role: "Faculty",
    audience: "NGO::Hope Foundation::Faculty",
    audienceDetails: "NGO · Hope Foundation · Faculty",
    audienceIds: ["NGO::Hope Foundation::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880025,
    title: "Placement Training",
    eventTitle: "Placement Training",
    eventSubtitle: "Demo event 25",
    subtitle: "Demo event 25",
    date: "Oct 29, 2026",
    day: 29,
    month: 9,
    year: 2026,
    start: "12:00",
    end: "13:00",
    startDate: "2026-10-29",
    endDate: "2026-10-29",
    startTime: "12:00",
    endTime: "13:00",
    location: "North Valley University",
    attendees: 126,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880026,
    title: "Assessment Preparation",
    eventTitle: "Assessment Preparation",
    eventSubtitle: "Demo event 26",
    subtitle: "Demo event 26",
    date: "Oct 30, 2026",
    day: 30,
    month: 9,
    year: 2026,
    start: "13:00",
    end: "14:00",
    startDate: "2026-10-30",
    endDate: "2026-10-30",
    startTime: "13:00",
    endTime: "14:00",
    location: "NextStep Skill Academy",
    attendees: 135,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "",
    audience: "Skill Academy",
    audienceDetails: "Tenant: Skill Academy",
    audienceIds: ["Skill Academy"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880027,
    title: "Project Demo",
    eventTitle: "Project Demo",
    eventSubtitle: "Demo event 27",
    subtitle: "Demo event 27",
    date: "Oct 31, 2026",
    day: 31,
    month: 9,
    year: 2026,
    start: "14:00",
    end: "15:00",
    startDate: "2026-10-31",
    endDate: "2026-10-31",
    startTime: "14:00",
    endTime: "15:00",
    location: "CodeSprint Bootcamp",
    attendees: 144,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-10-31T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880028,
    title: "Manager Development",
    eventTitle: "Manager Development",
    eventSubtitle: "Demo event 28",
    subtitle: "Demo event 28",
    date: "Nov 1, 2026",
    day: 1,
    month: 10,
    year: 2026,
    start: "15:00",
    end: "16:00",
    startDate: "2026-11-01",
    endDate: "2026-11-01",
    startTime: "15:00",
    endTime: "16:00",
    location: "Apex Global Pvt Ltd",
    attendees: 33,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "Faculty",
    audience: "Corporate::Apex Global Pvt Ltd::Faculty",
    audienceDetails: "Corporate · Apex Global Pvt Ltd · Faculty",
    audienceIds: ["Corporate::Apex Global Pvt Ltd::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880029,
    title: "Policy Update Session",
    eventTitle: "Policy Update Session",
    eventSubtitle: "Demo event 29",
    subtitle: "Demo event 29",
    date: "Nov 2, 2026",
    day: 2,
    month: 10,
    year: 2026,
    start: "09:00",
    end: "10:00",
    startDate: "2026-11-02",
    endDate: "2026-11-02",
    startTime: "09:00",
    endTime: "10:00",
    location: "Department of Digital Services",
    attendees: 42,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880030,
    title: "Fundraising Review",
    eventTitle: "Fundraising Review",
    eventSubtitle: "Demo event 30",
    subtitle: "Demo event 30",
    date: "Nov 3, 2026",
    day: 3,
    month: 10,
    year: 2026,
    start: "10:00",
    end: "11:00",
    startDate: "2026-11-03",
    endDate: "2026-11-03",
    startTime: "10:00",
    endTime: "11:00",
    location: "Hope Foundation",
    attendees: 51,
    status: "Cancelled",
    color: "#2D55D7",
    tenant: "NGO",
    role: "",
    audience: "NGO",
    audienceDetails: "Tenant: NGO",
    audienceIds: ["NGO"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880031,
    title: "Semester Planning",
    eventTitle: "Semester Planning",
    eventSubtitle: "Demo event 31",
    subtitle: "Demo event 31",
    date: "Nov 4, 2026",
    day: 4,
    month: 10,
    year: 2026,
    start: "11:00",
    end: "12:00",
    startDate: "2026-11-04",
    endDate: "2026-11-04",
    startTime: "11:00",
    endTime: "12:00",
    location: "North Valley University",
    attendees: 60,
    status: "Published",
    color: "#2D55D7",
    tenant: "University & College",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880032,
    title: "Certification Guidance",
    eventTitle: "Certification Guidance",
    eventSubtitle: "Demo event 32",
    subtitle: "Demo event 32",
    date: "Nov 5, 2026",
    day: 5,
    month: 10,
    year: 2026,
    start: "12:00",
    end: "13:00",
    startDate: "2026-11-05",
    endDate: "2026-11-05",
    startTime: "12:00",
    endTime: "13:00",
    location: "NextStep Skill Academy",
    attendees: 69,
    status: "Saved",
    color: "#2D55D7",
    tenant: "Skill Academy",
    role: "Faculty",
    audience: "Skill Academy::NextStep Skill Academy::Faculty",
    audienceDetails: "Skill Academy · NextStep Skill Academy · Faculty",
    audienceIds: ["Skill Academy::NextStep Skill Academy::Faculty"],
    audienceTypes: ["TARGET"],
    priority: "Critical",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880033,
    title: "Portfolio Review",
    eventTitle: "Portfolio Review",
    eventSubtitle: "Demo event 33",
    subtitle: "Demo event 33",
    date: "Nov 6, 2026",
    day: 6,
    month: 10,
    year: 2026,
    start: "13:00",
    end: "14:00",
    startDate: "2026-11-06",
    endDate: "2026-11-06",
    startTime: "13:00",
    endTime: "14:00",
    location: "CodeSprint Bootcamp",
    attendees: 78,
    status: "Scheduled",
    color: "#2D55D7",
    tenant: "Bootcamp",
    role: "",
    audience: "",
    audienceDetails: "All",
    audienceIds: [],
    audienceTypes: [],
    priority: "Low",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: "2026-11-06T18:00:00.000Z",
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880034,
    title: "Town Hall Learning Session",
    eventTitle: "Town Hall Learning Session",
    eventSubtitle: "Demo event 34",
    subtitle: "Demo event 34",
    date: "Nov 7, 2026",
    day: 7,
    month: 10,
    year: 2026,
    start: "14:00",
    end: "15:00",
    startDate: "2026-11-07",
    endDate: "2026-11-07",
    startTime: "14:00",
    endTime: "15:00",
    location: "Apex Global Pvt Ltd",
    attendees: 87,
    status: "Paused",
    color: "#2D55D7",
    tenant: "Corporate",
    role: "",
    audience: "Corporate",
    audienceDetails: "Tenant: Corporate",
    audienceIds: ["Corporate"],
    audienceTypes: ["TENANT"],
    priority: "Medium",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  },
  {
    id: 880035,
    title: "Department Review",
    eventTitle: "Department Review",
    eventSubtitle: "Demo event 35",
    subtitle: "Demo event 35",
    date: "Nov 8, 2026",
    day: 8,
    month: 10,
    year: 2026,
    start: "15:00",
    end: "16:00",
    startDate: "2026-11-08",
    endDate: "2026-11-08",
    startTime: "15:00",
    endTime: "16:00",
    location: "Department of Digital Services",
    attendees: 96,
    status: "Closed",
    color: "#2D55D7",
    tenant: "Government",
    role: "Faculty",
    audience: "Faculty",
    audienceDetails: "Actor: Faculty",
    audienceIds: ["Faculty"],
    audienceTypes: ["ROLE"],
    priority: "High",
    description: "Dummy event for testing Calendar Management filters, statuses, cards and actions.",
    scheduledPublishAt: undefined,
    localOwner: "SUPER_ADMIN::",
  }
];

const tenants = ["All Tenants", "University & College", "Skill Academy", "Bootcamp", "Corporate", "Government", "NGO"];
const roles = ["All Roles", "Platform Admin", "Institute Admin", "Coordinator", "Faculty", "Student"];
const statuses = ["All Status", "Published", "Saved", "Scheduled", "Paused", "Closed", "Cancelled"];

  
                                                                           
                                                      
   
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
  className?: string;
  searchable?: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
};

function FilterDropdown({
  label,
  value,
  options,
  open,
  className = "",
  searchable = false,
  onToggle,
  onSelect,
}: FilterDropdownProps) {
  const [optionSearch, setOptionSearch] = useState("");

  useEffect(() => {
    if (!open) setOptionSearch("");
  }, [open]);

  const displayedOptions = searchable
    ? options.filter((option) =>
        option.toLowerCase().includes(optionSearch.trim().toLowerCase())
      )
    : options;

  // Searchable year lists keep the search field outside the scrolling options.
  // All other filter dropdowns retain their original option markup and layout.
  const menuOptions = (
    <>
      {displayedOptions.length === 0 && (
        <p className="filterDropdownSearchEmpty">No matching years</p>
      )}
      {displayedOptions.map((option) => {
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
    </>
  );

  return (
    <div className={`filterDropdown ${className} ${open ? "open" : ""}`}>
      <button
        type="button"
        className="filterDropdownField"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="filterDropdownText">
          <span className="filterDropdownLabel">{label}</span>
          <span className="filterDropdownValue">
            {(className.includes("monthFilterDropdown") || className.includes("yearFilterDropdown"))
              ? value
              : value.startsWith("All ")
                ? label
                : value}
          </span>
        </span>
        <span className="filterDropdownChevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="filterDropdownMenu" role="listbox" aria-label={label}>
          {searchable && (
            <div className="filterDropdownSearchWrap">
              <input
                type="search"
                className="filterDropdownSearchInput"
                aria-label={`Search ${label.toLowerCase()} options`}
                placeholder="Search years..."
                value={optionSearch}
                onChange={(event) => setOptionSearch(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
          )}
          {searchable ? (
            <div className="filterDropdownOptionsScroll" aria-label="Year options">
              {menuOptions}
            </div>
          ) : (
            menuOptions
          )}
        </div>
      )}
    </div>
  );
}


type AllUsersFilterMode =
  | "All Audiences"
  | "Tenant Only"
  | "Actor Only"
  | "Specific Tenant";


const calendarMonthFilterOptions = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCalendarFilterYears(events: CalendarEvent[]) {
  const eventYears = events
    .map((event) => Number(event.year))
    .filter((year) => Number.isInteger(year) && year >= 1 && year <= 9999);

  const startYear = Math.min(2016, ...eventYears);
  const endYear = Math.max(new Date().getFullYear(), 2016, ...eventYears);

  return [
    "All Years",
    ...Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => String(startYear + index)
    ),
  ];
}

type AllUsersFilterDropdownProps = {
  value: AllUsersFilterMode;
  touched: boolean;
  tenant: string;
  organization: string;
  tenantOptions: string[];
  organizationOptions: string[];
  open: boolean;
  level: "modes" | "tenants" | "organizations";
  onToggle: () => void;
  onLevelChange: (level: "modes" | "tenants" | "organizations") => void;
  onModeSelect: (value: AllUsersFilterMode) => void;
  onTenantSelect: (value: string) => void;
  onOrganizationSelect: (value: string) => void;
};

function AllUsersFilterDropdown({
  value,
  touched,
  tenant,
  organization,
  tenantOptions,
  organizationOptions,
  open,
  level,
  onToggle,
  onLevelChange,
  onModeSelect,
  onTenantSelect,
  onOrganizationSelect,
}: AllUsersFilterDropdownProps) {
  const [organizationSearch, setOrganizationSearch] = useState("");

  const displayValue = !touched
    ? "All Users"
    : value === "All Audiences"
      ? "Default"
      : value === "Tenant Only"
        ? "Tenant"
        : value === "Actor Only"
          ? "Actor"
          : value === "Specific Tenant" && organization !== "All Organizations"
            ? organization
            : value === "Specific Tenant" && tenant !== "All Tenants"
              ? tenant
              : value;

  const headerDisplayValue =
    level === "tenants"
      ? "Specific Tenant"
      : displayValue;

  const modeOptions: Array<{
    label: string;
    value: AllUsersFilterMode;
  }> = [
    { label: "Default", value: "All Audiences" },
    { label: "Tenant", value: "Tenant Only" },
    { label: "Actor", value: "Actor Only" },
    { label: "Specific Tenant", value: "Specific Tenant" },
  ];

  return (
    <div
      className={`filterDropdown audienceFilterDropdown allUsersNestedDropdown ${
        open ? "open" : ""
      }`}
    >
      {(level === "tenants" || level === "organizations") && open && (
        <button
          type="button"
          className="allUsersHeaderBackButton"
          aria-label={
            level === "organizations"
              ? `Back to ${tenant}`
              : "Back to Specific Tenant"
          }
          onClick={(event) => {
            event.stopPropagation();
            setOrganizationSearch("");

            if (level === "organizations") {
              onLevelChange("tenants");
            } else {
              onLevelChange("modes");
            }
          }}
        >
          <Icon src={icons.chevronLeft} size={16} />
        </button>
      )}

      <button
        type="button"
        className={`filterDropdownField ${
          (level === "tenants" || level === "organizations") && open
            ? "withBackArrow"
            : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="filterDropdownText">
          <span className="filterDropdownLabel">All Users</span>
          <span className="filterDropdownValue">{headerDisplayValue}</span>
        </span>
        <span className="filterDropdownChevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="filterDropdownMenu allUsersNestedMenu"
          role="listbox"
          aria-label="All Users"
        >
          {level === "modes" &&
            modeOptions.map((option) => {
              const selected = touched && option.value === value;

              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`filterDropdownOption ${
                    selected ? "selected" : ""
                  }`}
                  key={option.value}
                  onClick={() => {
                    if (option.value === "Specific Tenant") {
                      onModeSelect("Specific Tenant");
                      onLevelChange("tenants");
                      return;
                    }

                    onModeSelect(option.value);
                  }}
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
                  <span className="allUsersOptionLabel">{option.label}</span>
                </button>
              );
            })}

          {level === "tenants" && (
            <>
              {tenantOptions
                .filter((option) => option !== "All Tenants")
                .map((option) => {
                  const selected = option === tenant;

                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`filterDropdownOption ${
                        selected ? "selected" : ""
                      }`}
                      key={option}
                      onClick={() => {
                        setOrganizationSearch("");
                        onTenantSelect(option);
                        onLevelChange("organizations");
                      }}
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
                      <span className="allUsersOptionLabel">{option}</span>
                    </button>
                  );
                })}
            </>
          )}

          {level === "organizations" && (
            <>
              <div className="allUsersOrganizationSearchWrap">
                <input
                  type="search"
                  value={organizationSearch}
                  onChange={(event) =>
                    setOrganizationSearch(event.target.value)
                  }
                  placeholder={`Search ${tenant}`}
                  aria-label={`Search ${tenant}`}
                />
              </div>

              {organizationOptions
                .filter((option) => option !== "All Organizations")
                .filter((option) =>
                  option
                    .toLowerCase()
                    .includes(organizationSearch.trim().toLowerCase())
                )
                .map((option) => {
                  const selected = option === organization;

                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`filterDropdownOption ${
                        selected ? "selected" : ""
                      }`}
                      key={option}
                      onClick={() => onOrganizationSelect(option)}
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
            </>
          )}
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
          role="radiogroup"
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
                  type="radio"
                  name={label === "Division" ? "calendar-division-filter" : "calendar-department-filter"}
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

// Calendar dates are compared in the user's local timezone, not UTC.
// The key is sortable, so past dates work across months and years.
function calendarLocalDayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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

function isCalendarEventOnDate(event: CalendarEvent, date: Date) {
  const { start, end } = getCalendarEventDateRange(event);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return day >= start.getTime() && day <= end.getTime();
}

function getDynamicCalendarAnchorDate(events: CalendarEvent[]) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const validEventDates = events
    .map((event) => {
      const date = new Date(event.year, event.month, event.day);

      return Number.isNaN(date.getTime())
        ? null
        : {
            date,
            time: date.getTime(),
          };
    })
    .filter(
      (
        item
      ): item is {
        date: Date;
        time: number;
      } => Boolean(item)
    )
    .sort((a, b) => a.time - b.time);

  if (!validEventDates.length) {
    return today;
  }

  const nextOrCurrentEvent =
    validEventDates.find((item) => item.time >= todayStart) ||
    validEventDates[validEventDates.length - 1];

  return new Date(nextOrCurrentEvent.date);
}

export default function CalendarManagementPage() {
  const router = useRouter();
  const [login, setLogin] = useState<CalendarLogin | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [view, setView] = useState<CalendarView>("month");
  const [todayLocalDayKey, setTodayLocalDayKey] = useState(() =>
    calendarLocalDayKey(new Date())
  );

  // Recheck the real local date when the page is opened or stays open at midnight.
  // This is dynamic for every day, month, year and tenant (never hard-coded).
  useEffect(() => {
    const refreshToday = () => {
      const nextKey = calendarLocalDayKey(new Date());
      setTodayLocalDayKey((previous) => previous === nextKey ? previous : nextKey);
    };

    refreshToday();
    const intervalId = window.setInterval(refreshToday, 30000);
    window.addEventListener("focus", refreshToday);
    document.addEventListener("visibilitychange", refreshToday);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshToday);
      document.removeEventListener("visibilitychange", refreshToday);
    };
  }, []);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState<
    "month" | "year" | null
  >(null);
  const [calendarYearRangeStart, setCalendarYearRangeStart] = useState(() => {
    const anchorYear = getDynamicCalendarAnchorDate(initialEvents).getFullYear();
    return anchorYear - 5;
  });
  type AudienceFilterType =
    | "All Audiences"
    | "Tenant Only"
    | "Actor Only"
    | "Tenant + Actor"
    | "Specific Tenant"
    | "Specific Actor"
    | "Specific Organization + Actor";

  const audienceFilterOptions: AudienceFilterType[] = [
    "All Audiences",
    "Tenant Only",
    "Actor Only",
    "Tenant + Actor",
    "Specific Tenant",
    "Specific Actor",
    "Specific Organization + Actor",
  ];

  const [audienceFilter, setAudienceFilter] =
    useState<AudienceFilterType>("All Audiences");
  const [allUsersFilterLevel, setAllUsersFilterLevel] = useState<
    "modes" | "tenants" | "organizations"
  >("modes");
  const [allUsersFilterTouched, setAllUsersFilterTouched] = useState(false);
  const [tenant, setTenant] = useState("All Tenants");
  const [role, setRole] = useState("All Roles");
  const [organization, setOrganization] = useState("All Organizations");
  const [status, setStatus] = useState("All Status");
  const [department, setDepartment] = useState("All Departments");
  const [selectedDepartmentDivision, setSelectedDepartmentDivision] = useState("");
  const [openFilter, setOpenFilter] = useState<
    | "audience"
    | "tenant"
    | "organization"
    | "division"
    | "department"
    | "role"
    | "status"
    | "listMonth"
    | "listYear"
    | null
  >(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"All" | EventStatus | "My Events">("All");
  const [contentView, setContentView] = useState<
    "Calendar" | "All" | "Published" | "Saved" | "My Events" | "My Schedules"
  >("Calendar");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [listMonthFilter, setListMonthFilter] = useState("All Months");
  const [listMonthFilterTouched, setListMonthFilterTouched] = useState(false);
  const [listYearFilter, setListYearFilter] = useState("All Years");
  const [listYearFilterTouched, setListYearFilterTouched] = useState(false);

  // Close the Year filter when the user scrolls or interacts elsewhere.
  // Scrolling within the Year options themselves must remain possible.
  useEffect(() => {
    if (openFilter !== "listYear") return;

    const insideYearMenu = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest(".calendarPage .yearFilterDropdown.open .filterDropdownMenu"));

    const insideYearDropdown = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest(".calendarPage .yearFilterDropdown.open"));

    const closeOnOutsideScroll = (event: Event) => {
      if (!insideYearMenu(event.target)) setOpenFilter(null);
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!insideYearDropdown(event.target)) setOpenFilter(null);
    };

    const closeOnOutsideFocus = (event: FocusEvent) => {
      if (!insideYearDropdown(event.target)) setOpenFilter(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilter(null);
    };

    document.addEventListener("scroll", closeOnOutsideScroll, true);
    window.addEventListener("wheel", closeOnOutsideScroll, { capture: true, passive: true });
    window.addEventListener("touchmove", closeOnOutsideScroll, { capture: true, passive: true });
    window.addEventListener("resize", closeOnOutsideScroll);
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("focusin", closeOnOutsideFocus, true);
    document.addEventListener("keydown", closeOnEscape, true);

    return () => {
      document.removeEventListener("scroll", closeOnOutsideScroll, true);
      window.removeEventListener("wheel", closeOnOutsideScroll, true);
      window.removeEventListener("touchmove", closeOnOutsideScroll, true);
      window.removeEventListener("resize", closeOnOutsideScroll);
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      document.removeEventListener("focusin", closeOnOutsideFocus, true);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [openFilter]);
                                                                             
                                                                                      
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openMenuSource, setOpenMenuSource] = useState<"calendar" | "schedule" | null>(null);
  const [mobileEventIndex, setMobileEventIndex] = useState(0);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const mobileEventTouchStartX = useRef<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{
    kind: "error" | "success" | "info";
    title: string;
    messages: string[];
  } | null>(null);

  const [addMenuOpen, setAddMenuOpen] = useState<"desktop" | "mobile" | null>(
    null
  );
  const desktopAddButtonRef = useRef<HTMLButtonElement>(null);
  const mobileAddButtonRef = useRef<HTMLButtonElement>(null);
  const [addMenuPosition, setAddMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [studentResourcesOpen, setStudentResourcesOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState("");
  const [exportYear, setExportYear] = useState(() =>
    String(getDynamicCalendarAnchorDate(initialEvents).getFullYear())
  );
  const [exportDropdown, setExportDropdown] = useState<"month" | "year" | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // A selected date becomes unavailable when midnight turns it into a past day.
  useEffect(() => {
    if (selectedDay === null) return;
    const chosenKey = calendarLocalDayKey(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
    );
    if (chosenKey < todayLocalDayKey) setSelectedDay(null);
  }, [selectedDay, currentDate, todayLocalDayKey]);
  const [scheduleDate, setScheduleDate] = useState(() => new Date());
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [dayDate, setDayDate] = useState(() => new Date());
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const [dayPopup, setDayPopup] = useState<{ dateKey: string; event: CalendarEvent } | null>(null);
  const [dayEventList, setDayEventList] = useState<{ dateKey: string; events: CalendarEvent[] } | null>(null);
  const [reminderEvent, setReminderEvent] = useState<CalendarEvent | null>(null);
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderSentEvent, setReminderSentEvent] = useState<CalendarEvent | null>(null);
  const [cancelEvent, setCancelEvent] = useState<CalendarEvent | null>(null);
  const [cancelReason, setCancelReason] = useState("");

                              
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
  const bulkUploadInProgressRef = useRef(false);

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
        setContentView("Calendar");
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

  const isEventCreatedBySignedInUser = (event: CalendarEvent) => {
    const normalizedCreatedBy = (event.createdBy || "")
      .trim()
      .toUpperCase();

    const localOwner = login?.role
      ? `${login.role}::${login.tenantType || ""}`
      : "";

    if (localOwner && event.localOwner === localOwner) {
      return true;
    }

    if (!normalizedCreatedBy || !login?.role) {
      return false;
    }

    if (login.role === "SUPER_ADMIN") {
      return normalizedCreatedBy === "CALENDAR-SUPER_ADMIN";
    }

    if (login.role === "PLATFORM_ADMIN") {
      return normalizedCreatedBy === "CALENDAR-PLATFORM_ADMIN";
    }

    const tenantTypeFromDisplay: Record<string, string> = {
      "University & College": "UNIVERSITY_COLLEGE",
      "Skill Academy": "SKILL_ACADEMY",
      Bootcamp: "BOOTCAMP",
      Corporate: "CORPORATE",
      Government: "GOVERNMENT",
      NGO: "NGO",
    };

    const currentTenantType = (
      login.tenantType ||
      tenantTypeFromDisplay[login.displayTenant || ""] ||
      ""
    )
      .trim()
      .toUpperCase();

    const exactSignedInUserId = currentTenantType
      ? `CALENDAR-${login.role}-${currentTenantType}`
      : `CALENDAR-${login.role}`;

    return normalizedCreatedBy === exactSignedInUserId;
  };

  const isReceivedPublishedCard = (event: CalendarEvent) =>
    event.status === "Published" &&
    Boolean(event.createdBy) &&
    !isEventCreatedBySignedInUser(event);

  const getReceivedEventDisplayStatus = (
    event: CalendarEvent
  ): EventStatus => {
    if (!isReceivedPublishedCard(event)) {
      return event.status;
    }

    const endDateValue = (event.endDate || "").trim();
    const endTimeValue = (event.endTime || event.end || "").trim();

    if (!endDateValue) {
      return "Published";
    }

    const normalizedEndTime =
      /^\d{2}:\d{2}:\d{2}$/.test(endTimeValue)
        ? endTimeValue
        : /^\d{2}:\d{2}$/.test(endTimeValue)
          ? `${endTimeValue}:00`
          : "23:59:59";

    const endDateTime = new Date(
      `${endDateValue}T${normalizedEndTime}`
    );

    if (
      !Number.isNaN(endDateTime.getTime()) &&
      endDateTime.getTime() <= Date.now()
    ) {
      return "Closed";
    }

    return "Published";
  };

  const showTenantFilter =
    login?.role === "SUPER_ADMIN" ||
    login?.role === "PLATFORM_ADMIN";

  const showPublishAudienceFilters =
    login?.role === "SUPER_ADMIN" ||
    login?.role === "PLATFORM_ADMIN";

                                                                       
                                                                            
  const activeFilterTenant =
    isTenantScopedRole || isStudentView
      ? signedInTenant
      : tenant;

  const currentTenantFilterData =
    tenantFilterData[activeFilterTenant] ||
    tenantFilterData["All Tenants"];

    
                                                                           
                                                      
    
                                                                  
                                                                     
    
                                                                       
                                
     
  const calendarActorLabelsByTenant: Record<
    string,
    Record<string, string>
  > = {
    "University & College": {
      "Institute Admin": "Institute Admin",
      Coordinator: "Coordinator",
      Faculty: "Faculty",
      Student: "Student",
    },
    "Skill Academy": {
      "Institute Admin": "Academy Admin",
      Coordinator: "Program Coordinator",
      Faculty: "Trainer",
      Student: "Learner",
    },
    Bootcamp: {
      "Institute Admin": "Bootcamp Admin",
      Coordinator: "Cohort Coordinator",
      Faculty: "Instructor",
      Student: "Learner",
    },
    Corporate: {
      "Institute Admin": "Corporate Admin",
      Coordinator: "L&D Coordinator",
      Faculty: "Trainer",
      Student: "Employee",
    },
    Government: {
      "Institute Admin": "Department Admin",
      Coordinator: "Program Coordinator",
      Faculty: "Trainer",
      Student: "Employee",
    },
    NGO: {
      "Institute Admin": "NGO Admin",
      Coordinator: "Program Coordinator",
      Faculty: "Trainer",
      Student: "Volunteer / Learner",
    },
  };

  const availableRoleOptions = (() => {
    const tenantRoles = currentTenantFilterData.roles;

    const allowOnly = (allowedRoles: string[]) => [
      "All Roles",
      ...tenantRoles.filter((item) => allowedRoles.includes(item)),
    ];

      
                                    
                                                                            
                              
       
    if (
      login?.role === "SUPER_ADMIN" ||
      login?.role === "PLATFORM_ADMIN"
    ) {
      const allowedCanonicalRoles =
        login.role === "SUPER_ADMIN"
          ? [
              "Platform Admin",
              "Institute Admin",
              "Coordinator",
              "Faculty",
              "Student",
            ]
          : [
              "Institute Admin",
              "Coordinator",
              "Faculty",
              "Student",
            ];

        
                                                                             
                                                                
         
      if (activeFilterTenant === "All Tenants") {
        return [
          "All Roles",
          ...tenantRoles.filter((item) =>
            allowedCanonicalRoles.includes(item)
          ),
        ];
      }

      const tenantActorLabels =
        calendarActorLabelsByTenant[activeFilterTenant] || {};

      return [
        "All Roles",
        ...tenantRoles
          .filter(
            (item) =>
              item !== "Platform Admin" &&
              allowedCanonicalRoles.includes(item)
          )
          .map((item) => tenantActorLabels[item] || item),
      ];
    }

      
                                                             
                                                                     
      
               
                                                                      
                                                                  
       
    const tenantActorLabels =
      calendarActorLabelsByTenant[activeFilterTenant] || {};

    const mapTenantActorOptions = (allowedRoles: string[]) => [
      "All Roles",
      ...tenantRoles
        .filter((item) => allowedRoles.includes(item))
        .map((item) => tenantActorLabels[item] || item),
    ];

    switch (login?.role) {
      case "TENANT_ADMIN":
        return mapTenantActorOptions([
          "Coordinator",
          "Faculty",
          "Student",
        ]);

      case "COORDINATOR":
        return mapTenantActorOptions([
          "Faculty",
          "Student",
        ]);

      case "FACULTY":
        return mapTenantActorOptions([
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

  const availableOrganizationOptions = useMemo(() => {
    const normalizeTenantForOrganization = (value: string) =>
      formatAudienceTenantLabel(value);

    const selectedTenant =
      tenant === "All Tenants" ? "" : tenant;

    const organizations = new Set<string>();

                                                                          
    if (selectedTenant) {
      (publishOrganizationsByTenant[selectedTenant] || []).forEach(
        (organizationName) => organizations.add(organizationName)
      );
    } else {
      Object.values(publishOrganizationsByTenant).forEach((items) => {
        items.forEach((organizationName) =>
          organizations.add(organizationName)
        );
      });
    }

                                                                          
    events.forEach((event) => {
      const ids =
        event.audienceIds?.length
          ? event.audienceIds
          : (event.audience || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      ids.forEach((audienceId) => {
        const parts = audienceId
          .split("::")
          .map((part) => part.trim())
          .filter(Boolean);

        if (parts.length < 3) return;

        const tenantLabel = normalizeTenantForOrganization(parts[0] || "");
        const organizationName = parts.slice(1, -1).join(" · ");

        if (
          organizationName &&
          (!selectedTenant || tenantLabel === selectedTenant)
        ) {
          organizations.add(organizationName);
        }
      });
    });

    return ["All Organizations", ...Array.from(organizations).sort()];
  }, [events, tenant]);

  const showAudienceTenantFilter =
    audienceFilter === "All Audiences" ||
    audienceFilter === "Tenant + Actor" ||
    audienceFilter === "Specific Tenant" ||
    audienceFilter === "Specific Organization + Actor";

  const showAudienceRoleFilter =
    audienceFilter === "All Audiences" ||
    audienceFilter === "Tenant + Actor" ||
    audienceFilter === "Specific Actor" ||
    audienceFilter === "Specific Organization + Actor";

  const showAudienceOrganizationFilter =
    audienceFilter === "Specific Organization + Actor";

                                                                     
                                                                         
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

  const refreshCalendarAccessToken = async () => {
    const storedLogin = window.localStorage.getItem("calendar_dummy_login");

    if (!storedLogin) {
      window.localStorage.removeItem("calendar_access_token");
      return null;
    }

    try {
      const parsedLogin = JSON.parse(storedLogin) as CalendarLogin;

      if (!parsedLogin.role) {
        window.localStorage.removeItem("calendar_access_token");
        return null;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const requestBody: {
        role: string;
        tenantType?: string;
      } = {
        role: parsedLogin.role,
      };

      if (
        parsedLogin.role !== "SUPER_ADMIN" &&
        parsedLogin.role !== "PLATFORM_ADMIN" &&
        parsedLogin.tenantType
      ) {
        requestBody.tenantType = parsedLogin.tenantType;
      }

      const response = await fetch(`${apiUrl}/auth/calendar-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        window.localStorage.removeItem("calendar_access_token");
        return null;
      }

      const authResult = (await response.json()) as {
        accessToken?: string;
      };

      if (!authResult.accessToken) {
        window.localStorage.removeItem("calendar_access_token");
        return null;
      }

      window.localStorage.setItem(
        "calendar_access_token",
        authResult.accessToken
      );

      return authResult.accessToken;
    } catch {
      // Keep the login token through a temporary network outage.
      return null;
    }
  };

  const calendarAuthenticatedFetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ) => {
    const sendRequest = async (token: string) => {
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${token}`);

      try {
        return await fetch(input, {
          ...init,
          headers,
        });
      } catch {
        // The backend may be stopped, unreachable, or blocked by CORS.
        // Do not let background polling produce unhandled TypeErrors.
        return new Response(
          JSON.stringify({
            message: "Calendar API is unreachable. Check NEXT_PUBLIC_API_URL and the backend server.",
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "X-Calendar-Network-Error": "true",
            },
          }
        );
      }
    };

    let token = window.localStorage.getItem("calendar_access_token");

    if (!token) {
      token = await refreshCalendarAccessToken();
    }

    if (!token) {
      return new Response(
        JSON.stringify({
          message: "Unauthorized",
          statusCode: 401,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    let response = await sendRequest(token);

    if (response.status === 401) {
      const refreshedToken = await refreshCalendarAccessToken();

      if (refreshedToken) {
        response = await sendRequest(refreshedToken);
      }
    }

    return response;
  };

  const patchBackendEvent = async (
    event: CalendarEvent,
    data: Record<string, unknown>
  ) => {
    if (!event.backendId) return null;

    const token = window.localStorage.getItem("calendar_access_token");
    if (!token) return null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await calendarAuthenticatedFetch(`${apiUrl}/events/${event.backendId}`, {
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
        response = await calendarAuthenticatedFetch(`${apiUrl}/events/${event.backendId}`, {
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

        response = await calendarAuthenticatedFetch(`${apiUrl}/events/by-details`, {
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

                                                            
  useEffect(() => {
    const storedEvents = window.localStorage.getItem("calendar:events");
    if (!storedEvents) return;

    try {
      const parsed = JSON.parse(storedEvents) as CalendarEvent[];
      if (Array.isArray(parsed)) {
        const demoIds = new Set(initialEvents.map((event) => event.id));
        const storedWithoutDemoDuplicates = parsed.filter(
          (event) => !demoIds.has(event.id)
        );

        setEvents([
          ...initialEvents,
          ...storedWithoutDemoDuplicates,
        ]);
      }
    } catch {
                                                      
    }
  }, []);

                                             
                             
                                          
                                             

  useEffect(() => {
    let backendRetryAfter = 0;
    let requestInProgress = false;
    let isDisposed = false;

    const loadBackendEvents = async () => {
      if (isDisposed || requestInProgress || Date.now() < backendRetryAfter) return;

      const token = window.localStorage.getItem("calendar_access_token");

                                                                                
      if (!token) return;

      requestInProgress = true;
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const response = await calendarAuthenticatedFetch(`${apiUrl}/events`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.headers.get("X-Calendar-Network-Error") === "true") {
          // Offline mode: preserve existing/local events; retry after a short pause.
          backendRetryAfter = Date.now() + 30000;
          return;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(
            "Failed to load backend calendar events:",
            response.status,
            errorText
          );
          return;
        }

        const backendEvents = (await response.json()) as BackendEvent[];

        if (!Array.isArray(backendEvents)) return;

        const mappedEvents = backendEvents.map(
          backendEventToCalendarEvent
        );

          
                                
          
                                                                           
                                                                                 
                                                                             
                                                                            
                                                                  
          
                   
                                                                                 
                                                                           
                                               
                                                                           
                                              
           
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
              publisherName: backendEvent.publisherName || existingEvent.publisherName,
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
        // Only unexpected parsing/programming errors are reported to console.
        // Network errors are handled by calendarAuthenticatedFetch above.
        console.error("Failed to load backend calendar events:", error);
      } finally {
        requestInProgress = false;
      }
    };

    void loadBackendEvents();

                                                                              
                                                                                 
    const handleFocus = () => {
      backendRetryAfter = 0;
      void loadBackendEvents();
    };

    window.addEventListener("focus", handleFocus);

    const refreshTimer = window.setInterval(() => {
      void loadBackendEvents();
    }, 5000);

    return () => {
      isDisposed = true;
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

                                                                     
                                                                      
  useEffect(() => {
    const closeFinishedEvents = () => {
      const now = Date.now();

      setEvents((previousEvents) => {
        let changed = false;

        const nextEvents = previousEvents.map((event) => {
          if (event.status !== "Published") {
            return event;
          }

          const endDateTime = getEventEndDateTime(event);

          if (!endDateTime || endDateTime.getTime() > now) {
            return event;
          }

          changed = true;

                                                     
          void patchBackendEvent(event, { status: "CLOSED" });

          return {
            ...event,
            status: "Closed" as EventStatus,
          };
        });

        if (!changed) {
          return previousEvents;
        }

        window.localStorage.setItem(
          "calendar:events",
          JSON.stringify(nextEvents)
        );

        return nextEvents;
      });
    };

    closeFinishedEvents();

    const closeIntervalId = window.setInterval(
      closeFinishedEvents,
      1000
    );

    return () => window.clearInterval(closeIntervalId);
  }, []);

                                                                   
                                                                        
                                                                  
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
      const sessionValue = window.localStorage.getItem("calendar_dummy_login");
      let savedLocalOwner = parsedEvent.localOwner;
      if (!savedLocalOwner && sessionValue) {
        try {
          const session = JSON.parse(sessionValue) as CalendarLogin;
          if (session.role) savedLocalOwner = `${session.role}::${session.tenantType || ""}`;
        } catch {
          // Keep creator unassigned when session metadata is unavailable.
        }
      }
      const eventWithDepartment: CalendarEvent = {
        ...parsedEvent,
        publisherName: getSignedInCalendarPublisherName() || actualCalendarPublisherName(parsedEvent.publisherName) || undefined,
        localOwner: savedLocalOwner,
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
      const eventDate = new Date(
        eventWithDepartment.year,
        eventWithDepartment.month,
        eventWithDepartment.day
      );

      setScheduleDate(eventDate);
      setWeekDate(eventDate);
      setDayDate(eventDate);
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
        const editedEventDate = new Date(
          result.event.year,
          result.event.month,
          result.event.day
        );

        setScheduleDate(editedEventDate);
        setWeekDate(editedEventDate);
        setDayDate(editedEventDate);
        setSelectedDay(null);
        setScheduleTab("All");
        setStatus("All Status");
      }
    } finally {
      window.localStorage.removeItem("calendar:event-result");
    }
  }, []);

  const calendarMonthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const calendarYearRange = Array.from(
    { length: 12 },
    (_, index) => calendarYearRangeStart + index
  );

  const selectCalendarMonth = (monthIndex: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), monthIndex, 1)
    );
    setSelectedDay(null);
    setCalendarPickerOpen(null);
  };

  const selectCalendarYear = (yearValue: number) => {
    setCurrentDate(
      new Date(yearValue, currentDate.getMonth(), 1)
    );
    setSelectedDay(null);
    setCalendarPickerOpen(null);
  };

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
    const match = value.match(/^(\d{1,2})(?::\d{2})?(?::\d{2})?\s*(am|pm)?$/i);

    if (!match) return -1;

    let hour = Number(match[1]);
    if (hour < 0 || hour > 23) return -1;
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

  const dayTitle = useMemo(
    () => dayDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    [dayDate]
  );

  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "long" });

  const dayEventsForHour = (hour: number) =>
    events.filter(
      (event) => isCalendarEventOnDate(event, dayDate) && getWeekEventHour(event) === hour
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
      if (
        raw.includes("institute admin") ||
        raw.includes("tenant admin") ||
        raw.includes("academy admin") ||
        raw.includes("bootcamp admin") ||
        raw.includes("corporate admin") ||
        raw.includes("department admin") ||
        raw.includes("ngo admin")
      ) {
        return "institute admin";
      }

      if (raw.includes("coordinator")) return "coordinator";

      if (
        raw.includes("faculty") ||
        raw.includes("trainer") ||
        raw.includes("instructor")
      ) {
        return "faculty";
      }

      if (
        raw.includes("student") ||
        raw.includes("learner") ||
        raw.includes("employee") ||
        raw.includes("trainee") ||
        raw.includes("volunteer")
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
      const effectiveStatus = getReceivedEventDisplayStatus(event);
      const statusMatch =
        status === "All Status" || effectiveStatus === status;

      const rawAudienceIds =
        event.audienceIds?.length
          ? event.audienceIds
          : (event.audience || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      const rawAudienceTypes =
        event.audienceTypes?.length
          ? event.audienceTypes.map((item) => item.toUpperCase())
          : [];

      const targetParts = rawAudienceIds
        .filter((item) => item.includes("::"))
        .map((item) =>
          item
            .split("::")
            .map((part) => part.trim())
            .filter(Boolean)
        );

      const allTenantRows =
        rawAudienceTypes.length > 0 &&
        rawAudienceTypes.every((item) => item === "TENANT");

      const allRoleRows =
        rawAudienceTypes.length > 0 &&
        rawAudienceTypes.every((item) => item === "ROLE");

      const allTargetRows =
        rawAudienceTypes.length > 0 &&
        rawAudienceTypes.every((item) => item === "TARGET");

      const isBroadTenantOnly =
        allTenantRows &&
        (event.audienceDetails || "").trim() === "Tenant";

      const isBroadActorOnly =
        allRoleRows &&
        (event.audienceDetails || "").trim() === "Actor";

      const isTenantActorTarget =
        allTargetRows &&
        targetParts.length > 0 &&
        targetParts.every((parts) => parts.length === 2);

      const isOrganizationActorTarget =
        allTargetRows &&
        targetParts.some((parts) => parts.length >= 3);

      const audienceModeMatch =
        !showPublishAudienceFilters ||
        audienceFilter === "All Audiences" ||
        (audienceFilter === "Tenant Only" && isBroadTenantOnly) ||
        (audienceFilter === "Actor Only" && isBroadActorOnly) ||
        (audienceFilter === "Tenant + Actor" && isTenantActorTarget) ||
        (
          audienceFilter === "Specific Tenant" &&
          (
            (allTenantRows && !isBroadTenantOnly) ||
            isOrganizationActorTarget
          )
        ) ||
        (
          audienceFilter === "Specific Actor" &&
          allRoleRows &&
          !isBroadActorOnly
        ) ||
        (
          audienceFilter === "Specific Organization + Actor" &&
          isOrganizationActorTarget
        );

      const selectedOrganizationMatch =
        !showPublishAudienceFilters ||
        organization === "All Organizations" ||
        targetParts.some(
          (parts) =>
            parts.length >= 3 &&
            parts.slice(1, -1).join(" · ") === organization
        );

      const isMySchedulesTab = scheduleTab === "My Events";
      const tabMatch =
        scheduleTab === "All" ||
        isMySchedulesTab ||
        effectiveStatus === scheduleTab;
      const dayMatch = selectedDay === null || event.day === selectedDay;

      const eventDepartment = (event.department || "").trim();
      const departmentMatch =
        department === "All Departments" ||
        eventDepartment === department;

      const normalizedEventTenants = (event.tenant || "")
        .split(",")
        .map((item) => normalizeTenant(item))
        .filter(Boolean);

      const normalizedEventTenant =
        normalizedEventTenants[0] || "";

                                                              
      const tenantMatch =
        normalizedActiveTenant === "ALL TENANTS" ||
        !event.tenant ||
        normalizedEventTenants.includes(normalizedActiveTenant) ||
        normalizedEventTenants.includes("ALL TENANTS");

      const eventRoleSource = event.role || event.audience || "";

      const normalizedEventRoles = [
        ...(event.role || "")
          .split(",")
          .map((item) => normalizeRole(item))
          .filter(Boolean),
        ...rawAudienceIds
          .map((item) => {
            const parts = item
              .split("::")
              .map((part) => part.trim())
              .filter(Boolean);

            return normalizeRole(
              parts.length > 1
                ? parts[parts.length - 1]
                : item
            );
          })
          .filter(Boolean),
      ];

      const normalizedEventRole =
        normalizedEventRoles[0] || normalizeRole(eventRoleSource);

      const exactAssignedTenantMatch =
        !!event.tenant &&
        normalizedEventTenant === normalizeTenant(signedInTenant);

      const exactAssignedRoleMatch =
        !!event.role &&
        !!signedInAudienceRole &&
        normalizedEventRoles.includes(signedInAudienceRole);

                                                                      
                                                                    
                                                                
                                                                     
      const exactTargetPairMatch = (event.audience || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.includes("::"))
        .some((item) => {
          const parts = item
            .split("::")
            .map((part) => part.trim())
            .filter(Boolean);

          const targetTenant = parts[0] || "";
          const targetRole = parts[parts.length - 1] || "";

          return (
            normalizeTenant(targetTenant) === normalizeTenant(signedInTenant) &&
            normalizeRole(targetRole) === signedInAudienceRole
          );
        });

                                                                              
                                                                          
                                                                 
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
                normalizedEventRoles.length === 0 ||
                normalizedEventRoles.includes(selectedRole) ||
                normalizedEventRoles.includes("all")
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

                                                                         
                                                                           
                                                                            
                                         
      const isLocallyManagedEvent = !event.createdBy;

                                                                 
                                                                       
                                                                      
      const receivedScheduleMatch =
        !isMySchedulesTab ||
        (
          event.status === "Published" &&
          !isCreatedBySignedInUser
        );

                   
                                                                               
                                                                 
                                                                               
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

                                                                           
                                                                              
                           
                       
                       
                 
                            
        
                                                                             
                                                                               
                                                                            
      const isReceivedPublishedEvent =
        event.status === "Published" &&
        !isCreatedBySignedInUser &&
        exactReceivedAudienceMatch;

      if (isMySchedulesTab) {
        return (
          !isStudentView &&
          isReceivedPublishedEvent &&
          statusMatch &&
          audienceModeMatch &&
          selectedOrganizationMatch &&
          dayMatch
        );
      }

      if (isReceivedPublishedEvent) {
                                                           
                                                                            
                                                                                
        if (
          scheduleTab === "All" ||
          scheduleTab === "Published" ||
          isMySchedulesTab
        ) {
          return (
            statusMatch &&
            audienceModeMatch &&
            selectedOrganizationMatch &&
            dayMatch
          );
        }

        return false;
      }

                                                                        
                                                           
                                                                            
      if (isCreatedBySignedInUser || isLocallyManagedEvent) {
        return (
          statusMatch &&
          audienceModeMatch &&
          selectedOrganizationMatch &&
          tabMatch &&
          dayMatch &&
          departmentMatch &&
          tenantMatch &&
          roleMatch
        );
      }

      return (
        statusMatch &&
        audienceModeMatch &&
        selectedOrganizationMatch &&
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
    audienceFilter,
    organization,
    scheduleTab,
    selectedDay,
    department,
    isStudentView,
    isTenantScopedRole,
    signedInTenant,
    tenant,
    role,
    signedInAudienceRole,
    showPublishAudienceFilters,
  ]);

  const getCalendarViewAnchorDate = () => {
    // Switching to Week or Day opens the current week or current date.
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const changeCalendarView = (nextView: CalendarView) => {
    if (nextView === "week") {
      setWeekDate(getCalendarViewAnchorDate());
    } else if (nextView === "day") {
      setDayDate(getCalendarViewAnchorDate());
    } else if (view !== "month") {
      const today = new Date();
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
      setSelectedDay(null);
    }

    setView(nextView);
  };

  // The grid begins at midnight; reveal the first scheduled event automatically,
  // while retaining normal scrolling and the correct hour/date columns.
  useEffect(() => {
    if (view !== "week" && view !== "day") return;

    const scroller = view === "week" ? weekScrollRef.current : dayScrollRef.current;
    if (!scroller) return;
    const displayedDates = view === "week" ? weekDays : [dayDate];
    const scheduledHours = events
      .filter(event => displayedDates.some(date => isCalendarEventOnDate(event, date)))
      .map(getWeekEventHour)
      .filter(hour => hour >= 0);

    if (!scheduledHours.length) {
      scroller.scrollTop = 0;
      return;
    }

    const earliestHour = Math.min(...scheduledHours);
    const target = scroller.querySelector<HTMLElement>(
      `[data-calendar-hour="${earliestHour}"]`
    );
    const heading = scroller.querySelector<HTMLElement>(
      view === "week" ? ".weekCalendarHeader" : ".dayCalendarHeader"
    );
    if (target) {
      const targetTop = target.getBoundingClientRect().top;
      const scrollTop = scroller.getBoundingClientRect().top;
      scroller.scrollTop += targetTop - scrollTop - (heading?.offsetHeight || 0) - 4;
    }
  }, [view, weekDays, dayDate, events]);

    
                     
                                                             
                                                            
    
                                                                
                                                             
                                                    
     
  const tenantKpiData = useMemo(() => {
    const tenantNames = tenants.filter((item) => item !== "All Tenants");

    const eventTenantNames = (event: CalendarEvent) => {
      const matchedTenants = new Set<string>();

      const addTenant = (value?: string) => {
        const normalized = formatAudienceTenantLabel(value || "");

        if (tenantNames.includes(normalized)) {
          matchedTenants.add(normalized);
        }
      };

        
                                   
                                                         
                                                           
        
                                                                       
                                             
         
      (event.tenant || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach(addTenant);

      (event.audienceIds || []).forEach((audienceId) => {
        const parts = String(audienceId || "")
          .split("::")
          .map((part) => part.trim())
          .filter(Boolean);

        addTenant(parts[0] || audienceId);
      });

      return Array.from(matchedTenants);
    };

    const items = tenantNames.map((tenantName) => ({
      name: tenantName,
      count: events.reduce(
        (count, event) =>
          count + (eventTenantNames(event).includes(tenantName) ? 1 : 0),
        0
      ),
    }));

    return {
        
                                                                           
                                                                            
         
      total: events.filter((event) => eventTenantNames(event).length > 0).length,
      items,
    };
  }, [events]);

  const listYearOptions = useMemo(
    () => getCalendarFilterYears(events),
    [events]
  );

  useEffect(() => {
    if (
      listYearFilter !== "All Years" &&
      !listYearOptions.includes(listYearFilter)
    ) {
      setListYearFilter("All Years");
      setListYearFilterTouched(false);
    }
  }, [listYearFilter, listYearOptions]);

  const listVisibleEvents = useMemo(() => {
      
                      
      
                                                                  
                                                                             
                                                                               
      
                                                                             
                                                                           
                                                      
       
    if (contentView === "Calendar") {
      return visibleEvents;
    }

    const query = eventSearchQuery.trim().toLowerCase().replace(/\s+/g, " ");

    const searchableDate = (value?: string) => {
      const raw = (value || "").trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      return match
        ? `${raw} ${match[3]}-${match[2]}-${match[1]}`
        : raw;
    };

    return visibleEvents.filter((event) => {
      if (listMonthFilter !== "All Months") {
        const monthIndex =
          calendarMonthFilterOptions.indexOf(listMonthFilter) - 1;

        if (monthIndex >= 0 && event.month !== monthIndex) {
          return false;
        }
      }

      if (
        listYearFilter !== "All Years" &&
        Number(event.year) !== Number(listYearFilter)
      ) {
        return false;
      }

        
                                                                     
                                                                           
         
      if (!query) {
        return true;
      }

      const attachmentName =
        parseStoredAttachment(event.attachment).originalName;

      const searchableText = [
        event.title,
        event.eventTitle,
        event.subtitle,
        event.eventSubtitle,
        event.date,
        searchableDate(event.startDate),
        searchableDate(event.endDate),
        event.start,
        event.end,
        event.startTime,
        event.endTime,
        event.location,
        event.status,
        event.priority,
        event.department,
        event.tenant,
        event.role,
        event.audience,
        event.audienceDetails,
        event.description,
        attachmentName,
        event.createdBy,
        event.publisherName,
        eventCreatorLabel(event.createdBy),
        getCalendarEventPublisherLabel(event),
        ...(event.audienceIds || []),
        ...(event.audienceTypes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, " ");

      return searchableText.includes(query);
    });
  }, [
    visibleEvents,
    eventSearchQuery,
    contentView,
    listMonthFilter,
    listYearFilter,
  ]);

  useEffect(() => {
    setMobileEventIndex((currentIndex) => {
      if (listVisibleEvents.length === 0) return 0;
      return Math.min(currentIndex, listVisibleEvents.length - 1);
    });
    setOpenMenu(null);
  }, [
    listVisibleEvents.length,
    eventSearchQuery,
    contentView,
    scheduleTab,
    status,
    audienceFilter,
    organization,
    selectedDay,
    tenant,
    role,
  ]);

  const moveMonth = (amount: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + amount, 1));
    setSelectedDay(null);
  };

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
    setListMonthFilter("All Months");
    setListMonthFilterTouched(false);
    setListYearFilter("All Years");
    setListYearFilterTouched(false);
    setAudienceFilter("All Audiences");
    setTenant(isTenantScopedRole ? signedInTenant : "All Tenants");
    setRole("All Roles");
    setOrganization("All Organizations");
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

  const confirmCancelPublishedEvent = async () => {
    if (!cancelEvent) return;

    const updatedBackendEvent = cancelEvent.backendId
      ? await patchBackendEvent(cancelEvent, { status: "CANCELLED" })
      : null;

    if (cancelEvent.backendId && !updatedBackendEvent) {
      return;
    }

    setEvents((previousEvents) => {
      const nextEvents = previousEvents.map((item) =>
        item.id === cancelEvent.id
          ? { ...item, status: "Cancelled" as EventStatus }
          : item
      );

      return saveEvents(nextEvents);
    });

    closeCancelEventModal();
  };

  const positionAddDropdown = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuWidth = 190;
    const viewportPadding = 10;
    const menuHeight = 100;

    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      Math.max(
        viewportPadding,
        window.innerWidth - menuWidth - viewportPadding
      )
    );

    const below = rect.bottom + 8;
    const top =
      below + menuHeight > window.innerHeight - viewportPadding &&
      rect.top >= menuHeight + viewportPadding
        ? rect.top - menuHeight - 8
        : below;

    setAddMenuPosition((previous) =>
      previous.top === top && previous.left === left
        ? previous
        : { top, left }
    );
  }, []);

  const openAddDropdown = (
    source: "desktop" | "mobile",
    button: HTMLButtonElement | null
  ) => {
    if (!button) return;

    positionAddDropdown(button);
    setAddMenuOpen((current) => (current === source ? null : source));
  };

  useEffect(() => {
    if (!addMenuOpen) return;

    // The menu is rendered in a portal. Close on the very first scroll
    // (including the calendar's nested scroll container), rather than
    // leaving a fixed-position menu floating over unrelated content.
    const closeOnScroll = () => setAddMenuOpen(null);

    document.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("wheel", closeOnScroll, { capture: true, passive: true });
    window.addEventListener("touchmove", closeOnScroll, { capture: true, passive: true });
    window.addEventListener("resize", closeOnScroll);

    return () => {
      document.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("wheel", closeOnScroll, true);
      window.removeEventListener("touchmove", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [addMenuOpen]);

  const handleAddEvent = () => {
    setAddMenuOpen(null);
    setOpenMenu(null);
    // The global Add button must not reuse a previously clicked calendar date.
    window.localStorage.removeItem("calendar:add-event-date");
    window.localStorage.removeItem("calendar:event-action");
    window.localStorage.removeItem("calendar:selected-event");
    window.localStorage.removeItem("calendar:reuse-event");
    setEventFormOpen(true);
  };

  const handleAddEventForDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (requestedDate.getTime() < today.getTime()) return;

    setOpenMenu(null);
    setDayPopup(null);
    setSelectedDay(date.getDate());
    setScheduleDate(new Date(date));

    window.localStorage.removeItem("calendar:event-action");
    window.localStorage.removeItem("calendar:selected-event");
    window.localStorage.removeItem("calendar:reuse-event");

                                                                          
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

            const response = await calendarAuthenticatedFetch(`${apiUrl}/events/${backendId}`, {
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
          publisherName: getSignedInCalendarPublisherName() || actualCalendarPublisherName(parsedEvent.publisherName) || undefined,
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
        const completedEventDate = new Date(
          eventWithDepartment.year,
          eventWithDepartment.month,
          eventWithDepartment.day
        );

        setScheduleDate(completedEventDate);
        setWeekDate(completedEventDate);
        setDayDate(completedEventDate);
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
                                                                      
      setPublishAudienceOpen(true);
      setPublishFlyout("tenant");
      return;
    }

                                             
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

                                                         
    if (publishActor) {
      addPublishTarget(value, publishActor);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

                                                          
    setPublishAudienceType("Specific Tenant");
    setPublishAudienceOpen(true);
    setPublishFlyout("actor");
  };

  const selectPublishActor = (value: string) => {
    setPublishError("");
    setPublishActor(value);

                                                                 
    if (isGlobalPublishActor(value)) {
      addPublishTarget("All Tenants", value);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

                                                                         
                                                           
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

                                                           
    if (publishTenant) {
      addPublishTarget(publishTenant, value);
      setPublishTenant("");
      setPublishActor("");
      setPublishAudienceOpen(false);
      setPublishFlyout(null);
      return;
    }

                                                                  
                                                       
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
              publisherName: mappedUpdatedEvent.publisherName || event.publisherName,
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

                                                                            
                                              
    const token = window.localStorage.getItem("calendar_access_token");

    if (token) {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const response = await calendarAuthenticatedFetch(`${apiUrl}/events`, {
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

    e.target.value = "";
    setBulkOpen(false);
    setBulkFeedback(null);

    if (!/\.csv$/i.test(file.name)) {
      setBulkFeedback({
        kind: "error",
        title: "Invalid file type",
        messages: ["Only .csv files are supported. Use Download Template to get the correct format."],
      });
      return;
    }

    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      setBulkFeedback({
        kind: "error",
        title: "Invalid CSV file",
        messages: [file.size === 0 ? "The selected file is empty." : "The CSV file must be 10 MB or smaller."],
      });
      return;
    }

    if (bulkUploadInProgressRef.current) {
      setBulkFeedback({
        kind: "info",
        title: "Upload in progress",
        messages: ["Another CSV is being processed. Please choose a file after it finishes."],
      });
      return;
    }

    bulkUploadInProgressRef.current = true;
    setBulkFeedback({
      kind: "info",
      title: "Checking CSV file",
      messages: ["Validating all rows before saving events…"],
    });
    const reader = new FileReader();

    reader.onerror = () => {
      bulkUploadInProgressRef.current = false;
      setBulkFeedback({
        kind: "error",
        title: "Unable to read file",
        messages: ["The CSV could not be read. Please choose the file again."],
      });
    };

    reader.onload = async () => {
      try {
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

          return parsed.getFullYear() === Number(match[1]) &&
            parsed.getMonth() === Number(match[2]) - 1 &&
            parsed.getDate() === Number(match[3])
            ? parsed
            : null;
        }

        match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (match) {
          const parsed = new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
          );

          return parsed.getFullYear() === Number(match[3]) &&
            parsed.getMonth() === Number(match[2]) - 1 &&
            parsed.getDate() === Number(match[1])
            ? parsed
            : null;
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
          .replace(/\s+/g, " ");

        if (!raw) return fallback;

                                                                            
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

                                                
        let match = raw.replace(/\./g, ":").match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
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

                                                              
        match = raw.replace(/\./g, ":").match(
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

      // Preserve commas, line breaks and escaped quotes within quoted CSV cells.
      const parseCsvRows = (content: string): string[][] => {
        const rows: string[][] = [];
        let row: string[] = [];
        let cell = "";
        let insideQuotes = false;

        for (let index = 0; index < content.length; index += 1) {
          const char = content[index];

          if (char === '"') {
            if (insideQuotes && content[index + 1] === '"') {
              cell += '"';
              index += 1;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === "," && !insideQuotes) {
            row.push(cell.trim());
            cell = "";
          } else if ((char === "\n" || char === "\r") && !insideQuotes) {
            if (char === "\r" && content[index + 1] === "\n") index += 1;
            row.push(cell.trim());
            if (row.some((value) => value.length > 0)) rows.push(row);
            row = [];
            cell = "";
          } else {
            cell += char;
          }
        }

        if (insideQuotes) throw new Error("The CSV file has an unclosed quoted value.");

        row.push(cell.trim());
        if (row.some((value) => value.length > 0)) rows.push(row);
        return rows;
      };

      const csvRows = parseCsvRows(String(reader.result || "").replace(/^\uFEFF/, ""));
      if (csvRows.length < 2) {
        throw new Error("The CSV contains no event rows. Fill in the downloaded template and try again.");
      }

      const headers = csvRows[0].map((value) => value.toLowerCase().trim());
      if (!headers.includes("title") || !headers.includes("date")) {
        throw new Error("Invalid CSV columns: title and date are required. Use Download Template for the correct file format.");
      }
      if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
        throw new Error("Invalid CSV header: columns must have non-empty, unique names.");
      }

      const getColumn = (row: string[], name: string) => {
        const column = headers.indexOf(name);
        return column >= 0 ? row[column] || "" : "";
      };

      const csvLines = csvRows.slice(1);
      const validationErrors: string[] = [];
      const seenFileEvents = new Map<string, number>();
      const parsed = csvLines
        .map((line, index) => {
          const rowNumber = index + 2;
          const issues: string[] = [];
          const title = getColumn(line, "title").trim();
          const rawDate = getColumn(line, "date");
          const rawStart = getColumn(line, "start");
          const rawEnd = getColumn(line, "end");
          const location = getColumn(line, "location");
          const attendees = getColumn(line, "attendees");
          const rawStatus = getColumn(line, "status");

          if (line.length !== headers.length) {
            issues.push(`expected ${headers.length} columns, found ${line.length}`);
          }
          if (!title) issues.push("event title is missing");
          const dateObj = parseCsvDate(rawDate);
          if (!dateObj) issues.push("date is missing or invalid (use YYYY-MM-DD or DD/MM/YYYY)");

          // The time helper accepts a fallback for blank fields, but invalid
          // NON-blank values must be rejected rather than silently replaced.
          const start = normalizeCsvTime(rawStart, rawStart.trim() ? "" : "10:00");
          const end = normalizeCsvTime(rawEnd, rawEnd.trim() ? "" : "11:00");
          if (!start) issues.push(`invalid start time: ${rawStart}`);
          if (!end) issues.push(`invalid end time: ${rawEnd}`);
          if (start && end) {
            const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
            const endMinutes = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
            if (endMinutes <= startMinutes) issues.push("end time must be after start time");
          }

          if (attendees.trim() &&
              (!/^\d+$/.test(attendees.trim()) || !Number.isSafeInteger(Number(attendees.trim())))) {
            issues.push("attendees must be a non-negative whole number");
          }

          const normalizedStatus = rawStatus.trim().toLowerCase();
          const csvStatusMap: Record<string, EventStatus> = {
            published: "Published",
            saved: "Saved",
            scheduled: "Scheduled",
            paused: "Paused",
            closed: "Closed",
            cancelled: "Cancelled",
            canceled: "Cancelled",
          };
          if (normalizedStatus && !csvStatusMap[normalizedStatus]) {
            issues.push(`invalid status: ${rawStatus}`);
          }

          if (issues.length) {
            validationErrors.push(`Row ${rowNumber}: ${issues.join("; ")}`);
            return null;
          }

          // Invalid/missing date and time values have already been collected above.
          if (!dateObj) return null;
          const key = `${title}|${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}|${start}|${end}|${location || "TBA"}`.toLowerCase();
          if (seenFileEvents.has(key)) {
            validationErrors.push(`Row ${rowNumber}: duplicate event (same as row ${seenFileEvents.get(key)})`);
            return null;
          }
          seenFileEvents.set(key, rowNumber);

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
            status: csvStatusMap[normalizedStatus] || "Saved",
            color: "#2d4cc8",
          };
        })
        .filter((event): event is NonNullable<typeof event> => Boolean(event));

      // Validate the ENTIRE file before uploading even a single event.
      // Display specific row/content errors in the small button-side popup.
      if (validationErrors.length) {
        setBulkFeedback({
          kind: "error",
          title: `Invalid CSV content (${validationErrors.length} issue${validationErrors.length === 1 ? "" : "s"})`,
          messages: [...validationErrors.slice(0, 5),
            ...(validationErrors.length > 5 ? [`+${validationErrors.length - 5} more invalid rows. Fix the CSV and upload again.`] : []),
            "No events were uploaded. Correct the file and try again."],
        });
        return;
      }

      const uniqueParsed = parsed;
      const invalidRows = 0;
      const duplicateFileRows = 0;
      let existingRows = 0;
      let failedRows = 0;
      let invalidBackendRows = 0;
      let addedRows = 0;

      if (!uniqueParsed.length) {
        throw new Error(`No valid events to upload. Invalid rows: ${invalidRows}; duplicate rows: ${duplicateFileRows}. Check the title and date values.`);
      }

      const token = window.localStorage.getItem("calendar_access_token");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      if (token) {
                                                                                
                                                                               
        let existingBackendEvents: BackendEvent[] = [];

        try {
          const existingResponse = await calendarAuthenticatedFetch(`${apiUrl}/events`, {
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

                                                         
                                                                             
          if (!startDateIso || !endDateIso) {
            invalidBackendRows += 1;
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
            existingRows += 1;
            continue;
          }

          try {
            const response = await calendarAuthenticatedFetch(`${apiUrl}/events`, {
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
                status: (
                  {
                    Published: "PUBLISHED",
                    Saved: "SAVED",
                    Scheduled: "SCHEDULED",
                    Paused: "PAUSED",
                    Closed: "CLOSED",
                    Cancelled: "CANCELLED",
                  } satisfies Record<EventStatus, BackendEventStatus>
                )[event.status],
              }),
            });

            if (!response.ok) {
              failedRows += 1;
              console.error(
                "Failed to bulk upload backend event:",
                response.status,
                await response.text()
              );
              continue;
            }

            const saved = (await response.json()) as BackendEvent;

                                                                               
                                                                             
            const mappedSavedEvent = backendEventToCalendarEvent(saved);

            savedBackendEvents.push(mappedSavedEvent);
            existingKeys.add(eventKey);
          } catch (error) {
            failedRows += 1;
            console.error(
              "Failed to bulk upload backend event:",
              error
            );
          }
        }

        addedRows = savedBackendEvents.length;
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
            setWeekDate(uploadedDate);
            setDayDate(uploadedDate);
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
        const existingLocalKeys = new Set(
          events.map((event) =>
            `${event.title}|${event.year}-${event.month}-${event.day}|${event.start}|${event.end}|${event.location}`.toLowerCase()
          )
        );
        const newLocalEvents = uniqueParsed.filter((event) => {
          const key = `${event.title}|${event.year}-${event.month}-${event.day}|${event.start}|${event.end}|${event.location}`.toLowerCase();
          if (existingLocalKeys.has(key)) {
            existingRows += 1;
            return false;
          }
          return true;
        });
        addedRows = newLocalEvents.length;
        if (newLocalEvents.length) {
          setEvents((prev) =>
            saveEvents([...prev, ...newLocalEvents])
          );
        }

        const latestUploadedEvent =
          newLocalEvents[newLocalEvents.length - 1];

        if (latestUploadedEvent) {
          const uploadedDate = new Date(
            latestUploadedEvent.year,
            latestUploadedEvent.month,
            latestUploadedEvent.day
          );

          setScheduleDate(uploadedDate);
          setWeekDate(uploadedDate);
          setDayDate(uploadedDate);
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
      const hadSaveErrors = failedRows > 0 || invalidBackendRows > 0;
      setBulkFeedback({
        kind: hadSaveErrors ? "error" : "success",
        title: hadSaveErrors ? "Some events could not be saved" : addedRows > 0 ? "Upload successful" : "No new events added",
        messages: [
          `${addedRows} event${addedRows === 1 ? "" : "s"} added`,
          ...(existingRows ? [`${existingRows} already exist${existingRows === 1 ? "s" : ""}`] : []),
          ...(invalidBackendRows ? [`${invalidBackendRows} event${invalidBackendRows === 1 ? "" : "s"} have invalid date/time values`] : []),
          ...(failedRows ? [`${failedRows} event${failedRows === 1 ? "" : "s"} rejected by the server`] : []),
        ],
      });
      } catch (error) {
        console.error("Calendar bulk upload failed:", error);
        setBulkFeedback({
          kind: "error",
          title: "Invalid CSV / upload failed",
          messages: [error instanceof Error ? error.message : "The file could not be uploaded. Check its content and try again."],
        });
      } finally {
        bulkUploadInProgressRef.current = false;
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    try {
      reader.readAsText(file);
    } catch (error) {
      bulkUploadInProgressRef.current = false;
      console.error("Unable to read calendar CSV:", error);
      setBulkFeedback({
        kind: "error",
        title: "Unable to read file",
        messages: ["Unable to read this CSV. Please choose the file again."],
      });
    }
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
                  <div className="studentResourcesWrap">
                    <button
                      type="button"
                      className="neoButton studentExportButton studentResourcesButton"
                      onClick={() =>
                        setStudentResourcesOpen((previous) => !previous)
                      }
                      aria-label="Resources"
                      aria-haspopup="menu"
                      aria-expanded={studentResourcesOpen}
                    >
                      <span className="studentExportButtonContent">
                        <span className="studentExportButtonText">Resources</span>
                      </span>
                    </button>

                    {studentResourcesOpen && (
                      <div
                        className="studentResourcesMenu"
                        role="menu"
                        aria-label="Resources"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setStudentResourcesOpen(false);
                            setExportMessage("");
                            setExportDropdown(null);
                            setExportOpen(true);
                          }}
                        >
                          <Image
                            src={studentExportIconSrc}
                            alt=""
                            width={17}
                            height={17}
                            className="studentResourcesMenuIcon"
                            aria-hidden="true"
                          />
                          <span>Export Calendar</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setStudentResourcesOpen(false);
                            router.push("/discussion_form");
                          }}
                        >
                          <Icon src={icons.more} size={17} />
                          <span>Discussion Forum</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bulkUploadWrap">
                      <button className="neoButton" onClick={() => { setBulkFeedback(null); setBulkOpen(v => !v); }}>
                        <Icon src={icons.bulkUpload} /> <span>Bulk Upload</span>
                      </button>
                      {bulkOpen && (
                        <div className="bulkMenu">
                          <button onClick={downloadTemplate}><Icon src={icons.download} /> Download Template</button>
                          <button onClick={() => fileInputRef.current?.click()}><Icon src={icons.uploadFile} /> Choose File</button>
                        </div>
                      )}
                      {bulkFeedback && (
                        <div className={`bulkUploadFeedback bulkUploadFeedback--${bulkFeedback.kind}`} role={bulkFeedback.kind === "error" ? "alert" : "status"}>
                          <button className="bulkFeedbackClose" type="button" aria-label="Dismiss upload message" onClick={() => setBulkFeedback(null)}>×</button>
                          <strong>{bulkFeedback.title}</strong>
                          {bulkFeedback.messages.map((message, index) => (
                            <p key={index}>{message}</p>
                          ))}
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
                    <button
                      ref={desktopAddButtonRef}
                      type="button"
                      className="neoButton addEventButton"
                      aria-label="Add"
                      aria-haspopup="menu"
                      aria-expanded={addMenuOpen === "desktop"}
                      onClick={() => {
                        setBulkOpen(false);
                        openAddDropdown(
                          "desktop",
                          desktopAddButtonRef.current
                        );
                      }}
                    >
                      <Icon src={icons.add} />
                      <span>Add</span>
                    </button>
                  </>
                )}
              </div>
            </section>

                        <section
              className={`calendarContentViewSwitch ${
                isStudentView ? "studentContentViewSwitch" : ""
              }`}
              aria-label={
                isStudentView
                  ? "Student calendar views"
                  : "Calendar management views"
              }
            >
              {(isStudentView
                ? (["Calendar", "My Schedules"] as const)
                : ([
                    "Calendar",
                    "All",
                    "Published",
                    "Saved",
                    "My Events",
                  ] as const)
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={contentView === item ? "active" : ""}
                  onClick={() => {
                    setContentView(item);
                    setEventSearchQuery("");
                    setOpenMenu(null);
                    setOpenMenuSource(null);
                    setSelectedDay(null);
                    setMobileEventIndex(0);

                    if (item === "Calendar") {
                      setScheduleTab("All");
                    } else if (item === "My Schedules") {
                                                                               
                                                           
                      setScheduleTab("All");
                    } else {
                      setScheduleTab(item);
                    }
                  }}
                >
                  {item === "All" ? "All Events" : item}
                </button>
              ))}
            </section>

            <section
              className={`calendarWorkspace ${
                isStudentView ? "studentCalendarWorkspace" : ""
              } ${
                contentView === "Calendar"
                  ? "calendarContentModeCalendar"
                  : "calendarContentModeList"
              } ${
                view === "week"
                  ? "weekImageLayout"
                  : view === "day"
                    ? "dayImageLayout"
                    : ""
              }`}
            >
              <div
                className={`calendarPanel ${
                  contentView !== "Calendar" ? "contentPanelHidden" : ""
                }`}
              >
                <div className="mobileMonthHeadingRow">
                  {view === "month" ? (
                    <div className="calendarMonthYearSelectors calendarMonthYearPickerShell">
                      <button
                        type="button"
                        className={`calendarMonthYearPickerButton ${
                          calendarPickerOpen === "month" ? "open" : ""
                        }`}
                        aria-label="Select month"
                        aria-expanded={calendarPickerOpen === "month"}
                        onClick={() => {
                          setDayPopup(null);
                          setDayEventList(null);
                          setCalendarPickerOpen((previous) =>
                            previous === "month" ? null : "month"
                          );
                        }}
                      >
                        <span>{calendarMonthNames[currentDate.getMonth()]}</span>
                        <Icon src={icons.chevronDown} size={18} />
                      </button>

                      <button
                        type="button"
                        className={`calendarMonthYearPickerButton calendarYearPickerButton ${
                          calendarPickerOpen === "year" ? "open" : ""
                        }`}
                        aria-label="Select year"
                        aria-expanded={calendarPickerOpen === "year"}
                        onClick={() => {
                          setDayPopup(null);
                          setDayEventList(null);
                          setCalendarYearRangeStart(
                            currentDate.getFullYear() - 10
                          );
                          setCalendarPickerOpen((previous) =>
                            previous === "year" ? null : "year"
                          );
                        }}
                      >
                        <span>{currentDate.getFullYear()}</span>
                        <Icon src={icons.chevronDown} size={18} />
                      </button>

                      {calendarPickerOpen === "month" && (
                        <div className="calendarMonthYearPopover calendarMonthPopover">
                          <div className="calendarPickerHeader calendarMonthPickerHeader">
                            <strong>
                              {calendarMonthNames[currentDate.getMonth()]}
                            </strong>
                          </div>

                          <div className="calendarMonthOptionGrid">
                            {calendarMonthNames.map((monthLabel, monthIndex) => (
                              <button
                                type="button"
                                key={monthLabel}
                                className={`calendarMonthYearOption ${
                                  currentDate.getMonth() === monthIndex
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => selectCalendarMonth(monthIndex)}
                              >
                                {monthLabel}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {calendarPickerOpen === "year" && (
                        <div className="calendarMonthYearPopover calendarYearPopover">
                          <div className="calendarPickerHeader calendarYearPickerHeader">
                            <button
                              type="button"
                              className="calendarPickerHeaderArrow calendarPickerHeaderCircle"
                              aria-label="Previous years"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setCalendarYearRangeStart((previous) => previous - 12);
                              }}
                            >
                              <Icon src={icons.chevronLeft} size={24} />
                            </button>

                            <strong>
                              {calendarYearRangeStart} -{" "}
                              {calendarYearRangeStart + 11}
                            </strong>

                            <button
                              type="button"
                              className="calendarPickerHeaderArrow calendarPickerHeaderCircle"
                              aria-label="Next years"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setCalendarYearRangeStart((previous) => previous + 12);
                              }}
                            >
                              <Icon src={icons.chevronRight} size={24} />
                            </button>
                          </div>

                          <div className="calendarYearOptionGrid">
                            {calendarYearRange.map((yearValue) => (
                              <button
                                type="button"
                                key={yearValue}
                                className={`calendarMonthYearOption calendarYearOption ${
                                  currentDate.getFullYear() === yearValue
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => selectCalendarYear(yearValue)}
                              >
                                {yearValue}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <h2>{view === "week" ? weekTitle : dayTitle}</h2>
                  )}

                  {!isStudentView && (
                    <div className="mobileMonthHeadingActions">
                      <button
                        ref={mobileAddButtonRef}
                        type="button"
                        className="mobileMonthHeadingButton"
                        aria-label="Add"
                        aria-haspopup="menu"
                        aria-expanded={addMenuOpen === "mobile"}
                        onClick={() => {
                          setMobileFiltersOpen(false);
                          setOpenFilter(null);
                          openAddDropdown(
                            "mobile",
                            mobileAddButtonRef.current
                          );
                        }}
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
                            setAddMenuOpen(null);
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
                      <button
                        key={item}
                        className={view === item ? "active" : ""}
                        onClick={() => changeCalendarView(item)}
                      >
                        {item[0].toUpperCase() + item.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="calendarNav">
                    <button className="todayButton" onClick={() => {
                      const today = new Date();
                      const todayDate = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );

                      setScheduleDate(todayDate);
                      setSelectedDay(null);
                      setTodayLocalDayKey(calendarLocalDayKey(todayDate));

                      if (view === "week") {
                        setWeekDate(todayDate);
                      } else if (view === "day") {
                        setDayDate(todayDate);
                      } else {
                        setCurrentDate(
                          new Date(
                            todayDate.getFullYear(),
                            todayDate.getMonth(),
                            1
                          )
                        );
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
                      const cellKey = calendarLocalDayKey(cell.date);
                      const isPastDate = cellKey < todayLocalDayKey;
                      const isToday = cellKey === todayLocalDayKey;
                      // A past date can never retain the active/create highlight.
                      // On opening the current month, today is the active date;
                      // choosing another available date moves the highlight.
                      const isActiveDate = cell.current && !isPastDate && (
                        selectedDay === null ? isToday : selectedDay === cell.day
                      );

                      const isInOpenedEventRange =
                        !!openedEventRange &&
                        cell.current &&
                        cellDateOnly.getTime() >= openedEventRange.start.getTime() &&
                        cellDateOnly.getTime() <= openedEventRange.end.getTime();

                      return (
                        <div
                          className={`dayCell ${!cell.current ? "outside" : ""} ${isPastDate ? "pastDate" : ""} ${isToday ? "todayDate" : ""} ${isActiveDate ? "selected" : ""} ${isInOpenedEventRange ? "eventRangeHighlighted" : ""}`}
                          key={`${cell.date.toISOString()}-${index}`}
                          role={cell.current ? "button" : undefined}
                          aria-disabled={cell.current && isPastDate ? true : undefined}
                          aria-current={cell.current && isToday ? "date" : undefined}
                          tabIndex={cell.current && !isPastDate ? 0 : -1}
                          onClick={() => { if (cell.current && !isPastDate) { setDayPopup(null); setDayEventList(null); setSelectedDay(cell.day); } }}
                          onKeyDown={(ev) => {
                            if (!cell.current || isPastDate) return;
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              setDayPopup(null);
                              setDayEventList(null);
                              setSelectedDay(cell.day);
                            }
                          }}
                        >
                          <span className="dayNumber">{String(cell.day).padStart(2, "0")}</span>
                          {!!dayEvents.length && (
                            <span
                              className="dayEvents"
                              onMouseEnter={() => {
                                setDayPopup(null);
                                setDayEventList({ dateKey: cellKey, events: dayEvents });
                              }}
                              onFocus={() => {
                                setDayPopup(null);
                                setDayEventList({ dateKey: cellKey, events: dayEvents });
                              }}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setDayPopup(null);
                                setDayEventList({ dateKey: cellKey, events: dayEvents });
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

                          {cell.current && !isPastDate && !isStudentView && (
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

                          {dayEventList?.dateKey === cellKey && !dayPopup && (
                            <span
                              className={`calendarDayEventList ${
                                index % 7 <= 1
                                  ? "calendarPopupAlignLeft"
                                  : index % 7 >= 5
                                    ? "calendarPopupAlignRight"
                                    : "calendarPopupAlignCenter"
                              }`}
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
                                      setDayPopup({ dateKey: cellKey, event });
                                    }}
                                    onKeyDown={(ev) => {
                                      if (ev.key === "Enter" || ev.key === " ") {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        setDayEventList(null);
                                        setDayPopup({ dateKey: cellKey, event });
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

                          {dayPopup?.dateKey === cellKey && (
                            <span
                              className={`calendarDayPopup ${
                                index % 7 <= 1
                                  ? "calendarPopupAlignLeft"
                                  : index % 7 >= 5
                                    ? "calendarPopupAlignRight"
                                    : "calendarPopupAlignCenter"
                              }`}
                              onClick={(ev) => ev.stopPropagation()}
                            >
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
                  <div className="weekCalendarView" ref={weekScrollRef}>
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

                      {weekDays.map((date) => {
                        const allDayEvents = events.filter(
                          event => isCalendarEventOnDate(event, date) && getWeekEventHour(event) < 0
                        );
                        return (
                          <div
                            className={`weekCalendarCell${allDayEvents.length ? " hasCalendarEvents" : ""}`}
                            key={`week-all-day-${date.toISOString()}`}
                          >
                            {allDayEvents.map(event => (
                              <div className="weekCalendarEvent" key={event.id} title={event.title}>
                                <i style={{ background: event.color }} />
                                <span>{event.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {weekHours.map((hour) => (
                        <div className="weekCalendarRow" key={`week-hour-${hour}`}>
                          <div className="weekCalendarTime" data-calendar-hour={hour}>
                            {formatWeekHour(hour)}
                          </div>

                          {weekDays.map((date) => {
                            const cellEvents = events.filter(
                              (event) => isCalendarEventOnDate(event, date) && getWeekEventHour(event) === hour
                            );

                            return (
                              <div
                                className={`weekCalendarCell${cellEvents.length ? " hasCalendarEvents" : ""}`}
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
                  <div className="dayCalendarView" ref={dayScrollRef}>
                    <div className="dayCalendarGrid">
                      <div className="dayCalendarHeader">{dayName}</div>

                      <div className="dayCalendarTime">All- Day</div>
                      <div className="dayCalendarCell">
                        {events
                          .filter(event => isCalendarEventOnDate(event, dayDate) && getWeekEventHour(event) < 0)
                          .map(event => (
                            <div className="dayCalendarEvent" key={event.id} title={event.title}>
                              <i style={{ background: event.color }} />
                              <span>{event.title}</span>
                            </div>
                          ))}
                      </div>

                      {weekHours.map((hour) => (
                        <div className="dayCalendarRow" key={`day-hour-${hour}`}>
                          <div className="dayCalendarTime" data-calendar-hour={hour}>{formatWeekHour(hour)}</div>

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

              <aside
                className={`schedulePanel ${
                  contentView === "Calendar" ? "contentPanelHidden" : ""
                }`}
              >
                <div className="scheduleListHeader">
                  <div>
                    <strong>
                      {contentView === "My Schedules"
                        ? "My Schedules"
                        : contentView === "My Events"
                          ? "My Events"
                          : contentView === "All"
                            ? "All Events"
                            : `${contentView} Events`}
                    </strong>
                    <span>
                      {listVisibleEvents.length}{" "}
                      {listVisibleEvents.length === 1 ? "Event" : "Events"}
                    </span>
                  </div>
                </div>

{!hideCalendarFilters && !showPublishAudienceFilters && contentView !== "Calendar" && (
            <section
              className={`calendarFilters listCalendarFilters ${
                isTenantScopedRole ? "tenantScopedFilters" : ""
              } ${
                audienceFilter === "All Audiences"
                  ? "audienceFiltersInitial"
                  : "audienceFiltersSelected"
              } ${
                audienceFilter === "Specific Organization + Actor"
                  ? "organizationActorFilters"
                  : ""
              } ${mobileFiltersOpen ? "mobileFiltersOpen" : ""}`}
            >
              {showPublishAudienceFilters && (
                <FilterDropdown
                  className="audienceFilterDropdown"
                  label="All Users"
                  value={audienceFilter}
                  options={audienceFilterOptions}
                  open={openFilter === "audience"}
                  onToggle={() =>
                    setOpenFilter(
                      openFilter === "audience" ? null : "audience"
                    )
                  }
                  onSelect={(value) => {
                    setAudienceFilter(value as AudienceFilterType);
                    setTenant("All Tenants");
                    setRole("All Roles");
                    setOrganization("All Organizations");
                    setOpenFilter(null);
                  }}
                />
              )}

              {showTenantFilter && showPublishAudienceFilters && showAudienceTenantFilter ? (
                <FilterDropdown
                  className="tenantFilterDropdown"
                  label="Tenant"
                  value={tenant}
                  options={tenants}
                  open={openFilter === "tenant"}
                  onToggle={() =>
                    setOpenFilter(
                      openFilter === "tenant" ? null : "tenant"
                    )
                  }
                  onSelect={(value) => {
                    setTenant(value);
                    setRole("All Roles");
                    setOrganization("All Organizations");
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

              {showPublishAudienceFilters && showAudienceOrganizationFilter && (
                <FilterDropdown
                  className="organizationFilterDropdown"
                  label="Organization"
                  value={organization}
                  options={availableOrganizationOptions}
                  open={openFilter === "organization"}
                  onToggle={() =>
                    setOpenFilter(
                      openFilter === "organization"
                        ? null
                        : "organization"
                    )
                  }
                  onSelect={(value) => {
                    setOrganization(value);
                    setOpenFilter(null);
                  }}
                />
              )}

              {(showPublishAudienceFilters ? showAudienceRoleFilter : true) && (
                <FilterDropdown
                  className="roleFilterDropdown"
                  label="Role"
                  value={role}
                  options={availableRoleOptions}
                  open={openFilter === "role"}
                  onToggle={() =>
                    setOpenFilter(
                      openFilter === "role" ? null : "role"
                    )
                  }
                  onSelect={(value) => {
                    setRole(value);
                    setOpenFilter(null);
                  }}
                />
              )}

              <FilterDropdown
                className="statusFilterDropdown"
                label="Status"
                value={status}
                options={availableStatusOptions}
                open={openFilter === "status"}
                onToggle={() =>
                  setOpenFilter(
                    openFilter === "status" ? null : "status"
                  )
                }
                onSelect={(value) => {
                  setStatus(value);
                  setOpenFilter(null);
                }}
              />

              <button
                className="neoButton clearButton"
                onClick={() => {
                  clearFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Clear
              </button>
            </section>
            )}

                {/* Shared month/year filters for tenant actors and students. */}
                {!showPublishAudienceFilters && contentView !== "Calendar" && (
                  <section className="calendarListDateFilters" aria-label="Event month and year filters">
                    <FilterDropdown
                      className="monthFilterDropdown"
                      label="Month"
                      value={listMonthFilterTouched ? listMonthFilter : "Month"}
                      options={calendarMonthFilterOptions}
                      open={openFilter === "listMonth"}
                      onToggle={() => setOpenFilter(openFilter === "listMonth" ? null : "listMonth")}
                      onSelect={(value) => {
                        setListMonthFilter(value);
                        setListMonthFilterTouched(true);
                        setOpenFilter(null);
                      }}
                    />
                    <FilterDropdown
                      className="yearFilterDropdown"
                      label="Year"
                      value={listYearFilterTouched ? listYearFilter : "Year"}
                      options={listYearOptions}
                      searchable
                      open={openFilter === "listYear"}
                      onToggle={() => setOpenFilter(openFilter === "listYear" ? null : "listYear")}
                      onSelect={(value) => {
                        setListYearFilter(value);
                        setListYearFilterTouched(true);
                        setOpenFilter(null);
                      }}
                    />
                  </section>
                )}

                {showPublishAudienceFilters && (
                  <section className="calendarFilters listCalendarFilters allUsersCompactFilters">
                    <AllUsersFilterDropdown
                      touched={allUsersFilterTouched}
                      value={
                        audienceFilter === "Tenant Only" ||
                        audienceFilter === "Actor Only" ||
                        audienceFilter === "Specific Tenant"
                          ? audienceFilter
                          : "All Audiences"
                      }
                      tenant={tenant}
                      organization={organization}
                      tenantOptions={tenants}
                      organizationOptions={availableOrganizationOptions}
                      open={openFilter === "audience"}
                      level={allUsersFilterLevel}
                      onToggle={() => {
                        if (openFilter === "audience") {
                          setOpenFilter(null);
                          return;
                        }

                        setAllUsersFilterLevel("modes");
                        setOpenFilter("audience");
                      }}
                      onLevelChange={setAllUsersFilterLevel}
                      onModeSelect={(value) => {
                        setAllUsersFilterTouched(true);
                        setAudienceFilter(value);
                        setTenant("All Tenants");
                        setRole("All Roles");
                        setOrganization("All Organizations");

                        if (value !== "Specific Tenant") {
                          setOpenFilter(null);
                          setAllUsersFilterLevel("modes");
                        }
                      }}
                      onTenantSelect={(value) => {
                        setAllUsersFilterTouched(true);
                        setAudienceFilter("Specific Tenant");
                        setTenant(value);
                        setRole("All Roles");
                        setOrganization("All Organizations");
                        setStatus("All Status");
                        setDepartment("All Departments");
                        setSelectedDepartmentDivision("");
                      }}
                      onOrganizationSelect={(value) => {
                        setAllUsersFilterTouched(true);
                        setOrganization(value);
                        setOpenFilter(null);
                        setAllUsersFilterLevel("modes");
                      }}
                    />

                    <FilterDropdown
                      className="monthFilterDropdown"
                      label="Month"
                      value={listMonthFilterTouched ? listMonthFilter : "Month"}
                      options={calendarMonthFilterOptions}
                      open={openFilter === "listMonth"}
                      onToggle={() =>
                        setOpenFilter(
                          openFilter === "listMonth" ? null : "listMonth"
                        )
                      }
                      onSelect={(value) => {
                        setListMonthFilter(value);
                        setListMonthFilterTouched(true);
                        setOpenFilter(null);
                      }}
                    />

                    <FilterDropdown
                      className="yearFilterDropdown"
                      label="Year"
                      value={listYearFilterTouched ? listYearFilter : "Year"}
                      options={listYearOptions}
                      searchable
                      open={openFilter === "listYear"}
                      onToggle={() =>
                        setOpenFilter(
                          openFilter === "listYear" ? null : "listYear"
                        )
                      }
                      onSelect={(value) => {
                        setListYearFilter(value);
                        setListYearFilterTouched(true);
                        setOpenFilter(null);
                      }}
                    />

                    <FilterDropdown
                      className="statusFilterDropdown"
                      label="Status"
                      value={status}
                      options={availableStatusOptions}
                      open={openFilter === "status"}
                      onToggle={() =>
                        setOpenFilter(
                          openFilter === "status" ? null : "status"
                        )
                      }
                      onSelect={(value) => {
                        setStatus(value);
                        setOpenFilter(null);
                      }}
                    />

                    <button
                      className="neoButton clearButton"
                      onClick={() => {
                        clearFilters();
                        setListMonthFilter("All Months");
                        setListMonthFilterTouched(false);
                        setListYearFilter("All Years");
                        setListYearFilterTouched(false);
                        setAllUsersFilterTouched(false);
                        setAllUsersFilterLevel("modes");
                        setMobileFiltersOpen(false);
                      }}
                    >
                      Clear
                    </button>
                  </section>
                )}

                {showPublishAudienceFilters &&
                  allUsersFilterTouched &&
                  audienceFilter === "Tenant Only" && (
                    <section
                      className="tenantKpiSection"
                      aria-label="Tenant summary"
                    >
                      <div className="tenantKpiCard tenantKpiCardTotal">
                        <span className="tenantKpiLabel">Total Events</span>
                        <strong className="tenantKpiValue">
                          {tenantKpiData.total}
                        </strong>
                      </div>

                      {tenantKpiData.items.map((item) => (
                        <div className="tenantKpiCard" key={item.name}>
                          <span className="tenantKpiLabel">{item.name}</span>
                          <strong className="tenantKpiValue">
                            {item.count}
                          </strong>
                        </div>
                      ))}
                    </section>
                  )}

                <div className="eventListSearchWrap">
                  <input
                    type="search"
                    className="eventListSearchInput"
                    value={eventSearchQuery}
                    onChange={(event) => {
                      setEventSearchQuery(event.target.value);
                      setMobileEventIndex(0);
                      setOpenMenu(null);
                    }}
                    placeholder={
                      contentView === "My Schedules"
                        ? "Search my schedules..."
                        : contentView === "My Events"
                          ? "Search my events..."
                          : contentView === "Published"
                            ? "Search published events..."
                            : contentView === "Saved"
                              ? "Search saved events..."
                              : "Search all events..."
                    }
                    aria-label="Search events"
                  />

                  {eventSearchQuery && (
                    <button
                      type="button"
                      className="eventListSearchClear"
                      aria-label="Clear event search"
                      onClick={() => {
                        setEventSearchQuery("");
                        setMobileEventIndex(0);
                      }}
                    >
                      ×
                    </button>
                  )}
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
                        ? Math.min(currentIndex + 1, listVisibleEvents.length - 1)
                        : Math.max(currentIndex - 1, 0)
                    );
                  }}
                >
                  {listVisibleEvents.length ? listVisibleEvents.map((event, index) => (
                    <article
                      className={`eventCard ${
                        index === mobileEventIndex
                          ? "mobileActiveEventCard"
                          : ""
                      }`}
                      key={event.id}
                    >
                      {!isStudentView && (() => {
                        const cardStatus =
                          getReceivedEventDisplayStatus(event);

                        return (
                          <span
                            className={`statusBadge ${cardStatus.toLowerCase()}`}
                          >
                            {cardStatus}
                          </span>
                        );
                      })()}

                      {(() => {
                                                                                           
                                                                                                  
                        const cardTitle = (event.eventTitle || event.title || "").trim();
                        const cardSubtitle = (event.eventSubtitle || event.subtitle || "").trim();
                        const cardStartDate = (event.startDate || event.date || "").trim();
                        const cardEndDate = (event.endDate || "").trim();
                        const cardStartTime = (event.startTime || event.start || "").trim();
                        const cardEndTime = (event.endTime || event.end || "").trim();
                        const cardPriority = (event.priority || "").trim();
                        const cardDescription = (event.description || "").trim();
                        const cardAudienceDetails = (
                          event.audienceDetails ||
                          event.audience ||
                          ""
                        ).trim();
                        const showAudienceDetails =
                          event.status !== "Saved" &&
                          Boolean(cardAudienceDetails);
                        const cardAttachment = (event.attachment || "").trim();
                        const parsedCardAttachment = parseStoredAttachment(cardAttachment);
                        const cardAttachmentName = parsedCardAttachment.originalName;
                        const isReceivedSchedule = isStudentView;

                        const sameDate =
                          cardStartDate &&
                          cardEndDate &&
                          cardStartDate.toLowerCase() === cardEndDate.toLowerCase();

                        const formatCardDate = (value: string) => {
                          const raw = (value || "").trim();

                          const yyyyMmDd = raw.match(
                            /^(\d{4})-(\d{2})-(\d{2})$/
                          );

                          if (yyyyMmDd) {
                            return `${yyyyMmDd[3]}-${yyyyMmDd[2]}-${yyyyMmDd[1]}`;
                          }

                          return raw;
                        };

                        const formattedStartDate =
                          formatCardDate(cardStartDate);
                        const formattedEndDate =
                          formatCardDate(cardEndDate);

                        const dateText = sameDate
                          ? formattedStartDate
                          : [formattedStartDate, formattedEndDate]
                              .filter(Boolean)
                              .join(" - ");

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

                                  <span className="studentEventCreator calendarEventPublisher">
                                    {event.status === "Published" || event.status === "Paused" || event.status === "Closed"
                                      ? " - Published by "
                                      : " - Created by "}
                                    {getCalendarEventPublisherLabel(event)}
                                  </span>

                                  {event.reminderSentAt && (
                                    <span
                                      className="scheduleReminderFlag"
                                      tabIndex={0}
                                      aria-label="Reminder sent details"
                                    >
                                      <span
                                        className="scheduleReminderFlagIcon"
                                        aria-hidden="true"
                                      >
                                        ⚑
                                      </span>
                                      <span>Reminder Sent</span>

                                      <span
                                        className="reminderHoverCard"
                                        role="tooltip"
                                      >
                                        <span className="reminderHoverRow">
                                          <span className="reminderHoverLabel">
                                            Title
                                          </span>
                                          <span className="reminderHoverValue">
                                            {cardTitle}
                                          </span>
                                        </span>

                                        {dateText && (
                                          <span className="reminderHoverRow">
                                            <span className="reminderHoverLabel">
                                              Date
                                            </span>
                                            <span className="reminderHoverValue">
                                              {dateText}
                                            </span>
                                          </span>
                                        )}

                                        {timeText && (
                                          <span className="reminderHoverRow">
                                            <span className="reminderHoverLabel">
                                              Time
                                            </span>
                                            <span className="reminderHoverValue">
                                              {timeText}
                                            </span>
                                          </span>
                                        )}

                                        {showAudienceDetails && (
                                          <span className="reminderHoverRow">
                                            <span className="reminderHoverLabel">
                                              Audience
                                            </span>
                                            <span className="reminderHoverValue">
                                              {cardAudienceDetails}
                                            </span>
                                          </span>
                                        )}
                                      </span>
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

                            {showAudienceDetails && (
                              <div className="scheduleCardAudience">
                                <span className="scheduleCardFieldLabel">
                                  {event.status === "Scheduled"
                                    ? "Scheduled For"
                                    : "Published To"}
                                </span>
                                <span className="scheduleCardAudienceValue">
                                  {cardAudienceDetails}
                                </span>
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

                      {!isStudentView &&
                        contentView !== "My Events" &&
                        !isReceivedPublishedCard(event) && (
                        <div className="eventCardActions">
                          <button
                            type="button"
                            className="eventCardActionButton"
                            onClick={() => openEventForm(event, "edit")}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="eventCardActionButton"
                            onClick={() => openEventForm(event, "reuse")}
                          >
                            Reuse
                          </button>

                          {event.status === "Published" && (
                            <>
                              <button
                                type="button"
                                className="eventCardActionButton"
                                onClick={() => openReminderModal(event)}
                              >
                                Send Reminder
                              </button>

                              <button
                                type="button"
                                className="eventCardActionButton"
                                onClick={() => toggleEventPause(event)}
                              >
                                Pause
                              </button>

                              <button
                                type="button"
                                className="eventCardActionButton eventCardActionDanger"
                                onClick={() => openCancelEventModal(event)}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {event.status === "Paused" && (
                            <button
                              type="button"
                              className="eventCardActionButton"
                              onClick={() => toggleEventPause(event)}
                            >
                              Resume
                            </button>
                          )}

                          {(event.status === "Saved" ||
                            event.status === "Closed" ||
                            event.status === "Cancelled") && (
                            <button
                              type="button"
                              className="eventCardActionButton eventCardActionDanger"
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
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  )) : (
                    <div className="emptySchedule">
                      {eventSearchQuery.trim()
                        ? "No events match your search."
                        : "No events found."}
                    </div>
                  )}
                </div>

                {listVisibleEvents.length > 0 && (
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
                      disabled={mobileEventIndex >= listVisibleEvents.length - 1}
                      onClick={() => {
                        setOpenMenu(null);
                        setMobileEventIndex((currentIndex) =>
                          Math.min(currentIndex + 1, listVisibleEvents.length - 1)
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

          {addMenuOpen && (
            <BodyPortal>
              <div
                className="calendarAddChooser"
                role="menu"
                style={{
                  top: `${addMenuPosition.top}px`,
                  left: `${addMenuPosition.left}px`,
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAddMenuOpen(null);
                    handleAddEvent();
                  }}
                >
                  <Icon src={icons.calendar} />
                  <span>Event</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAddMenuOpen(null);
                    router.push("/discussion_form");
                  }}
                >
                  <Icon src={icons.more} />
                  <span>Discussion Forum</span>
                </button>
              </div>
            </BodyPortal>
          )}

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

                                                         
                                                                                                                        
                          

                  <div className="cmCancelEventInfo">
                    <p><strong>Event :</strong> {cancelEvent.eventTitle || cancelEvent.title}</p>
                    <p><strong>Date :</strong> {cancelEvent.startDate || cancelEvent.date}</p>
                    <p><strong>Time :</strong> {[cancelEvent.startTime || cancelEvent.start, cancelEvent.endTime || cancelEvent.end].filter(Boolean).join(" - ")}</p>
                    <p><strong>Audience :</strong> {cancelEvent.audience || cancelEvent.role || cancelEvent.tenant || "Selected audience"}</p>
                  </div>

                  <div className="cmCancelEventReasonHeading">
                    <label className="cmCancelEventReasonLabel" htmlFor="cancel-event-reason">
                      CANCELLATION MESSAGE
                    </label>
                    <span id="cancel-event-reason-counter" className="cmCancelEventReasonCounter">
                      {cancelReason.length} / 250
                    </span>
                  </div>
                  <textarea
                    id="cancel-event-reason"
                    className="cmCancelEventReason"
                    value={cancelReason}
                    maxLength={250}
                    onChange={(e) => setCancelReason(e.currentTarget.value.slice(0, 250))}
                    aria-describedby="cancel-event-reason-counter"
                    placeholder="Enter the message users should receive about this cancellation"
                  />

                                                         
                                                                                                                                                                                      
                          

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

          {false && publishEvent && (
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
                          aria-label="All Users"
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

          {false && autoPublishEvent && (
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
  