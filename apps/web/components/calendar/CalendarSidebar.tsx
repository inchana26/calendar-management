"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { storageService } from "@/features/calendar/services/storage.service";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },

  {
    title: "Analytics",
    href: "/analytics",
  },

  {
    title: "Users",
    href: "/users",
  },

  {
    title: "Courses",
    href: "/courses",
  },

  {
    title: "Instructors",
    href: "/instructors",
  },

  {
    title: "Tenants",
    href: "/tenants",
  },

  {
    title: "Assessment",
    href: "/assessment",
  },

  {
    title: "Certificate",
    href: "/certificate",
  },

  {
    title: "Reports",
    href: "/reports",
  },

  {
    title: "Billing",
    href: "/billing",
  },

  {
    title: "Configuration",
    href: "/configuration",
  },

  {
    title: "Calendar Management",
    href: "/calendar-management",
  },
];

export default function CalendarSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    // Clear every login/session key used by the dummy sign-in flow.
    // Keep calendars and events intact.
    storageService.removeCurrentUser();

    localStorage.removeItem(
      "calendar_dummy_login"
    );

    localStorage.removeItem(
      "calendar_current_role"
    );

    localStorage.removeItem(
      "calendar_current_tenant"
    );

    router.replace("/sign_in");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: "250px",
        minWidth: "250px",
        height: "100vh",
        position: "sticky",
        top: 0,

        display: "flex",
        flexDirection: "column",

        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
          }}
        >
          Neuro LXP
        </h2>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "18px 12px",

          display: "flex",
          flexDirection: "column",

          gap: "5px",
          overflowY: "auto",
        }}
      >
        {sidebarItems.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`
            );

          return (
            <Link
              key={item.title}
              href={item.href}
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                textDecoration: "none",

                fontSize: "15px",

                fontWeight:
                  active
                    ? 600
                    : 400,

                color:
                  active
                    ? "#4338ca"
                    : "#111827",

                background:
                  active
                    ? "#eef2ff"
                    : "transparent",
              }}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "14px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "11px",

            background: "#ffffff",

            border:
              "1px solid #d1d5db",

            borderRadius: "8px",

            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}