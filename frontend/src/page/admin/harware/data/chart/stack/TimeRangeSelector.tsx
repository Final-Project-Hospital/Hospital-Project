import React from 'react';
import { DateRangePickerComponent } from '@syncfusion/ej2-react-calendars';

interface TimeRangeSelectorProps {
  timeRangeType: 'day' | 'month' | 'year';
  onChange: (val: any) => void;
  selectedValue: any;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  timeRangeType,
  onChange,
  selectedValue,
}) => {
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
  } else if (timeRangeType === 'month') {
    const months = [
      '01', '02', '03', '04', '05', '06',
      '07', '08', '09', '10', '11', '12',
    ];
    const years = [2023, 2024, 2025, 2026];
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <select
          className="block w-full sm:w-auto rounded border px-2 py-1"
          value={selectedValue?.month || ''}
          onChange={e => onChange({ ...selectedValue, month: e.target.value })}
        >
          <option value="">Month</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          className="block w-full sm:w-auto rounded border px-2 py-1"
          value={selectedValue?.year || ''}
          onChange={e => onChange({ ...selectedValue, year: e.target.value })}
        >
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  } else if (timeRangeType === 'year') {
    const years = [2023, 2024, 2025, 2026];
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <select
          className="block w-full sm:w-auto rounded border px-2 py-1"
          value={selectedValue?.[0] || ''}
          onChange={e => onChange([+e.target.value, selectedValue?.[1] || +e.target.value])}
        >
          <option value="">Start Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="hidden sm:inline-block self-center">-</span>
        <select
          className="block w-full sm:w-auto rounded border px-2 py-1"
          value={selectedValue?.[1] || ''}
          onChange={e => onChange([selectedValue?.[0] || +e.target.value, +e.target.value])}
        >
          <option value="">End Year</option>
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
