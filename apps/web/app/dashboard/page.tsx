"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CalendarSidebar from "@/components/calendar/CalendarSidebar";

interface LoginData {
  loggedIn: boolean;
  role: string;
  displayRole: string;
  tenantType: string;
  displayTenant: string;
  loginTime: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<LoginData | null>(null);

  useEffect(() => {
    const storedLogin =
      localStorage.getItem(
        "calendar_dummy_login"
      );

    if (!storedLogin) {
      router.replace("/sign_in");
      return;
    }

    try {
      const parsedLogin =
        JSON.parse(
          storedLogin
        ) as LoginData;

      if (!parsedLogin.loggedIn) {
        router.replace("/sign_in");
        return;
      }

      setUser(parsedLogin);
    } catch {
      localStorage.removeItem(
        "calendar_dummy_login"
      );

      router.replace("/sign_in");
    }
  }, [router]);

  if (!user) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <CalendarSidebar />

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <header
          style={{
            height: "70px",
            padding: "0 30px",
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",

            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              margin: 0,
            }}
          >
            Dashboard
          </h3>

          <div>
            <strong>
              {user.displayRole}
            </strong>
            {" | "}
            {user.displayTenant}
          </div>
        </header>

        <main
          style={{
            padding: "30px",
          }}
        >
          <h1
            style={{
              marginBottom: "5px",
            }}
          >
            Welcome to Neuro LXP
          </h1>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            {user.displayTenant || user.tenantType}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap: "20px",
              marginTop: "30px",
            }}
          >
            <DashboardCard
              title="Total Users"
              value="1,240"
            />

            <DashboardCard
              title="Courses"
              value="24"
            />

            <DashboardCard
              title="Assessments"
              value="18"
            />

            <DashboardCard
              title="Calendar Events"
              value="12"
            />
          </div>

          <div
            style={{
              marginTop: "30px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "25px",
            }}
          >
            <h2>
              Calendar Management
            </h2>

            <p>
              Click{" "}
              <strong>
                Calendar Management
              </strong>{" "}
              from the left sidebar to open the calendar.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "22px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          marginBottom: 0,
        }}
      >
        {value}
      </h2>
    </div>
  );
}