"use client";

import Image from "next/image";
import { useState } from "react";
import "./signin.css";

/* ========================================
   ROLE OPTIONS
======================================== */

const ROLE_OPTIONS = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Platform Admin", value: "PLATFORM_ADMIN" },
  { label: "Institute Admin", value: "TENANT_ADMIN" },
  { label: "Coordinator", value: "COORDINATOR" },
  { label: "Faculty", value: "FACULTY" },
  { label: "Student", value: "LEARNER" },
];

/* ========================================
   CURRENTLY CONNECTED TENANTS
======================================== */

const TENANT_OPTIONS = [
  { label: "University & College", value: "UNIVERSITY" },
  { label: "Skill Academy", value: "SKILL_ACADEMY" },
  { label: "Bootcamp", value: "BOOTCAMP" },
  { label: "Corporate", value: "CORPORATE" },
  { label: "Government", value: "GOVERNMENT" },
  { label: "NGO", value: "NGO" },
];

/*
 * Local role/tenant selection is a DEMO session, not real authentication.
 * npm run dev: demo by default so the selector works without an API.
 * Set NEXT_PUBLIC_CALENDAR_LOGIN_MODE=backend to require backend authentication.
 * npm run build/start: backend mode is always required for security.
 */
const USE_LOCAL_DEMO_LOGIN =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_CALENDAR_LOGIN_MODE !== "backend";

type BackendLoginResponse = {
  accessToken?: string;
  message?: string | string[];
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    active?: boolean;
    tenantId?: string | null;
    departmentId?: string | null;
    tenant?: unknown;
    department?: unknown;
  };
};

function readableLoginMessage(message: BackendLoginResponse["message"]): string {
  if (Array.isArray(message)) return message.join(" ");
  return typeof message === "string" ? message : "";
}

export default function LoginPage() {
  const [role, setRole] = useState("");
  const [tenantType, setTenantType] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  /* ========================================
     SUPER ADMIN / PLATFORM ADMIN
     DO NOT REQUIRE A TENANT
  ======================================== */

  const isPlatformLevelRole =
    role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN";

  /* ========================================
     ROLE CHANGE
  ======================================== */

  const handleRoleChange = (value: string) => {
    setRole(value);
    setLoginError("");

    if (value === "SUPER_ADMIN" || value === "PLATFORM_ADMIN") {
      setTenantType("");
    }
  };

  /* ========================================
     LOGIN VALIDATION
  ======================================== */

  const loginDisabled =
    !role || (!isPlatformLevelRole && !tenantType) || isLoggingIn;

  /* ========================================
     LOGIN
  ======================================== */

  const handleLogin = async () => {
    if (isLoggingIn) return;

    if (!role) {
      setLoginError("Please select a role.");
      return;
    }

    if (!isPlatformLevelRole && !tenantType) {
      setLoginError("Please select a tenant.");
      return;
    }

    const selectedRole = ROLE_OPTIONS.find((item) => item.value === role);
    const selectedTenant = TENANT_OPTIONS.find(
      (item) => item.value === tenantType
    );

    setLoginError("");
    setIsLoggingIn(true);

    /* Keep the existing role, tenant labels, and storage contract intact. */
    const loginData = {
      loggedIn: true,
      role,
      displayRole: selectedRole?.label || role,
      tenantType: isPlatformLevelRole ? "ALL" : tenantType,
      displayTenant: isPlatformLevelRole
        ? "All Tenants"
        : selectedTenant?.label || tenantType,
      loginTime: new Date().toISOString(),
    };

    try {
      /*
       * Development-only demo selector: role + tenant work even if the
       * calendar API is not installed/running. NEVER fabricate an API token.
       * Backend event operations still require a real authenticated API.
       */
      if (USE_LOCAL_DEMO_LOGIN) {
        localStorage.setItem("calendar_dummy_login", JSON.stringify(loginData));
        localStorage.setItem("calendar_current_role", role);
        localStorage.setItem("calendar_current_tenant", loginData.tenantType);
        localStorage.removeItem("calendar_access_token");
        localStorage.removeItem("calendar_auth_user");
        window.location.href = "/dashboard";
        return;
      }

      /* ========================================
         BACKEND LOGIN VIA SAME-ORIGIN PROXY
         Avoid browser CORS failures. This proxy
         forwards to the configured backend.
      ======================================== */

      const response = await fetch("/api/calendar-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          role,
          ...(isPlatformLevelRole ? {} : { tenantType }),
        }),
      });

      const backendLogin: BackendLoginResponse | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setLoginError(
          readableLoginMessage(backendLogin?.message) ||
            `Calendar login failed (HTTP ${response.status}).`
        );
        return;
      }

      /* Never treat a missing token or user as a successful login. */
      if (!backendLogin?.accessToken || !backendLogin.user) {
        setLoginError(
          "The backend returned an incomplete login response (missing accessToken or user)."
        );
        return;
      }

      /* ========================================
         KEEP EXISTING LOGIN STORAGE
      ======================================== */

      localStorage.setItem("calendar_dummy_login", JSON.stringify(loginData));
      localStorage.setItem("calendar_current_role", role);
      localStorage.setItem("calendar_current_tenant", loginData.tenantType);

      /* ========================================
         BACKEND AUTHENTICATION STORAGE
      ======================================== */

      localStorage.setItem("calendar_access_token", backendLogin.accessToken);
      localStorage.setItem("calendar_auth_user", JSON.stringify(backendLogin.user));

      /* ========================================
         NAVIGATE TO DASHBOARD
      ======================================== */

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Calendar login request failed:", error);
      setLoginError(
        USE_LOCAL_DEMO_LOGIN
          ? "Could not save the local demo session. Check browser storage permissions."
          : "Unable to contact the login service. Check that the Next.js app and calendar backend are running."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="loginPage">
      <section className="loginCard" aria-labelledby="login-title">
        {/* LOGO */}
        <div className="loginLogoWrap">
          <Image
            src="/images/logo.png"
            alt="NeuroLXP"
            width={146}
            height={146}
            className="loginLogo"
            priority
          />
        </div>

        {/* TITLE */}
        <h1 id="login-title" className="loginTitle">
          NeuroLXP
        </h1>

        <p className="loginSubtitle">Select your role and tenant</p>

        <div className="loginForm">
          {/* TENANT */}
          {!isPlatformLevelRole && (
            <div className="loginField">
              <label htmlFor="tenant">Tenant</label>
              <div className="loginSelectWrap">
                <select
                  id="tenant"
                  value={tenantType}
                  onChange={(event) => {
                    setTenantType(event.target.value);
                    setLoginError("");
                  }}
                >
                  <option value="">Select Tenant</option>
                  {TENANT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="loginSelectArrow" aria-hidden="true" />
              </div>
            </div>
          )}

          {/* ROLE */}
          <div className="loginField">
            <label htmlFor="role">Role</label>
            <div className="loginSelectWrap">
              <select
                id="role"
                value={role}
                onChange={(event) => handleRoleChange(event.target.value)}
              >
                <option value="">Select Role</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="loginSelectArrow" aria-hidden="true" />
            </div>
          </div>

          {/* PLATFORM ROLE INFORMATION */}
          {isPlatformLevelRole && (
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              This role has access to all tenants.
            </p>
          )}

          {/* LOGIN */}
          <button
            type="button"
            className="loginButton"
            disabled={loginDisabled}
            onClick={handleLogin}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>

          {/* Visible only when backend login fails; existing CSS unchanged. */}
          {loginError && (
            <p role="alert" style={{ margin: "10px 0 0", color: "#b42318", fontSize: "13px", lineHeight: 1.5 }}>
              {loginError}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
