import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async calendarLogin(
    role: string,
    tenantType?: string,
  ) {
    const normalizedRole =
      this.normalizeRole(role);

    const validRoles = [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'TENANT_ADMIN',
      'COORDINATOR',
      'FACULTY',
      'LEARNER',
    ];

    if (!validRoles.includes(normalizedRole)) {
      throw new BadRequestException(
        'Invalid role',
      );
    }

    const platformRole =
      normalizedRole === 'SUPER_ADMIN' ||
      normalizedRole === 'PLATFORM_ADMIN';

    const normalizedTenant = platformRole
      ? null
      : this.normalizeTenant(tenantType);

    if (
      !platformRole &&
      !normalizedTenant
    ) {
      throw new BadRequestException(
        'Tenant is required for this role',
      );
    }

    const displayTenant =
      normalizedTenant
        ? this.tenantDisplayName(
            normalizedTenant,
          )
        : 'All Tenants';

    const userId =
      normalizedTenant
        ? `calendar-${normalizedRole}-${normalizedTenant}`
        : `calendar-${normalizedRole}`;

    const email =
      normalizedTenant
        ? `${normalizedRole.toLowerCase()}-${normalizedTenant.toLowerCase()}@calendar.local`
        : `${normalizedRole.toLowerCase()}@calendar.local`;

    const accessToken =
      await this.jwtService.signAsync({
        sub: userId,
        email,
        role: normalizedRole,
        tenantType:
          normalizedTenant,
      });

    return {
      accessToken,
      user: {
        id: userId,
        name:
          this.roleDisplayName(
            normalizedRole,
          ),
        email,
        role: normalizedRole,
        tenantType:
          normalizedTenant,
        displayTenant,
      },
    };
  }

  async login(
    _email: string,
    _password: string,
  ) {
    throw new UnauthorizedException(
      'Use calendar login for Calendar Management',
    );
  }

  private normalizeRole(
    value?: string | null,
  ) {
    const raw = (value || '')
      .trim()
      .toUpperCase()
      .replace(/&/g, ' AND ')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (
      raw === 'SUPER_ADMIN' ||
      raw === 'SUPER_ADMINS'
    ) {
      return 'SUPER_ADMIN';
    }

    if (
      raw === 'PLATFORM_ADMIN' ||
      raw === 'PLATFORM_ADMINS'
    ) {
      return 'PLATFORM_ADMIN';
    }

    if (
      [
        'TENANT_ADMIN',
        'TENANT_ADMINS',
        'INSTITUTE_ADMIN',
        'INSTITUTE_ADMINS',
        'UNIVERSITY_ADMIN',
        'UNIVERSITY_ADMINS',
        'COLLEGE_ADMIN',
        'COLLEGE_ADMINS',
        'ACADEMY_ADMIN',
        'ACADEMY_ADMINS',
        'BOOTCAMP_ADMIN',
        'BOOTCAMP_ADMINS',
        'CORPORATE_ADMIN',
        'CORPORATE_ADMINS',
        'COMPANY_ADMIN',
        'COMPANY_ADMINS',
        'HR_ADMIN',
        'HR_ADMINS',
        'L_AND_D_ADMIN',
        'L_AND_D_ADMINS',
        'LD_ADMIN',
        'LD_ADMINS',
        'DEPARTMENT_ADMIN',
        'DEPARTMENT_ADMINS',
        'GOVERNMENT_ADMIN',
        'GOVERNMENT_ADMINS',
        'NGO_ADMIN',
        'NGO_ADMINS',
      ].includes(raw)
    ) {
      return 'TENANT_ADMIN';
    }

    if (
      [
        'COORDINATOR',
        'COORDINATORS',
        'DEPARTMENT_COORDINATOR',
        'DEPARTMENT_COORDINATORS',
        'PROGRAM_COORDINATOR',
        'PROGRAM_COORDINATORS',
        'PROGRAMME_COORDINATOR',
        'PROGRAMME_COORDINATORS',
        'COHORT_COORDINATOR',
        'COHORT_COORDINATORS',
        'TRAINING_COORDINATOR',
        'TRAINING_COORDINATORS',
        'HR_COORDINATOR',
        'HR_COORDINATORS',
        'L_AND_D_COORDINATOR',
        'L_AND_D_COORDINATORS',
        'LD_COORDINATOR',
        'LD_COORDINATORS',
      ].includes(raw)
    ) {
      return 'COORDINATOR';
    }

    if (
      [
        'FACULTY',
        'FACULTIES',
        'TRAINER',
        'TRAINERS',
        'INSTRUCTOR',
        'INSTRUCTORS',
        'MANAGER',
        'MANAGERS',
        'SUPERVISOR',
        'SUPERVISORS',
        'TRAINER_FACILITATOR',
        'TRAINERS_FACILITATORS',
        'FACILITATOR',
        'FACILITATORS',
      ].includes(raw)
    ) {
      return 'FACULTY';
    }

    if (
      [
        'LEARNER',
        'LEARNERS',
        'STUDENT',
        'STUDENTS',
        'EMPLOYEE',
        'EMPLOYEES',
        'TRAINEE',
        'TRAINEES',
        'VOLUNTEER',
        'VOLUNTEERS',
        'OFFICER',
        'OFFICERS',
        'MEMBER',
        'MEMBERS',
        'VOLUNTEER_LEARNER',
        'VOLUNTEER_OR_LEARNER',
      ].includes(raw)
    ) {
      return 'LEARNER';
    }

    return raw;
  }

  private normalizeTenant(
    value?: string | null,
  ) {
    const raw = (value || '')
      .trim()
      .toUpperCase()
      .replace(/&/g, ' AND ')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const aliases: Record<
      string,
      string
    > = {
      UNIVERSITY:
        'UNIVERSITY_COLLEGE',
      COLLEGE:
        'UNIVERSITY_COLLEGE',
      UNIVERSITY_COLLEGE:
        'UNIVERSITY_COLLEGE',
      UNIVERSITY_AND_COLLEGE:
        'UNIVERSITY_COLLEGE',

      SKILL_ACADEMY:
        'SKILL_ACADEMY',
      ACADEMY:
        'SKILL_ACADEMY',

      BOOTCAMP:
        'BOOTCAMP',

      CORPORATE:
        'CORPORATE',
      COMPANY:
        'CORPORATE',

      GOVERNMENT:
        'GOVERNMENT',
      GOVT:
        'GOVERNMENT',

      NGO:
        'NGO',
      NONPROFIT:
        'NGO',
      NONPROFIT_ORGANIZATION:
        'NGO',
      NGO_NONPROFIT_ORGANIZATION:
        'NGO',
    };

    return aliases[raw] || '';
  }

  private tenantDisplayName(
    tenantType: string,
  ) {
    const labels: Record<
      string,
      string
    > = {
      UNIVERSITY_COLLEGE:
        'University & College',
      SKILL_ACADEMY:
        'Skill Academy',
      BOOTCAMP:
        'Bootcamp',
      CORPORATE:
        'Corporate',
      GOVERNMENT:
        'Government',
      NGO:
        'NGO',
    };

    return (
      labels[tenantType] ||
      tenantType
    );
  }

  private roleDisplayName(
    role: string,
  ) {
    const labels: Record<
      string,
      string
    > = {
      SUPER_ADMIN:
        'Super Admin',
      PLATFORM_ADMIN:
        'Platform Admin',
      TENANT_ADMIN:
        'Institute Admin',
      COORDINATOR:
        'Coordinator',
      FACULTY:
        'Faculty',
      LEARNER:
        'Student',
    };

    return labels[role] || role;
  }
}
