import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventStatus } from '../generated/prisma/enums.js';
import type { JwtUser } from '../auth/jwt-user.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

    const aliases: Record<string, string> = {
      UNIVERSITY: 'UNIVERSITY_COLLEGE',
      UNIVERSITY_COLLEGE: 'UNIVERSITY_COLLEGE',
      UNIVERSITY_AND_COLLEGE: 'UNIVERSITY_COLLEGE',

      SKILL_ACADEMY: 'SKILL_ACADEMY',

      BOOTCAMP: 'BOOTCAMP',

      CORPORATE: 'CORPORATE',

      GOVERNMENT: 'GOVERNMENT',
      GOVT: 'GOVERNMENT',

      NGO: 'NGO',
      NONPROFIT: 'NGO',
      NONPROFIT_ORGANIZATION: 'NGO',
      NGO_NONPROFIT_ORGANIZATION: 'NGO',
    };

    return aliases[raw] || raw;
  }

  /*
   * Converts tenant-specific display labels to the canonical backend role.
   *
   * University:
   *   Coordinator / Faculty / Student
   *
   * Skill Academy:
   *   Program Coordinator / Trainer / Learner
   *
   * Bootcamp:
   *   Cohort Coordinator / Instructor / Learner
   *
   * Corporate:
   *   L&D Coordinator / Trainer / Employee
   *
   * Government:
   *   Program Coordinator / Trainer / Employee
   *
   * NGO:
   *   Program Coordinator / Trainer / Volunteer / Learner
   */
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

    if (!raw) {
      return '';
    }

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
      raw === 'TENANT_ADMIN' ||
      raw === 'TENANT_ADMINS' ||
      raw === 'INSTITUTE_ADMIN' ||
      raw === 'INSTITUTE_ADMINS' ||
      raw === 'ACADEMY_ADMIN' ||
      raw === 'ACADEMY_ADMINS' ||
      raw === 'BOOTCAMP_ADMIN' ||
      raw === 'BOOTCAMP_ADMINS' ||
      raw === 'CORPORATE_ADMIN' ||
      raw === 'CORPORATE_ADMINS' ||
      raw === 'DEPARTMENT_ADMIN' ||
      raw === 'DEPARTMENT_ADMINS' ||
      raw === 'NGO_ADMIN' ||
      raw === 'NGO_ADMINS'
    ) {
      return 'TENANT_ADMIN';
    }

    if (
      raw === 'COORDINATOR' ||
      raw === 'COORDINATORS' ||
      raw === 'PROGRAM_COORDINATOR' ||
      raw === 'PROGRAM_COORDINATORS' ||
      raw === 'COHORT_COORDINATOR' ||
      raw === 'COHORT_COORDINATORS' ||
      raw === 'L_AND_D_COORDINATOR' ||
      raw === 'L_AND_D_COORDINATORS' ||
      raw === 'LD_COORDINATOR' ||
      raw === 'LD_COORDINATORS'
    ) {
      return 'COORDINATOR';
    }

    if (
      raw === 'FACULTY' ||
      raw === 'FACULTIES' ||
      raw === 'TRAINER' ||
      raw === 'TRAINERS' ||
      raw === 'INSTRUCTOR' ||
      raw === 'INSTRUCTORS'
    ) {
      return 'FACULTY';
    }

    if (
      raw === 'LEARNER' ||
      raw === 'LEARNERS' ||
      raw === 'STUDENT' ||
      raw === 'STUDENTS' ||
      raw === 'EMPLOYEE' ||
      raw === 'EMPLOYEES' ||
      raw === 'TRAINEE' ||
      raw === 'TRAINEES' ||
      raw === 'VOLUNTEER' ||
      raw === 'VOLUNTEERS' ||
      raw === 'VOLUNTEER_LEARNER' ||
      raw === 'VOLUNTEER_OR_LEARNER'
    ) {
      return 'LEARNER';
    }

    return raw;
  }

  private parseTargetAudience(
    audienceId?: string | null,
  ) {
    const parts = (audienceId || '')
      .split('::')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      return null;
    }

    return {
      tenant: parts[0],
      organization:
        parts.length >= 3
          ? parts.slice(1, -1).join('::')
          : null,
      role: parts[parts.length - 1],
    };
  }

  private getUserIdentity(
    user: JwtUser,
  ) {
    const normalizedUserId =
      (user.userId || '').toUpperCase();

    const tenantFromUserId = (() => {
      const knownTenants = [
        'UNIVERSITY_COLLEGE',
        'SKILL_ACADEMY',
        'BOOTCAMP',
        'CORPORATE',
        'GOVERNMENT',
        'NGO',
      ];

      return (
        knownTenants.find((tenant) =>
          normalizedUserId.endsWith(
            `-${tenant}`,
          ),
        ) || ''
      );
    })();

    return {
      userId: user.userId,
      role: this.normalizeRole(user.role),
      tenantType: this.normalizeTenant(
        user.tenantType ||
          tenantFromUserId,
      ),
    };
  }

  private getPublishAudienceMode(
    audiences:
      | Array<{
          audienceId: string;
          audienceType?: string;
        }>
      | undefined,
  ) {
    if (
      audiences !== undefined &&
      audiences.length === 0
    ) {
      return 'ALL';
    }

    if (!audiences?.length) {
      return undefined;
    }

    const types = audiences.map(
      (audience) =>
        (
          audience.audienceType || ''
        )
          .trim()
          .toUpperCase(),
    );

    if (
      types.every(
        (type) => type === 'TENANT',
      )
    ) {
      return 'TENANT';
    }

    if (
      types.every(
        (type) => type === 'ROLE',
      )
    ) {
      return 'ACTOR';
    }

    if (
      types.every(
        (type) => type === 'TARGET',
      )
    ) {
      const targets = audiences
        .map((audience) =>
          this.parseTargetAudience(
            audience.audienceId,
          ),
        )
        .filter(Boolean);

      if (
        targets.length > 0 &&
        targets.every(
          (target) =>
            target?.organization,
        )
      ) {
        return 'ORGANIZATION_ACTOR';
      }

      return 'TENANT_ACTOR';
    }

    return 'SPECIFIC';
  }

  /*
   * GET EVENTS FOR THE SIGNED-IN USER.
   *
   * Recipient rules:
   * - Creator always sees their own event.
   * - Non-published private states are visible only to creator.
   * - PUBLISHED/CLOSED/CANCELLED with no audience rows = ALL.
   * - TENANT-only rows = tenant match.
   * - ROLE-only rows = actor/role match.
   * - TENANT + ROLE rows = both match.
   * - TARGET Tenant::Actor = exact tenant + actor match.
   * - TARGET Tenant::Organization::Actor =
   *   tenant + actor match, while organization is stored exactly.
   *
   * NOTE:
   * Current JWT contains tenantType + role but no organization identifier.
   * Therefore organization-specific visibility cannot be enforced more
   * narrowly than tenant + actor until organization is added to auth/JWT.
   */
  async findAll(
    user: JwtUser,
  ) {
    const events =
      await this.prisma.event.findMany({
        include: {
          audiences: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    const identity =
      this.getUserIdentity(user);

    return events.filter((event) => {
      if (
        event.createdBy &&
        event.createdBy ===
          identity.userId
      ) {
        return true;
      }

      if (
        event.status !==
          EventStatus.PUBLISHED &&
        event.status !==
          EventStatus.CLOSED &&
        event.status !==
          EventStatus.CANCELLED
      ) {
        return false;
      }

      if (!event.audiences.length) {
        return true;
      }

      const targetAudiences =
        event.audiences.filter(
          (audience) =>
            audience.audienceType
              ?.trim()
              .toUpperCase() ===
            'TARGET',
        );

      if (targetAudiences.length > 0) {
        return targetAudiences.some(
          (audience) => {
            const target =
              this.parseTargetAudience(
                audience.audienceId,
              );

            if (!target) {
              return false;
            }

            const targetRole =
              this.normalizeRole(
                target.role,
              );

            if (
              targetRole !==
              identity.role
            ) {
              return false;
            }

            if (
              identity.role ===
                'PLATFORM_ADMIN' &&
              !identity.tenantType
            ) {
              return true;
            }

            return (
              this.normalizeTenant(
                target.tenant,
              ) ===
              identity.tenantType
            );
          },
        );
      }

      const tenantAudiences =
        event.audiences.filter(
          (audience) =>
            audience.audienceType
              ?.trim()
              .toUpperCase() ===
            'TENANT',
        );

      const roleAudiences =
        event.audiences.filter(
          (audience) =>
            audience.audienceType
              ?.trim()
              .toUpperCase() ===
            'ROLE',
        );

      const tenantMatch =
        tenantAudiences.length === 0
          ? true
          : tenantAudiences.some(
              (audience) =>
                this.normalizeTenant(
                  audience.audienceId,
                ) ===
                identity.tenantType,
            );

      const roleMatch =
        roleAudiences.length === 0
          ? true
          : roleAudiences.some(
              (audience) =>
                this.normalizeRole(
                  audience.audienceId,
                ) ===
                identity.role,
            );

      if (
        tenantAudiences.length > 0 ||
        roleAudiences.length > 0
      ) {
        return (
          tenantMatch &&
          roleMatch
        );
      }

      return false;
    });
  }

  async findOne(
    id: string,
  ) {
    const event =
      await this.prisma.event.findUnique({
        where: {
          id,
        },
        include: {
          audiences: true,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    return event;
  }

  /*
   * CREATE / SAVE / DIRECT PUBLISH.
   *
   * Stores:
   * - who created the event
   * - creator role + tenant
   * - who published it when status=PUBLISHED
   * - publish mode
   * - exact target audience rows
   * - publisher metadata on each audience row
   */
  async create(
    data: CreateEventDto,
    user: JwtUser,
  ) {
    const {
      audiences,
      ...eventData
    } = data;

    const identity =
      this.getUserIdentity(user);

    const isPublishing =
      eventData.status ===
      EventStatus.PUBLISHED;

    const publishedAt =
      isPublishing
        ? new Date()
        : null;

    const publishMode =
      isPublishing
        ? this.getPublishAudienceMode(
            audiences || [],
          )
        : undefined;

    const createdEvent =
      await this.prisma.event.create({
        data: {
          ...eventData,

          status:
            eventData.status ??
            EventStatus.SAVED,

          createdBy:
            identity.userId,
          createdByRole:
            identity.role,
          createdByTenantType:
            identity.tenantType ||
            null,

          publishedAt,

          lastPublishedBy:
            isPublishing
              ? identity.userId
              : null,

          lastPublishedByRole:
            isPublishing
              ? identity.role
              : null,

          lastPublishedByTenantType:
            isPublishing
              ? identity.tenantType ||
                null
              : null,

          lastPublishedAudienceMode:
            isPublishing
              ? publishMode || 'ALL'
              : null,

          audiences:
            audiences?.length
              ? {
                  create:
                    audiences.map(
                      (audience) => ({
                        audienceId:
                          audience.audienceId
                            .trim(),

                        audienceType:
                          audience.audienceType
                            ?.trim()
                            .toUpperCase(),

                        publishedBy:
                          isPublishing
                            ? identity.userId
                            : null,

                        publishedByRole:
                          isPublishing
                            ? identity.role
                            : null,

                        publishedByTenantType:
                          isPublishing
                            ? identity.tenantType ||
                              null
                            : null,

                        publishedAt:
                          isPublishing
                            ? publishedAt
                            : null,
                      }),
                    ),
                }
              : undefined,
        },

        include: {
          audiences: true,
        },
      });

    return createdEvent;
  }

  /*
   * EDIT / PUBLISH / RE-PUBLISH / PAUSE / CLOSE /
   * CANCEL / SCHEDULE.
   *
   * Publishing to additional TARGET rows keeps previous
   * recipients and appends only new recipients.
   */
  async update(
    id: string,
    data: UpdateEventDto,
    user: JwtUser,
  ) {
    const existingEvent =
      await this.findOne(id);

    const {
      audiences,
      ...eventData
    } = data;

    const identity =
      this.getUserIdentity(user);

    const isPublishing =
      eventData.status ===
      EventStatus.PUBLISHED;

    const publishTimestamp =
      isPublishing
        ? new Date()
        : undefined;

    const publishedAt =
      isPublishing
        ? publishTimestamp
        : eventData.status
          ? null
          : undefined;

    const publishMode =
      isPublishing
        ? this.getPublishAudienceMode(
            audiences,
          ) ||
          existingEvent
            .lastPublishedAudienceMode ||
          (
            existingEvent.audiences.length
              ? 'SPECIFIC'
              : 'ALL'
          )
        : undefined;

    let finalAudiences:
      | Array<{
          audienceId: string;
          audienceType?: string;
        }>
      | undefined;

    if (audiences !== undefined) {
      if (audiences.length === 0) {
        finalAudiences = [];
      } else {
        const existingAudienceRows =
          existingEvent.audiences.map(
            (audience) => ({
              audienceId:
                audience.audienceId,
              audienceType:
                audience.audienceType ??
                undefined,
            }),
          );

        const incomingAudienceRows =
          audiences.map(
            (audience) => ({
              audienceId:
                audience.audienceId,
              audienceType:
                audience.audienceType,
            }),
          );

        const uniqueAudiences =
          new Map<
            string,
            {
              audienceId: string;
              audienceType?: string;
            }
          >();

        for (const audience of [
          ...existingAudienceRows,
          ...incomingAudienceRows,
        ]) {
          const audienceId =
            audience.audienceId?.trim();

          if (!audienceId) {
            continue;
          }

          const audienceType =
            audience.audienceType
              ?.trim()
              .toUpperCase() ||
            undefined;

          const key =
            `${audienceType || ''}::${audienceId}`;

          uniqueAudiences.set(
            key,
            {
              audienceId,
              audienceType,
            },
          );
        }

        finalAudiences =
          Array.from(
            uniqueAudiences.values(),
          );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (
          finalAudiences !== undefined
        ) {
          if (
            finalAudiences.length === 0
          ) {
            await tx.eventAudience.deleteMany({
              where: {
                eventId: id,
              },
            });
          } else {
            const incomingAudiences =
              audiences ?? [];

            if (
              incomingAudiences.length >
              0
            ) {
              await tx.eventAudience.createMany({
                data:
                  incomingAudiences
                    .map(
                      (audience) => ({
                        eventId: id,

                        audienceId:
                          audience.audienceId
                            ?.trim(),

                        audienceType:
                          audience.audienceType
                            ?.trim()
                            .toUpperCase() ||
                          undefined,

                        publishedBy:
                          isPublishing
                            ? identity.userId
                            : null,

                        publishedByRole:
                          isPublishing
                            ? identity.role
                            : null,

                        publishedByTenantType:
                          isPublishing
                            ? identity.tenantType ||
                              null
                            : null,

                        publishedAt:
                          isPublishing
                            ? publishTimestamp
                            : null,
                      }),
                    )
                    .filter(
                      (audience) =>
                        !!audience.audienceId,
                    ),

                skipDuplicates: true,
              });
            }
          }
        }

        /*
         * If a scheduled/saved event already had audience rows
         * and is now being published without resending audiences,
         * record publisher metadata on those existing audience rows.
         */
        if (
          isPublishing &&
          audiences === undefined
        ) {
          await tx.eventAudience.updateMany({
            where: {
              eventId: id,
            },
            data: {
              publishedBy:
                identity.userId,
              publishedByRole:
                identity.role,
              publishedByTenantType:
                identity.tenantType ||
                null,
              publishedAt:
                publishTimestamp,
            },
          });
        }

        return tx.event.update({
          where: {
            id,
          },

          data: {
            ...eventData,

            ...(publishedAt !==
            undefined
              ? {
                  publishedAt,
                }
              : {}),

            ...(isPublishing
              ? {
                  lastPublishedBy:
                    identity.userId,

                  lastPublishedByRole:
                    identity.role,

                  lastPublishedByTenantType:
                    identity.tenantType ||
                    null,

                  lastPublishedAudienceMode:
                    publishMode,
                }
              : {}),
          },

          include: {
            audiences: true,
          },
        });
      },
    );
  }

  async removeByDetails(
    data: {
      title: string;
      startDate?: string;
      startTime?: string;
    },
  ) {
    const title =
      data.title?.trim();

    if (!title) {
      throw new NotFoundException(
        'Event title is required',
      );
    }

    const events =
      await this.prisma.event.findMany({
        where: {
          title,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!events.length) {
      throw new NotFoundException(
        'Matching database event not found',
      );
    }

    const normalizedStartDate =
      data.startDate
        ? data.startDate
            .trim()
            .slice(0, 10)
        : null;

    const normalizedStartTime =
      data.startTime
        ? data.startTime
            .trim()
            .toLowerCase()
        : null;

    const matchingEvent =
      events.find((event) => {
        const databaseDate =
          event.startDate
            .toISOString()
            .slice(0, 10);

        const databaseTime =
          (event.startTime || '')
            .trim()
            .toLowerCase();

        const sameDate =
          !normalizedStartDate ||
          databaseDate ===
            normalizedStartDate;

        const sameTime =
          !normalizedStartTime ||
          databaseTime ===
            normalizedStartTime;

        return (
          sameDate &&
          sameTime
        );
      });

    if (!matchingEvent) {
      throw new NotFoundException(
        'Matching database event not found',
      );
    }

    return this.prisma.event.delete({
      where: {
        id: matchingEvent.id,
      },
    });
  }

  async remove(
    id: string,
  ) {
    const event =
      await this.prisma.event.findUnique({
        where: {
          id,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }

    return this.prisma.event.delete({
      where: {
        id,
      },
    });
  }
}
