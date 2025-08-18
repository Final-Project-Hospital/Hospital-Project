import React from 'react';
import { DateRangePickerComponent } from '@syncfusion/ej2-react-calendars';

interface TimeRangeSelectorProps {
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  onChange: (val: any) => void;
  selectedValue: any;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  timeRangeType,
  onChange,
  selectedValue,
}) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const months = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
    { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ];

  const baseStyle =
    "block w-full sm:w-auto rounded-md border border-teal-400 bg-white text-teal-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300";

  if (timeRangeType === 'hour') {
    const formatForInput = (d?: Date) => {
      if (!d) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    const startVal = Array.isArray(selectedValue) ? selectedValue[0] : undefined;
    const endVal = Array.isArray(selectedValue) ? selectedValue[1] : undefined;

    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <input
          type="datetime-local"
          className={baseStyle}
          value={formatForInput(startVal)}
          onChange={(e) => {
            const v = e.target.value ? new Date(e.target.value) : null;
            onChange([v, endVal || v]);
          }}
          max={formatForInput(new Date())}
        />
        <input
          type="datetime-local"
          className={baseStyle}
          value={formatForInput(endVal)}
          onChange={(e) => {
            const v = e.target.value ? new Date(e.target.value) : null;
            onChange([startVal || v, v]);
          }}
          max={formatForInput(new Date())}
        />
      </div>
    );
  }

  if (timeRangeType === 'day') {
    return (
      <DateRangePickerComponent
        placeholder="Select date(s)"
        change={args => onChange(args.value)}
        value={selectedValue}
        max={new Date()}
        cssClass="w-full"
      />
    );
  }

  if (timeRangeType === 'month') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <select
          className={baseStyle}
          value={selectedValue?.month || ''}
          onChange={e => onChange({ ...selectedValue, month: e.target.value })}
        >
          <option value="" disabled>-- Select --</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          className={baseStyle}
          value={selectedValue?.year || ''}
          onChange={e => onChange({ ...selectedValue, year: e.target.value })}
        >
          <option value="" disabled>-- Select --</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  }

  if (timeRangeType === 'year') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <select
          className={baseStyle}
          value={selectedValue?.[0] || ''}
          onChange={e => onChange([+e.target.value, selectedValue?.[1] || +e.target.value])}
        >
          <option value="" disabled>-- Start --</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className={baseStyle}
          value={selectedValue?.[1] || ''}
          onChange={e => onChange([selectedValue?.[0] || +e.target.value, +e.target.value])}
        >
          <option value="" disabled>-- End --</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  }

  return null;
};

export default TimeRangeSelector;
