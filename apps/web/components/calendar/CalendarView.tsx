"use client";

import FullCalendar from "@fullcalendar/react";

import dayGridPlugin from "@fullcalendar/daygrid";

import timeGridPlugin from "@fullcalendar/timegrid";

import interactionPlugin from "@fullcalendar/interaction";


import type { CalendarEvent } from "@/features/calendar/types/calendar.types";

interface CalendarViewProps {
  events?: CalendarEvent[];

  canEdit: boolean;

  onDateClick?: (
    date: string
  ) => void;

  onEventClick?: (
    event: CalendarEvent
  ) => void;

  onEventMove?: (
    eventId: string,
    startDate: string,
    endDate: string
  ) => void;
}

function addOneDay(
  dateString: string
) {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() + 1
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function subtractOneDay(
  dateString: string
) {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() - 1
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getEventStyle(eventIndex: number) {
  // Golden-angle hue spacing gives every event a different color
  // without being limited to a fixed palette.
  const hue = (eventIndex * 137.508) % 360;

  return {
    background: "#ffffff",
    border: `hsl(${hue}, 72%, 45%)`,
    text: `hsl(${hue}, 72%, 32%)`,
  };
}

export default function CalendarView({
  events = [],
  canEdit,
  onDateClick,
  onEventClick,
  onEventMove,
}: CalendarViewProps) {
  const safeEvents =
    Array.isArray(events)
      ? events
      : [];

  const fullCalendarEvents =
    safeEvents.map(
      (event, eventIndex) => {
        const eventStyle =
          getEventStyle(eventIndex);

        const isTimed =
          Boolean(
            event.startTime
          );

        if (isTimed) {
          return {
            id: event.id,

            title:
              event.title,

            start: `${event.startDate}T${event.startTime}`,

            end: undefined,

            backgroundColor:
              eventStyle.background,

            borderColor:
              eventStyle.border,

            textColor:
              eventStyle.text,

            extendedProps: {
              originalEvent:
                event,
            },
          };
        }

        return {
          id: event.id,

          title:
            event.title,

          start:
            event.startDate,

          end: undefined,

          allDay: true,

          backgroundColor:
            eventStyle.background,

          borderColor:
            eventStyle.border,

          textColor:
            eventStyle.text,

          extendedProps: {
            originalEvent:
              event,
          },
        };
      }
    );

  return (
    <div
      style={{
        background:
          "#ffffff",

        border:
          "1px solid #e5e7eb",

        borderRadius:
          "12px",

        padding:
          "20px",
      }}
    >
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        initialView="dayGridMonth"
        headerToolbar={{
          left:
            "today prev,next",

          center:
            "title",

          right:
            "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today:
            "Today",

          month:
            "Month",

          week:
            "Week",

          day:
            "Day",
        }}
        events={
          fullCalendarEvents
        }
        selectable={
          canEdit
        }
        editable={
          canEdit
        }
        eventStartEditable={
          canEdit
        }
        eventDurationEditable={
          canEdit
        }
        dayMaxEventRows={3}
        moreLinkClick="popover"
        eventDisplay="block"
        eventContent={(eventInfo) => {
          const originalEvent =
            eventInfo.event.extendedProps
              .originalEvent as CalendarEvent;

          const scheduleText = [
            `Start: ${originalEvent.startDate}${
              originalEvent.startTime
                ? ` ${originalEvent.startTime}`
                : ""
            }`,
            `End: ${originalEvent.endDate}${
              originalEvent.endTime
                ? ` ${originalEvent.endTime}`
                : ""
            }`,
          ].join(" • ");

          return (
          <div
            title={scheduleText}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              minWidth: 0,
              padding: "1px 3px",
              fontSize: "12px",
              lineHeight: "18px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: eventInfo.event.borderColor,
                flexShrink: 0,
              }}
            />

            {eventInfo.timeText && (
              <strong
                style={{
                  flexShrink: 0,
                  fontSize: "11px",
                }}
              >
                {eventInfo.timeText}
              </strong>
            )}

            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {eventInfo.event.title}
            </span>
          </div>
          );
        }}
        weekends={
          true
        }
        height="auto"
        dateClick={(
          info
        ) => {
          if (
            !canEdit
          ) {
            return;
          }

          onDateClick?.(
            info.dateStr
          );
        }}
        eventMouseEnter={(info) => {
          const originalEvent =
            info.event.extendedProps
              .originalEvent as CalendarEvent;

          const calendarRoot =
            info.el.closest(
              ".fc"
            ) as HTMLElement | null;

          if (
            !calendarRoot ||
            !originalEvent.startDate ||
            !originalEvent.endDate
          ) {
            return;
          }

          calendarRoot
            .querySelectorAll(
              '[data-calendar-hover-span="true"]'
            )
            .forEach((element) =>
              element.remove()
            );

          // Use only MONTH-view day cells.
          // This prevents duplicate date elements from causing
          // the line to start/end on the wrong date.
          const dayCells =
            Array.from(
              calendarRoot.querySelectorAll(
                ".fc-daygrid-day[data-date]"
              )
            ) as HTMLElement[];

          const startCell =
            dayCells.find(
              (cell) =>
                cell.dataset.date ===
                originalEvent.startDate
            );

          const endCell =
            dayCells.find(
              (cell) =>
                cell.dataset.date ===
                originalEvent.endDate
            );

          if (!startCell || !endCell) {
            return;
          }

          const parseDate = (
            value: string
          ) => {
            const [year, month, day] =
              value
                .split("-")
                .map(Number);

            return Date.UTC(
              year,
              month - 1,
              day
            );
          };

          const startValue =
            parseDate(
              originalEvent.startDate
            );

          const endValue =
            parseDate(
              originalEvent.endDate
            );

          if (endValue < startValue) {
            return;
          }

          const cellsInRange =
            dayCells.filter((cell) => {
              const value =
                cell.dataset.date;

              if (!value) {
                return false;
              }

              const dateValue =
                parseDate(value);

              return (
                dateValue >= startValue &&
                dateValue <= endValue
              );
            });

          if (!cellsInRange.length) {
            return;
          }

          // The overlay is positioned against FullCalendar itself.
          const previousPosition =
            calendarRoot.style.position;

          if (
            getComputedStyle(
              calendarRoot
            ).position === "static"
          ) {
            calendarRoot.style.position =
              "relative";
          }

          const rootRect =
            calendarRoot.getBoundingClientRect();

          const hoveredRect =
            info.el.getBoundingClientRect();

          const startCellRect =
            startCell.getBoundingClientRect();

          // Keep the line at the same vertical position as
          // the exact event being hovered.
          const firstRowOffset =
            hoveredRect.top -
            startCellRect.top +
            hoveredRect.height / 2;

          // Group the exact date cells by calendar week row.
          const rows =
            new Map<
              number,
              HTMLElement[]
            >();

          cellsInRange.forEach(
            (cell) => {
              const rect =
                cell.getBoundingClientRect();

              const rowKey =
                Math.round(rect.top);

              const row =
                rows.get(rowKey) || [];

              row.push(cell);
              rows.set(rowKey, row);
            }
          );

          rows.forEach((cells) => {
            cells.sort(
              (a, b) =>
                a.getBoundingClientRect()
                  .left -
                b.getBoundingClientRect()
                  .left
            );

            const firstCell =
              cells[0];

            const lastCell =
              cells[
                cells.length - 1
              ];

            const firstRect =
              firstCell.getBoundingClientRect();

            const lastRect =
              lastCell.getBoundingClientRect();

            const segment =
              document.createElement(
                "div"
              );

            segment.dataset.calendarHoverSpan =
              "true";

            segment.style.position =
              "absolute";
            segment.style.pointerEvents =
              "none";
            segment.style.zIndex = "20";
            segment.style.height = "3px";
            segment.style.borderRadius =
              "999px";
            segment.style.background =
              info.event.borderColor ||
              "#2563eb";

            // Exact left edge of the START date for the first row,
            // and exact first in-range date for following rows.
            segment.style.left =
              `${
                firstRect.left -
                rootRect.left +
                4
              }px`;

            // Exact right edge of the END date for the final row,
            // and exact last in-range date for preceding rows.
            segment.style.width =
              `${Math.max(
                4,
                lastRect.right -
                  firstRect.left -
                  8
              )}px`;

            segment.style.top =
              `${
                firstRect.top -
                rootRect.top +
                firstRowOffset
              }px`;

            calendarRoot.appendChild(
              segment
            );
          });

          calendarRoot.dataset
            .hoverPreviousPosition =
            previousPosition;
        }}
        eventMouseLeave={(info) => {
          const calendarRoot =
            info.el.closest(
              ".fc"
            ) as HTMLElement | null;

          if (!calendarRoot) {
            return;
          }

          calendarRoot
            .querySelectorAll(
              '[data-calendar-hover-span="true"]'
            )
            .forEach((element) =>
              element.remove()
            );

          const previousPosition =
            calendarRoot.dataset
              .hoverPreviousPosition;

          if (
            previousPosition !==
            undefined
          ) {
            calendarRoot.style.position =
              previousPosition;

            delete calendarRoot.dataset
              .hoverPreviousPosition;
          }
        }}
        eventClick={(
          info
        ) => {
          const originalEvent =
            info.event
              .extendedProps
              .originalEvent as CalendarEvent;

          onEventClick?.(
            originalEvent
          );
        }}
        eventDrop={(
          info
        ) => {
          if (
            !canEdit
          ) {
            info.revert();

            return;
          }

          const startDate =
            info.event
              .startStr
              .slice(0, 10);

          let endDate =
            startDate;

          if (
            info.event.endStr
          ) {
            const rawEnd =
              info.event
                .endStr
                .slice(
                  0,
                  10
                );

            endDate =
              info.event
                .allDay
                ? subtractOneDay(
                    rawEnd
                  )
                : rawEnd;
          }

          onEventMove?.(
            info.event.id,
            startDate,
            endDate
          );
        }}
      />
    </div>
  );
}