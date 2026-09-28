import { storageService } from "./storage.service";

import type {
  CalendarData,
  CalendarEvent,
} from "../types/calendar.types";

export const calendarService = {
  // =========================================
  // GET USER CALENDAR
  // =========================================

  getCalendarForUser(
    userId: string,
    tenantId: string
  ): CalendarData | null {
    const calendars = storageService.getCalendars();

    return (
      calendars.find(
        (calendar) =>
          calendar.ownerId === userId &&
          calendar.tenantId === tenantId
      ) || null
    );
  },

  // =========================================
  // GET TENANT CALENDAR
  // =========================================

  getCalendarForTenant(
    tenantId: string
  ): CalendarData | null {
    const calendars = storageService.getCalendars();

    return (
      calendars.find(
        (calendar) =>
          calendar.tenantId === tenantId
      ) || null
    );
  },

  // =========================================
  // CREATE CALENDAR
  // =========================================

  createCalendar(
    data: Omit<
      CalendarData,
      "id" | "createdAt"
    >
  ): CalendarData {
    const calendars = storageService.getCalendars();

    const newCalendar: CalendarData = {
      ...data,

      id: `calendar-${Date.now()}`,

      createdAt: new Date().toISOString(),
    };

    calendars.push(newCalendar);

    storageService.saveCalendars(calendars);

    return newCalendar;
  },

  // =========================================
  // UPDATE CALENDAR
  // =========================================

  updateCalendar(
    calendarId: string,
    data: Partial<CalendarData>
  ): CalendarData | null {
    const calendars = storageService.getCalendars();

    const calendarIndex = calendars.findIndex(
      (calendar) =>
        calendar.id === calendarId
    );

    if (calendarIndex === -1) {
      return null;
    }

    calendars[calendarIndex] = {
      ...calendars[calendarIndex],
      ...data,
      id: calendars[calendarIndex].id,
      createdAt: calendars[calendarIndex].createdAt,
    };

    storageService.saveCalendars(calendars);

    return calendars[calendarIndex];
  },

  // =========================================
  // DELETE CALENDAR
  // =========================================

  deleteCalendar(
    calendarId: string
  ): boolean {
    const calendars = storageService.getCalendars();

    const calendarExists = calendars.some(
      (calendar) =>
        calendar.id === calendarId
    );

    if (!calendarExists) {
      return false;
    }

    storageService.saveCalendars(
      calendars.filter(
        (calendar) =>
          calendar.id !== calendarId
      )
    );

    const remainingEvents =
      storageService.getEvents().filter(
        (event) =>
          event.calendarId !== calendarId
      );

    storageService.saveEvents(
      remainingEvents
    );

    return true;
  },

  // =========================================
  // GET EVENTS
  // =========================================

  getEvents(
    calendarId: string
  ): CalendarEvent[] {
    const events = storageService.getEvents();

    return events.filter(
      (event) =>
        event.calendarId === calendarId
    );
  },

  // =========================================
  // GET EVENTS VISIBLE TO CURRENT ROLE
  // =========================================

  getVisibleEvents(
    calendarId: string,
    role: string,
    tenantId: string
  ): CalendarEvent[] {
    const events = storageService.getEvents();
    const calendars = storageService.getCalendars();

    const audienceMatchesRole = (
      audience?: string
    ) => {
      if (!audience) return false;
      if (audience === "All Allowed Users") return true;

      if (audience === "Platform Admins") {
        return role === "PLATFORM_ADMIN";
      }

      if (
        [
          "Institute Admins",
          "Skill Academy Admins",
          "Bootcamp Admins",
          "Corporate Admins",
        ].includes(audience)
      ) {
        return role === "TENANT_ADMIN";
      }

      if (audience === "Coordinators") {
        return role === "COORDINATOR";
      }

      if (
        [
          "Faculty",
          "Trainers",
          "Instructors / Mentors",
        ].includes(audience)
      ) {
        return role === "FACULTY";
      }

      if (
        [
          "Students",
          "Skill Academy Learners",
          "Bootcamp Learners",
          "Employees",
        ].includes(audience)
      ) {
        return role === "LEARNER";
      }

      // Compatibility with already-saved older events.
      if (audience === "Admins") {
        return [
          "SUPER_ADMIN",
          "PLATFORM_ADMIN",
          "TENANT_ADMIN",
        ].includes(role);
      }
      if (audience === "Faculty / Trainers") {
        return role === "FACULTY";
      }
      if (audience === "Learners / Employees") {
        return role === "LEARNER";
      }

      return false;
    };

    return events.filter((event) => {
      // The creator/owner calendar always sees its own events.
      if (event.calendarId === calendarId) {
        return true;
      }

      const status =
        (event as CalendarEvent & {
          status?: string;
        }).status;

      // Other role calendars see only published events.
      if (status !== "PUBLISHED") {
        return false;
      }

      if (!audienceMatchesRole(event.audience)) {
        return false;
      }

      const sourceCalendar =
        calendars.find(
          (item) =>
            item.id === event.calendarId
        );

      if (!sourceCalendar) {
        return false;
      }

      // Institute/coordinator/faculty publications stay in
      // the same tenant. Platform publications can reach all.
      return (
        sourceCalendar.tenantId === "ALL" ||
        sourceCalendar.tenantId === tenantId
      );
    });
  },

  // =========================================
  // CREATE EVENT
  // =========================================

  createEvent(
    data: Omit<CalendarEvent, "id">
  ): CalendarEvent {
    const events = storageService.getEvents();

    const newEvent: CalendarEvent = {
      ...data,

      id: `event-${Date.now()}`,
    };

    events.push(newEvent);

    storageService.saveEvents(events);

    return newEvent;
  },

  // =========================================
  // UPDATE EVENT
  // =========================================

  updateEvent(
    eventId: string,
    data: Partial<CalendarEvent>
  ): CalendarEvent | null {
    const events = storageService.getEvents();

    const eventIndex = events.findIndex(
      (event) =>
        event.id === eventId
    );

    if (eventIndex === -1) {
      return null;
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...data,
    };

    storageService.saveEvents(events);

    return events[eventIndex];
  },

  // =========================================
  // DELETE EVENT
  // =========================================

  deleteEvent(
    eventId: string
  ): boolean {
    const events = storageService.getEvents();

    const eventExists = events.some(
      (event) =>
        event.id === eventId
    );

    if (!eventExists) {
      return false;
    }

    const remainingEvents = events.filter(
      (event) =>
        event.id !== eventId
    );

    storageService.saveEvents(
      remainingEvents
    );

    return true;
  },
};