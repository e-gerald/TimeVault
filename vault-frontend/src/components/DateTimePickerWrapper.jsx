import React from 'react';
import DateTimePicker from 'react-datetime-picker';
import '../styles/datetimepicker.css';

export default function DateTimePickerWrapper({ value, onChange }) {
  return (
    <DateTimePicker
      onChange={onChange}
      value={value}
      format="y-MM-dd h:mm a"
      disableClock={false}
      clearIcon={null}
      calendarIcon={null}
      className="w-full"
    />
  );
}
