"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import "./sidebar.css";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: "/assets/superadminicons/dashboardsquare.svg",
    href: "/dashboard",
  },
  {
    title: "Analytics",
    icon: "/assets/superadminicons/chart.svg",
    href: "/analytics",
  },
  {
    title: "Users",
    icon: "/assets/superadminicons/group.svg",
    href: "/users",
  },
  {
    title: "Tenants",
    icon: "/assets/superadminicons/building.svg",
    href: "/tenants",
  },
  {
    title: "Reports",
    icon: "/assets/superadminicons/trending-down.svg",
    href: "/reports",
  },
  {
    title: "Billing",
    icon: "/assets/superadminicons/creditcard.svg",
    href: "/billing",
  },
  {
    title: "Configuration",
    icon: "/assets/superadminicons/settings.svg",
    href: "/configuration",
  },
  {
    title: "Calendar",
    icon: "/assets/superadminicons/calendar.svg",
    href: "/calendarmanagment",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    try {
      // Close mobile sidebar
      document.body.classList.remove("mobileSidebarOpen");

      // Clear client-side stored login/session information
      localStorage.clear();
      sessionStorage.clear();

      // Move directly to sign-in page
      window.location.replace("/sign_in");
    } catch (error) {
      console.error("Logout failed:", error);

      // Even if storage clearing fails, still redirect
      window.location.replace("/sign_in");
    }
  };

  return (
    <aside
      className={`sidebar ${
        collapsed ? "sidebarCollapsed" : "sidebarExpanded"
      }`}
    >
      <div className="logoArea">
        <Image
          src="/assets/superadminicons/logo.png"
          alt="Neuro LXP"
          width={204}
          height={77}
          className="mainLogo"
          priority
        />
      </div>

      <button
        type="button"
        className="sidebarToggleButton"
        onClick={() => setCollapsed((previous) => !previous)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span
          className={`sidebarToggleIcon ${
            collapsed
              ? "sidebarToggleIconRight"
              : "sidebarToggleIconLeft"
          }`}
          aria-hidden="true"
        >
          <span className="sidebarToggleChevron" />
        </span>
      </button>

      <nav
        className="sidebarNav"
        aria-label="Super admin navigation"
      >
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              href={item.href}
              key={item.title}
              className={`sidebarItem ${
                isActive ? "sidebarItemActive" : ""
              }`}
              title={collapsed ? item.title : undefined}
              onClick={() =>
                document.body.classList.remove(
                  "mobileSidebarOpen"
                )
              }
            >
              <Image
                src={item.icon}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="sidebarIcon"
              />

              <span className="sidebarItemText">
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebarBottom">
        <button
          type="button"
          className="logoutButton"
          title={collapsed ? "Logout" : undefined}
          onClick={handleLogout}
        >
          <Image
            src="/assets/superadminicons/log-out.svg"
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className="sidebarIcon"
          />

          <span className="sidebarItemText">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}