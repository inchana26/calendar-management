export interface CalendarData {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;

  academicYear?: string;
  programme?: string;
  branch?: string;
  year?: string;
  semester?: string;
  scheme?: string;

  startDate?: string;
  endDate?: string;

  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;

  title: string;
  eventType: string;

  startDate: string;
  endDate: string;

  startTime?: string;
  endTime?: string;

  description?: string;
  audience?: string;

  dataPoints?: Record<string, string>;

  color?: string;
}