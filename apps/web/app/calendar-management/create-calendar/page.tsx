"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import CalendarSidebar from "@/components/calendar/CalendarSidebar";

import { calendarService } from "@/features/calendar/services/calendar.service";

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

export default function CreateCalendarPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<LoginData | null>(
      null
    );

  const [showForm, setShowForm] =
    useState(false);

  const [
    academicYear,
    setAcademicYear,
  ] = useState("");

  const [
    programme,
    setProgramme,
  ] = useState("");

  const [
    branch,
    setBranch,
  ] = useState("");

  const [
    year,
    setYear,
  ] = useState("");

  const [
    semester,
    setSemester,
  ] = useState("");

  const [
    scheme,
    setScheme,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  useEffect(() => {
    const storedLogin =
      localStorage.getItem(
        "calendar_dummy_login"
      );

    if (!storedLogin) {
      router.replace(
        "/sign_in"
      );

      return;
    }

    let currentUser: LoginData;

    try {
      currentUser =
        JSON.parse(storedLogin);
    } catch {
      router.replace(
        "/sign_in"
      );

      return;
    }

    if (!currentUser.loggedIn) {
      router.replace(
        "/sign_in"
      );

      return;
    }

    // Super Admin / Platform Admin
    // should NOT use this page.

    if (
      currentUser.role ===
        "SUPER_ADMIN" ||
      currentUser.role ===
        "PLATFORM_ADMIN"
    ) {
      router.replace(
        "/calendar-management"
      );

      return;
    }

    const existingCalendar =
      calendarService.getCalendarForUser(
        currentUser.role,
        currentUser.tenantType
      );

    if (existingCalendar) {
      router.replace(
        "/calendar-management"
      );

      return;
    }

    setUser(currentUser);
  }, [router]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    calendarService.createCalendar(
      {
        tenantId:
          user.tenantType,

        ownerId:
          user.role,

        title: `${programme} ${branch} ${semester}`,

        academicYear,

        programme,

        branch,

        year,

        semester,

        scheme,

        startDate,

        endDate,
      }
    );

    router.replace(
      "/calendar-management"
    );
  }

  if (!user) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight:
          "100vh",

        display:
          "flex",

        background:
          "#f8fafc",
      }}
    >
      <CalendarSidebar />

      <main
        style={{
          flex: 1,

          padding:
            "30px",

          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            showForm
              ? "flex-start"
              : "center",
        }}
      >
        {!showForm ? (
          <section
            style={{
              width: "100%",

              maxWidth:
                "720px",

              background:
                "#ffffff",

              border:
                "1px solid #e5e7eb",

              borderRadius:
                "18px",

              padding:
                "48px 36px",

              textAlign:
                "center",

              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                width:
                  "64px",

                height:
                  "64px",

                margin:
                  "0 auto 20px",

                borderRadius:
                  "16px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "#eef2ff",

                color:
                  "#4f46e5",

                fontSize:
                  "30px",
              }}
              aria-hidden="true"
            >
              📅
            </div>

            <h1
              style={{
                margin:
                  "0 0 12px",

                fontSize:
                  "30px",

                color:
                  "#111827",
              }}
            >
              Create Calendar
            </h1>

            <p
              style={{
                maxWidth:
                  "520px",

                margin:
                  "0 auto 26px",

                color:
                  "#6b7280",

                fontSize:
                  "15px",

                lineHeight:
                  1.6,
              }}
            >
              Set up your calendar for {user.displayTenant}. Once created,
              you will be taken directly to the calendar view.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowForm(true)
              }
              style={primaryButtonStyle}
            >
              + Create Calendar
            </button>
          </section>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
            style={{
              width:
                "100%",

              maxWidth:
                "900px",

              background:
                "#ffffff",

              padding:
                "32px",

              borderRadius:
                "16px",

              border:
                "1px solid #e5e7eb",

              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
              <h1
                style={{
                  margin:
                    "0 0 8px",

                  fontSize:
                    "28px",

                  color:
                    "#111827",
                }}
              >
                Create Calendar
              </h1>

              <p
                style={{
                  margin: 0,

                  color:
                    "#6b7280",

                  fontSize:
                    "14px",
                }}
              >
                Enter the calendar details below.
              </p>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",

                gap:
                  "0 20px",
              }}
            >
              <SelectField
                label="Academic Year *"
                value={
                  academicYear
                }
                onChange={
                  setAcademicYear
                }
                options={[
                  "2025-26",
                  "2026-27",
                  "2027-28",
                ]}
              />

              <SelectField
                label="Programme *"
                value={
                  programme
                }
                onChange={
                  setProgramme
                }
                options={[
                  "B.Tech",
                  "B.E",
                  "B.Sc",
                  "BCA",
                  "BBA",
                  "M.Tech",
                  "MBA",
                ]}
              />

              <SelectField
                label="Branch / Specification *"
                value={branch}
                onChange={
                  setBranch
                }
                options={[
                  "CSE",
                  "IT",
                  "ECE",
                  "EEE",
                  "Mechanical",
                  "Civil",
                  "AI & ML",
                  "Data Science",
                ]}
              />

              <SelectField
                label="Year *"
                value={year}
                onChange={
                  setYear
                }
                options={[
                  "Year 1",
                  "Year 2",
                  "Year 3",
                  "Year 4",
                ]}
              />

              <SelectField
                label="Semester *"
                value={
                  semester
                }
                onChange={
                  setSemester
                }
                options={[
                  "Semester 1",
                  "Semester 2",
                  "Semester 3",
                  "Semester 4",
                  "Semester 5",
                  "Semester 6",
                  "Semester 7",
                  "Semester 8",
                ]}
              />

              <SelectField
                label="Scheme"
                value={
                  scheme
                }
                onChange={
                  setScheme
                }
                required={
                  false
                }
                options={[
                  "2021 Scheme",
                  "2025 Scheme",
                  "2026 Scheme",
                ]}
              />

              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <label
                  style={labelStyle}
                >
                  Semester Start Date *
                </label>

                <input
                  type="date"
                  required
                  value={
                    startDate
                  }
                  onChange={(
                    event
                  ) =>
                    setStartDate(
                      event
                        .target
                        .value
                    )
                  }
                  style={
                    fieldStyle
                  }
                />
              </div>

              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <label
                  style={labelStyle}
                >
                  Semester End Date *
                </label>

                <input
                  type="date"
                  required
                  value={
                    endDate
                  }
                  onChange={(
                    event
                  ) =>
                    setEndDate(
                      event
                        .target
                        .value
                    )
                  }
                  style={
                    fieldStyle
                  }
                />
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                gap:
                  "12px",

                marginTop:
                  "8px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                style={secondaryButtonStyle}
              >
                Back
              </button>

              <button
                type="submit"
                style={primaryButtonStyle}
              >
                Create Calendar
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const labelStyle = {
  display:
    "block",

  marginBottom:
    "7px",

  fontWeight:
    500,

  color:
    "#111827",
};

const fieldStyle = {
  width: "100%",

  padding: "11px",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "7px",

  boxSizing:
    "border-box" as const,

  background:
    "#ffffff",
};

const primaryButtonStyle = {
  padding:
    "12px 22px",

  border:
    "none",

  borderRadius:
    "8px",

  background:
    "#4f46e5",

  color:
    "#ffffff",

  fontWeight:
    600,

  cursor:
    "pointer",
};

const secondaryButtonStyle = {
  padding:
    "12px 22px",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "8px",

  background:
    "#ffffff",

  color:
    "#111827",

  fontWeight:
    500,

  cursor:
    "pointer",
};

function SelectField({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  options: string[];

  required?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom:
          "18px",
      }}
    >
      <label
        style={labelStyle}
      >
        {label}
      </label>

      <select
        value={value}
        required={
          required
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        style={
          fieldStyle
        }
      >
        <option value="">
          Select
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  );
}