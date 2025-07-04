import React from 'react';
import { DateRangePickerComponent } from '@syncfusion/ej2-react-calendars';

interface TimeRangeSelectorProps {
  timeRangeType: 'day' | 'month' | 'year';
  onChange: (val: any) => void;
  selectedValue: any;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ timeRangeType, onChange, selectedValue }) => {
  if (timeRangeType === 'day') {
    return (
      <DateRangePickerComponent
        placeholder="Select date range"
        change={(args) => onChange(args.value)}
        value={selectedValue}
        max={new Date()}
      />
    );
  } else if (timeRangeType === 'month') {
    const months = [
      '01', '02', '03', '04', '05', '06',
      '07', '08', '09', '10', '11', '12',
    ];
    const years = [2023, 2024, 2025];

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={selectedValue?.month || ''}
          onChange={e => onChange({ ...selectedValue, month: e.target.value })}
        >
          <option value="">Select Month</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={selectedValue?.year || ''}
          onChange={e => onChange({ ...selectedValue, year: e.target.value })}
        >
          <option value="">Select Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  } else if (timeRangeType === 'year') {
    const years = [2023, 2024, 2025];
    return (
      <select
        value={selectedValue || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select Year</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    );
  }
  return null;
};

export default TimeRangeSelector;
