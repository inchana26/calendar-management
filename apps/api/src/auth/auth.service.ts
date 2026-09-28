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

  /*
   * Calendar Management intentionally does not own User/Tenant tables.
   * The selected role + tenant are carried in the JWT for audience matching.
   */
  async calendarLogin(
    role: string,
    tenantType?: string,
  ) {
    const normalizedRole = (role || '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    const validRoles = [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'TENANT_ADMIN',
      'COORDINATOR',
      'FACULTY',
      'LEARNER',
    ];

    if (!validRoles.includes(normalizedRole)) {
      throw new BadRequestException('Invalid role');
    }

    const platformRole =
      normalizedRole === 'SUPER_ADMIN' ||
      normalizedRole === 'PLATFORM_ADMIN';

    const normalizedTenant = platformRole
      ? null
      : this.normalizeTenant(tenantType);

    if (!platformRole && !normalizedTenant) {
      throw new BadRequestException(
        'Tenant is required for this role',
      );
    }

    const displayTenant =
      normalizedTenant
        ? this.tenantDisplayName(normalizedTenant)
        : 'All Tenants';

    const userId = normalizedTenant
      ? `calendar-${normalizedRole}-${normalizedTenant}`
      : `calendar-${normalizedRole}`;

    const email = normalizedTenant
      ? `${normalizedRole.toLowerCase()}-${normalizedTenant.toLowerCase()}@calendar.local`
      : `${normalizedRole.toLowerCase()}@calendar.local`;

    /*
     * IMPORTANT:
     * tenantType must be in the JWT because EventsService uses
     * tenantType + role to match EventAudience TARGET rows.
     */
    const accessToken =
      await this.jwtService.signAsync({
        sub: userId,
        email,
        role: normalizedRole,
        tenantType: normalizedTenant,
      });

    return {
      accessToken,
      user: {
        id: userId,
        name: this.roleDisplayName(normalizedRole),
        email,
        role: normalizedRole,
        tenantType: normalizedTenant,
        displayTenant,
      },
    };
  }

  /*
   * Kept so the existing /auth/login route still compiles.
   * Calendar Management uses /auth/calendar-login.
   */
  async login(
    _email: string,
    _password: string,
  ) {
    throw new UnauthorizedException(
      'Use calendar login for Calendar Management',
    );
  }

  private normalizeTenant(
    value?: string | null,
  ) {
    const raw = (value || '')
      .trim()
      .toUpperCase()
      .replace(/[&\s-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const aliases: Record<string, string> = {
      UNIVERSITY: 'UNIVERSITY_COLLEGE',
      UNIVERSITY_COLLEGE: 'UNIVERSITY_COLLEGE',
      SKILL_ACADEMY: 'SKILL_ACADEMY',
      BOOTCAMP: 'BOOTCAMP',
      CORPORATE: 'CORPORATE',
      GOVERNMENT: 'GOVERNMENT',
      NGO: 'NGO',
    };

    return aliases[raw] || '';
  }

  private tenantDisplayName(
    tenantType: string,
  ) {
    const labels: Record<string, string> = {
      UNIVERSITY_COLLEGE: 'University & College',
      SKILL_ACADEMY: 'Skill Academy',
      BOOTCAMP: 'Bootcamp',
      CORPORATE: 'Corporate',
      GOVERNMENT: 'Government',
      NGO: 'NGO',
    };

    return labels[tenantType] || tenantType;
  }

  private roleDisplayName(
    role: string,
  ) {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PLATFORM_ADMIN: 'Platform Admin',
      TENANT_ADMIN: 'Institute Admin',
      COORDINATOR: 'Coordinator',
      FACULTY: 'Faculty',
      LEARNER: 'Student',
    };

    return labels[role] || role;
  }
}
