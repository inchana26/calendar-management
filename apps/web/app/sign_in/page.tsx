"use client";

import Image from "next/image";
import { useState } from "react";
import "./signin.css";

/* ========================================
   ROLE OPTIONS
======================================== */

const ROLE_OPTIONS = [
  {
    label: "Super Admin",
    value: "SUPER_ADMIN",
  },
  {
    label: "Platform Admin",
    value: "PLATFORM_ADMIN",
  },
  {
    label: "Institute Admin",
    value: "TENANT_ADMIN",
  },
  {
    label: "Coordinator",
    value: "COORDINATOR",
  },
  {
    label: "Faculty",
    value: "FACULTY",
  },
  {
    label: "Student",
    value: "LEARNER",
  },
];

/* ========================================
   CURRENTLY CONNECTED TENANTS
======================================== */

const TENANT_OPTIONS = [
  {
    label: "University & College",
    value: "UNIVERSITY",
  },
  {
    label: "Skill Academy",
    value: "SKILL_ACADEMY",
  },
  {
    label: "Bootcamp",
    value: "BOOTCAMP",
  },
  {
    label: "Corporate",
    value: "CORPORATE",
  },
  {
    label: "Government",
    value: "GOVERNMENT",
  },
  {
    label: "NGO",
    value: "NGO",
  },
];

export default function LoginPage() {
  const [role, setRole] = useState("");
  const [tenantType, setTenantType] = useState("");

  /* ========================================
     SUPER ADMIN / PLATFORM ADMIN
     DO NOT REQUIRE A TENANT
  ======================================== */

  const isPlatformLevelRole =
    role === "SUPER_ADMIN" ||
    role === "PLATFORM_ADMIN";

  /* ========================================
     ROLE CHANGE
  ======================================== */

  const handleRoleChange = (value: string) => {
    setRole(value);

    /*
      Super Admin and Platform Admin
      work across all tenants.
    */
    if (
      value === "SUPER_ADMIN" ||
      value === "PLATFORM_ADMIN"
    ) {
      setTenantType("");
    }
  };

  /* ========================================
     LOGIN VALIDATION
  ======================================== */

  const loginDisabled =
    !role ||
    (!isPlatformLevelRole && !tenantType);

  /* ========================================
     LOGIN
  ======================================== */

  const handleLogin = async () => {
    if (!role) {
      alert("Please select a role.");
      return;
    }

    if (!isPlatformLevelRole && !tenantType) {
      alert("Please select a tenant.");
      return;
    }

    const selectedRole = ROLE_OPTIONS.find(
      (item) => item.value === role
    );

    const selectedTenant = TENANT_OPTIONS.find(
      (item) => item.value === tenantType
    );

    try {
      /* ========================================
         BACKEND LOGIN
      ======================================== */

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/auth/calendar-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            tenantType: isPlatformLevelRole
              ? undefined
              : tenantType,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        alert(
          errorData?.message ||
            "Login failed."
        );

        return;
      }

      const backendLogin =
        (await response.json()) as {
          accessToken: string;
          user: {
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

      /* ========================================
         KEEP EXISTING LOGIN DATA
      ======================================== */

      const loginData = {
        loggedIn: true,
        role,
        displayRole:
          selectedRole?.label || role,
        tenantType: isPlatformLevelRole
          ? "ALL"
          : tenantType,
        displayTenant: isPlatformLevelRole
          ? "All Tenants"
          : selectedTenant?.label || tenantType,
        loginTime: new Date().toISOString(),
      };

      console.log(
        "LOGIN SUCCESS:",
        loginData
      );

      /* ========================================
         KEEP EXISTING LOGIN STORAGE
      ======================================== */

      localStorage.setItem(
        "calendar_dummy_login",
        JSON.stringify(loginData)
      );

      localStorage.setItem(
        "calendar_current_role",
        role
      );

      localStorage.setItem(
        "calendar_current_tenant",
        loginData.tenantType
      );

      /* ========================================
         BACKEND AUTHENTICATION STORAGE
      ======================================== */

      localStorage.setItem(
        "calendar_access_token",
        backendLogin.accessToken
      );

      localStorage.setItem(
        "calendar_auth_user",
        JSON.stringify(backendLogin.user)
      );

      /* ========================================
         NAVIGATE TO DASHBOARD
      ======================================== */

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(
        "Calendar backend login failed:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  };

  return (
    <main className="loginPage">
      <section
        className="loginCard"
        aria-labelledby="login-title"
      >
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

        <h1
          id="login-title"
          className="loginTitle"
        >
          NeuroLXP
        </h1>

        <p className="loginSubtitle">
          Select your role and tenant
        </p>

        <div className="loginForm">
          {/* ROLE */}

          <div className="loginField">
            <label htmlFor="role">
              Role
            </label>

            <div className="loginSelectWrap">
              <select
                id="role"
                value={role}
                onChange={(event) =>
                  handleRoleChange(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Role
                </option>

                {ROLE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <span
                className="loginSelectArrow"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* TENANT */}

          {role &&
            !isPlatformLevelRole && (
              <div className="loginField">
                <label htmlFor="tenant">
                  Tenant
                </label>

                <div className="loginSelectWrap">
                  <select
                    id="tenant"
                    value={tenantType}
                    onChange={(event) =>
                      setTenantType(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Tenant
                    </option>

                    {TENANT_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  <span
                    className="loginSelectArrow"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

          {/* PLATFORM ROLE INFORMATION */}

          {isPlatformLevelRole && (
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
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
            Login
          </button>
        </div>
      </section>
    </main>
  );
}
