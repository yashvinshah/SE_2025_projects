import React from 'react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  value: 'week' | 'month' | 'year';
  onChange: (range: 'week' | 'month' | 'year') => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  return (
    <div className="date-range-picker">
      <button
        className={`range-btn ${value === 'week' ? 'active' : ''}`}
        onClick={() => onChange('week')}
      >
        Week
      </button>
      <button
        className={`range-btn ${value === 'month' ? 'active' : ''}`}
        onClick={() => onChange('month')}
      >
        Month
      </button>
      <button
        className={`range-btn ${value === 'year' ? 'active' : ''}`}
        onClick={() => onChange('year')}
      >
        Year
      </button>
    </div>
  );
};

export default DateRangePicker;