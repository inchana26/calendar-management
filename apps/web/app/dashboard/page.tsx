"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sidebar/Sidebar";
import "./dashboard.css";

interface LoginData {
  loggedIn: boolean;
  role: string;
  displayRole: string;
  tenantType: string;
  displayTenant: string;
  loginTime: string;
}

const dashboardCards = [
  { title: "Total Users", value: "1,240", icon: "👥" },
  { title: "Courses", value: "24", icon: "🎓" },
  { title: "Assessments", value: "18", icon: "▣" },
  { title: "Calendar Events", value: "12", icon: "▦" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<LoginData | null>(null);

  useEffect(() => {
    const storedLogin = window.localStorage.getItem("calendar_dummy_login");

    if (!storedLogin) {
      router.replace("/sign_in");
      return;
    }

    try {
      const parsedLogin = JSON.parse(storedLogin) as LoginData;

      if (!parsedLogin.loggedIn) {
        router.replace("/sign_in");
        return;
      }

      setUser(parsedLogin);
    } catch {
      window.localStorage.removeItem("calendar_dummy_login");
      router.replace("/sign_in");
    }
  }, [router]);

  if (!user) {
    return (
      <div className="dashboardLoading">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboardPage">
      <div className="dashboardLayout">
        <Sidebar />

        <div className="dashboardMain">
          <header className="dashboardHeader">
            <div className="dashboardHeaderTitle">Dashboard</div>

            <div className="dashboardUser">
              <span className="dashboardAvatar" aria-hidden="true">
                {user.displayRole
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </span>

              <div className="dashboardUserText">
                <strong>{user.displayRole}</strong>
                <span>{user.displayTenant}</span>
              </div>
            </div>
          </header>

          <main className="dashboardContent">
            <section className="dashboardWelcome">
              <div>
                <h1>Welcome to Neuro LXP</h1>
                <p>{user.displayTenant || user.tenantType}</p>
              </div>

              <div className="dashboardRoleChip">
                {user.displayRole}
              </div>
            </section>

            <section className="dashboardCards" aria-label="Dashboard summary">
              {dashboardCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                />
              ))}
            </section>

            <section className="calendarQuickCard">
              <div className="calendarQuickIcon" aria-hidden="true">
                <span className="calendarQuickIconTop" />
                <span className="calendarQuickIconGrid">▦</span>
              </div>

              <div className="calendarQuickContent">
                <p className="calendarQuickEyebrow">Calendar</p>
                <h2>Calendar Management</h2>
                <p>
                  Manage schedules, events, publishing and calendar activities
                  from one place.
                </p>

                <button
                  type="button"
                  className="calendarQuickButton"
                  onClick={() => router.push("/calendarmanagment")}
                >
                  Open Calendar Management
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <article className="dashboardCard">
      <div className="dashboardCardIcon" aria-hidden="true">
        {icon}
      </div>

      <div className="dashboardCardText">
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </article>
  );
}
