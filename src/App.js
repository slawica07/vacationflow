
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
        setMessage("Błąd podczas odświeżania danych: " + (error?.message || "Nieznany błąd"));
      }
    };
    fetchVacations();
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test połączenia z Supabase</h1>
      <p>Sprawdź, czy dane się załadują poprawnie.</p>
      {message && <p className="text-red-600 mt-4">{message}</p>}
    </div>
  );
}
