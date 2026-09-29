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















  private normalizeTenant(value?: string | null) {







    const raw = (value || '')







      .trim()







      .toUpperCase()







      .replace(/[\s&]+/g, '_')







      .replace(/_+/g, '_');















    const aliases: Record<string, string> = {







      UNIVERSITY: 'UNIVERSITY_COLLEGE',







      UNIVERSITY_COLLEGE: 'UNIVERSITY_COLLEGE',







      SKILL_ACADEMY: 'SKILL_ACADEMY',







      BOOTCAMP: 'BOOTCAMP',







      CORPORATE: 'CORPORATE',







      GOVERNMENT: 'GOVERNMENT',







      NGO: 'NGO',







    };















    return aliases[raw] || raw;







  }















  private normalizeRole(value?: string | null) {







    const raw = (value || '')







      .trim()







      .toUpperCase()







      .replace(/[\s-]+/g, '_');















    if (!raw) return '';















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







      raw === 'INSTITUTE_ADMINS'







    ) {







      return 'TENANT_ADMIN';







    }















    if (







      raw === 'COORDINATOR' ||







      raw === 'COORDINATORS'







    ) {







      return 'COORDINATOR';







    }















    if (







      raw === 'FACULTY' ||







      raw === 'FACULTIES'







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







      raw === 'TRAINEES'







    ) {







      return 'LEARNER';







    }















    return raw;







  }















  /*







   \* GET EVENTS FOR THE SIGNED-IN USER.







   \*







   \* Rules:







   \* 1. No EventAudience rows = DEFAULT publish = visible to everyone.







   \* 2. Explicit audience = BOTH TENANT and ROLE must match.







   \* 3. Creator can still see their own event for management.







   \*







   \* We intentionally do the final matching here because audience values can







   \* currently be stored using UI labels such as "University & College" and







   \* "Faculty", while the JWT uses values such as UNIVERSITY_COLLEGE/FACULTY.







   */







  async findAll(user: JwtUser) {







    const events = await this.prisma.event.findMany({







      include: {







        audiences: true,







      },







      orderBy: {







        createdAt: 'desc',







      },







    });















    // Resolve the recipient identity without any User/Tenant DB table.







    //







    // Preferred source: tenantType carried in the JWT.







    // Safe fallback: the Calendar login userId itself contains the tenant,







    // e.g. calendar-FACULTY-UNIVERSITY_COLLEGE.







    // This also works if an older JwtStrategy returns userId/role but forgets







    // to copy tenantType from the JWT payload.







    const calendarUser = user as JwtUser & {







      userId?: string;







      tenantType?: string | null;







    };















    const normalizedUserId =







      (calendarUser.userId || '').toUpperCase();















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







          normalizedUserId.endsWith(`-${tenant}`),







        ) || ''







      );







    })();















    const signedInTenant =







      this.normalizeTenant(







        calendarUser.tenantType || tenantFromUserId,







      );















    const signedInRole =







      this.normalizeRole(user.role);















    return events.filter((event) => {







      // Publisher always keeps management access.







      if (event.createdBy && event.createdBy === user.userId) {







        return true;







      }















      // DEFAULT publish = no audience rows = visible to everyone.







      if (!event.audiences.length) {







        return true;







      }















      // New exact-pair format:







      // TARGET / "University & College::Faculty"







      // Any number of TARGET rows can belong to the same event.







      const targetAudiences = event.audiences.filter(







        (audience) =>







          audience.audienceType?.trim().toUpperCase() === 'TARGET',







      );















      if (targetAudiences.length > 0) {







        return targetAudiences.some((audience) => {







          const separatorIndex = audience.audienceId.indexOf('::');















          if (separatorIndex < 0) {







            return false;







          }















          const targetTenant = audience.audienceId







            .slice(0, separatorIndex)







            .trim();















          const targetRole = audience.audienceId







            .slice(separatorIndex + 2)







            .trim();















          const normalizedTargetTenant =







            this.normalizeTenant(targetTenant);















          const normalizedTargetRole =







            this.normalizeRole(targetRole);















          const roleMatches =







            normalizedTargetRole === signedInRole;















          if (!roleMatches) {







            return false;







          }















          // PLATFORM_ADMIN is global in the current auth model and its JWT







          // has tenantType = null. If Platform Admin was selected as the







          // actor, the tenant chosen in the Publish UI is assignment context;







          // the global Platform Admin must still receive the event.







          if (







            signedInRole === 'PLATFORM_ADMIN' &&







            !signedInTenant







          ) {







            return true;







          }















          return normalizedTargetTenant === signedInTenant;







        });







      }















      // Backward compatibility for old TENANT + ROLE rows.







      const tenantAudiences = event.audiences.filter(







        (audience) =>







          audience.audienceType?.trim().toUpperCase() === 'TENANT',







      );















      const roleAudiences = event.audiences.filter(







        (audience) =>







          audience.audienceType?.trim().toUpperCase() === 'ROLE',







      );















      if (!tenantAudiences.length || !roleAudiences.length) {







        return false;







      }















      const tenantMatch = tenantAudiences.some(







        (audience) =>







          this.normalizeTenant(audience.audienceId) === signedInTenant,







      );















      const roleMatch = roleAudiences.some(







        (audience) =>







          this.normalizeRole(audience.audienceId) === signedInRole,







      );















      return tenantMatch && roleMatch;







    });







  }















  async findOne(id: string) {







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















  // Create / Save event in database.
  //
  // IMPORTANT:
  // Every POST creates a new Event row.
  // Existing reuse/publish/update/delete logic remains unchanged.
  async create(
    data: CreateEventDto,
    user: JwtUser,
  ) {
    try {
      const {
        audiences,
        ...eventData
      } = data;

      const publishedAt =
        eventData.status === EventStatus.PUBLISHED
          ? new Date()
          : null;

      console.log('====================================');
      console.log('CREATE EVENT REQUEST RECEIVED');
      console.log('Title:', eventData.title);
      console.log('Start Date:', eventData.startDate);
      console.log('End Date:', eventData.endDate);
      console.log('Created By:', user.userId);
      console.log('====================================');

      const createdEvent = await this.prisma.event.create({
        data: {
          ...eventData,

          status:
            eventData.status ??
            EventStatus.SAVED,

          createdBy:
            user.userId,

          publishedAt,

          audiences:
            audiences?.length
              ? {
                  create:
                    audiences.map((audience) => ({
                      audienceId:
                        audience.audienceId,

                      audienceType:
                        audience.audienceType,
                    })),
                }
              : undefined,
        },

        include: {
          audiences: true,
        },
      });

      console.log('====================================');
      console.log('EVENT SAVED TO POSTGRESQL');
      console.log('DATABASE EVENT ID:', createdEvent.id);
      console.log('TITLE:', createdEvent.title);
      console.log('STATUS:', createdEvent.status);
      console.log('====================================');

      return createdEvent;
    } catch (error) {
      console.error('====================================');
      console.error('FAILED TO SAVE EVENT TO POSTGRESQL');
      console.error(error);
      console.error('====================================');

      throw error;
    }
  }

  // Edit event / Publish / Pause / Close / Schedule.







  async update(







    id: string,







    data: UpdateEventDto,







  ) {







    const existingEvent = await this.findOne(id);















    const {







      audiences,







      ...eventData







    } = data;















    const publishedAt =







      eventData.status === EventStatus.PUBLISHED







        ? new Date()







        : eventData.status







          ? null







          : undefined;















    // IMPORTANT:







    // undefined = do not touch audiences







    // []        = DEFAULT publish, clear all specific audiences







    // TARGET[]  = append new Tenant + Actor pairs to existing pairs







    //







    // This lets the same event be published repeatedly to N different







    // Tenant + Actor pairs without deleting the previous recipients.







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







        const existingAudienceRows = existingEvent.audiences.map(







          (audience) => ({







            audienceId: audience.audienceId,







            audienceType: audience.audienceType ?? undefined,







          }),







        );















        const incomingAudienceRows = audiences.map(







          (audience) => ({







            audienceId: audience.audienceId,







            audienceType: audience.audienceType,







          }),







        );















        // Deduplicate by type + id so publishing the same pair again







        // never violates @@unique([eventId, audienceId]).







        const uniqueAudiences = new Map<







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







          const audienceId = audience.audienceId?.trim();















          if (!audienceId) {







            continue;







          }















          const audienceType =







            audience.audienceType?.trim().toUpperCase() || undefined;















          const key = `${audienceType || ''}::${audienceId}`;















          uniqueAudiences.set(key, {







            audienceId,







            audienceType,







          });







        }















        finalAudiences = Array.from(uniqueAudiences.values());







      }







    }















    return this.prisma.$transaction(async (tx) => {



      /*



       \* Audience persistence rules:



       \* - audiences === undefined : leave existing audience rows unchanged.



       \* - audiences === []        : Default publish; clear specific targets.



       \* - audiences has TARGETs   : append the new exact Tenant::Actor pairs.



       \*



       \* We DO NOT delete previous TARGET rows for a specific publish.



       \* That is what allows the same Event to be published to N recipients.



       */



      if (finalAudiences !== undefined) {



        if (finalAudiences.length === 0) {



          await tx.eventAudience.deleteMany({



            where: {



              eventId: id,



            },



          });



        } else {



          const incomingAudiences = audiences ?? [];







          if (incomingAudiences.length > 0) {



            await tx.eventAudience.createMany({



              data: incomingAudiences



                .map((audience) => ({



                  eventId: id,



                  audienceId: audience.audienceId?.trim(),



                  audienceType:



                    audience.audienceType?.trim().toUpperCase() || undefined,



                }))



                .filter((audience) => !!audience.audienceId),



              skipDuplicates: true,



            });



          }



        }



      }







      return tx.event.update({



        where: {



          id,



        },



        data: {



          ...eventData,



          ...(publishedAt !== undefined



            ? {



                publishedAt,



              }



            : {}),



        },



        include: {



          audiences: true,



        },



      });



    });



  }







  // Fallback delete when frontend does not have backendId.







  async removeByDetails(data: {







    title: string;







    startDate?: string;







    startTime?: string;







  }) {







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

  // Normal delete using PostgreSQL Event ID.

  async remove(id: string) {

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
