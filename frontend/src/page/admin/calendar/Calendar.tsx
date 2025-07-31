import { useEffect, useState } from 'react';
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject,
  Resize,
  DragAndDrop,
} from '@syncfusion/ej2-react-schedule';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import type { ScheduleComponent as ScheduleType } from '@syncfusion/ej2-react-schedule';
import type { View } from '@syncfusion/ej2-react-schedule';

import { ListCalendars, CreateCalendar, UpdateCalendar, DeleteCalendar } from '../../../services/index';
import { CalendarInterface } from '../../../interface/ICalendar';

const PropertyPane = (props: any) => <div className="mt-5">{props.children}</div>;

const Scheduler = () => {
  const [scheduleObj, setScheduleObj] = useState<ScheduleType | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const views: View[] = ['Day', 'Week', 'WorkWeek', 'Month', 'Agenda'];

  const loggedInEmployeeID = 1;

  const refreshEvents = async () => {
    const updated = await ListCalendars();
    if (updated) {
      const mapped = updated.map((item) => ({
        Id: item.ID,
        Subject: item.Title,
        Location: item.Location,
        Description: item.Description,
        StartTime: item.StartDate,
        EndTime: item.EndDate,
        CategoryColor: '#1aaa55',
      }));
      setEvents(mapped);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const change = (args: any) => {
    if (scheduleObj) {
      scheduleObj.selectedDate = args.value;
      scheduleObj.dataBind();
    }
  };

  const onDragStart = (arg: any) => {
    arg.navigation.enable = true;
  };

  const handleActionComplete = async (args: any) => {
    if (args.requestType === 'eventCreated') {
      const createdData = Array.isArray(args.data) ? args.data[0] : args.data;

      const newCalendar: CalendarInterface = {
        Title: createdData.Subject,
        Location: createdData.Location || '',
        Description: createdData.Description || '',
        StartDate: createdData.StartTime,
        EndDate: createdData.EndTime,
        EmployeeID: loggedInEmployeeID,
      };

      console.log("📌 newCalendar: ", newCalendar);

      const response = await CreateCalendar(newCalendar);
      if (response) {
        await refreshEvents();
      }
    }

    else if (args.requestType === 'eventChanged') {
      const changedData = Array.isArray(args.data) ? args.data[0] : args.data;

      const updatedCalendar: CalendarInterface = {
        Title: changedData.Subject,
        Location: changedData.Location || '',
        Description: changedData.Description || '',
        StartDate: changedData.StartTime,
        EndDate: changedData.EndTime,
        EmployeeID: loggedInEmployeeID,
      };

      console.log("✏️ updatedCalendar: ", updatedCalendar);

      if (changedData.Id) {
        const updateResponse = await UpdateCalendar(changedData.Id, updatedCalendar);
        if (updateResponse) {
          await refreshEvents();
        }
      }
    }

    else if (args.requestType === 'eventRemoved') {
      const removedData = Array.isArray(args.data) ? args.data[0] : args.data;

      if (removedData.Id) {
        console.log("🗑️ Deleting event with ID:", removedData.Id);
        const deleteResponse = await DeleteCalendar(removedData.Id);
        if (deleteResponse) {
          await refreshEvents();
        }
      }
    }
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl">
      <div className="mb-10">
        <p className="text-lg text-gray-400"> </p>
        <p className="text-3xl font-extrabold tracking-tight text-white px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-500 shadow-md w-fit">
          Calendar
        </p>
      </div>
      <ScheduleComponent
        height="650px"
        ref={(schedule: any) => setScheduleObj(schedule)}
        selectedDate={new Date()}
        eventSettings={{ dataSource: events }}
        dragStart={onDragStart}
        actionComplete={handleActionComplete} // จัดการ create, update, delete
      >
        <ViewsDirective>
          {views.map((item) => (
            <ViewDirective key={item} option={item} />
          ))}
        </ViewsDirective>
        <Inject services={[Day, Week, WorkWeek, Month, Agenda, Resize, DragAndDrop]} />
      </ScheduleComponent>
      <PropertyPane>
        <table style={{ width: '100%', background: 'white' }}>
          <tbody>
            <tr style={{ height: '50px' }}>
              <td style={{ width: '100%' }}>
                <DatePickerComponent
                  value={new Date()}
                  showClearButton={false}
                  placeholder="Current Date"
                  floatLabelType="Always"
                  change={change}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </PropertyPane>
    </div>
  );
};

export default Scheduler;
