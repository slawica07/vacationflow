import React, { useState, useEffect } from 'react';
import {
  format, startOfWeek, addDays, getISOWeek, startOfMonth,
  endOfMonth, subMonths, addMonths, getDay, isToday, getMonth
} from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://mgcvhwmfidulpptpqiaj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

export default function App() {
  const [vacations, setVacations] = useState({});
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
  const fetchVacations = async () => {
    const { data, error } = await supabase.from("vacations").select("*");
    if (data) {
      const grouped = {};
      data.forEach(({ date, username }) => {
        grouped[date] = grouped[date] ? [...grouped[date], username] : [username];
      });
      setVacations(grouped);
    } else if (error) {
      console.error(error);
    }
  };
  fetchVacations();
}, []);

// ... pozostała część kodu skopiowana z dokumentu
}