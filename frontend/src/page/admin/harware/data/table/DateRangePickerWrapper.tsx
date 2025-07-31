import React from 'react';
import { DateRangePickerComponent } from '@syncfusion/ej2-react-calendars';

interface DateRangePickerWrapperProps {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
}

const DateRangePickerWrapper: React.FC<DateRangePickerWrapperProps> = ({
  value,
  onChange,
}) => {
  return (
    <DateRangePickerComponent
      placeholder="เลือกช่วงวันที่"
      format="dd/MM/yyyy"
      max={new Date()}
      allowEdit={false} // ✅ ใช้อันนี้แทน readonly เพื่อห้ามพิมพ์แต่ยังคลิกได้
      change={(args) => {
        const selected = args.value as Date[] | null;
        if (selected && selected.length === 2) {
          onChange([selected[0], selected[1]]);
        } else {
          onChange([null, null]);
        }
      }}
      value={value?.[0] && value?.[1] ? (value as Date[]) : undefined}
      cssClass="custom-syncfusion-picker w-full"
    />
  );
};

export default DateRangePickerWrapper;
