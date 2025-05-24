
import React, { useState, useEffect } from 'react';
import {
  format, startOfWeek, addDays, getISOWeek, startOfMonth,
  endOfMonth, subMonths, addMonths, getDay, isToday, getMonth
} from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mgcvhwmfidulpptpqiaj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

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

  const handleManualSave = async () => {
    try {
      const all = Object.entries(vacations).flatMap(([date, users]) =>
        users.map(username => ({ date, username }))
      );
      await supabase.from("vacations").delete().not("username", "is", null);
      await supabase.from("vacations").insert(all);
      setMessage("Dane zostały zapisane do bazy danych.");
    } catch (err) {
      console.error(err);
      setMessage("Wystąpił błąd podczas zapisu.");
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kalendarz urlopowy</h1>
      <button onClick={handleManualSave} className="bg-green-200 hover:bg-green-400 px-4 py-1 rounded text-sm">Zapisz</button>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}
