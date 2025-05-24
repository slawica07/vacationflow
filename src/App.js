
import React, { useState, useEffect } from 'react';
import {
  format, startOfWeek, addDays, getISOWeek, startOfMonth,
  endOfMonth, subMonths, addMonths, getDay, isToday, getMonth
} from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mgcvhwmfidulpptpqiaj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nY3Zod21maWR1bHBwdHBxaWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjQzMzYsImV4cCI6MjA2MzYwMDMzNn0.SbqnXvDVVsUiz6C74i58vcn-FIefX3TXTfYWj8Ark8A'
);

export default function App() {
  const [vacations, setVacations] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [message, setMessage] = useState("");

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    const { data, error } = await supabase.from("vacations").select("*");
    if (error) {
      setMessage("Błąd: " + error.message);
    } else {
      const grouped = {};
      data.forEach(({ date, username }) => {
        grouped[date] = grouped[date] ? [...grouped[date], username] : [username];
      });
      setVacations(grouped);
      setMessage("Wczytano " + data.length + " wpisów urlopowych.");
    }
  };

  const addVacation = async (day) => {
    const name = prompt("Podaj swoje imię:");
    if (!name || name.length < 2) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const { error } = await supabase.from("vacations").insert([{ date: dateStr, username: name }]);
    if (!error) {
      const updated = { ...vacations };
      updated[dateStr] = [...(updated[dateStr] || []), name];
      setVacations(updated);
      setMessage("Dodano urlop.");
    } else {
      setMessage("Błąd: " + error.message);
    }
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const weeks = [];
  let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  while (weekStart <= monthEnd) {
    weeks.push(weekStart);
    weekStart = addDays(weekStart, 7);
  }

  const usersOnDate = (date) => vacations[format(date, "yyyy-MM-dd")] || [];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Kalendarz urlopowy – {format(selectedDate, "LLLL yyyy")}</h1>
      <div className="flex justify-between mb-4">
        <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">◀</button>
        <span>{format(selectedDate, "LLLL yyyy")}</span>
        <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"].map((d, i) => (
          <div key={i} className="font-bold text-center">{d}</div>
        ))}
        {weeks.map((ws, i) => (
          <React.Fragment key={i}>
            {Array.from({ length: 7 }).map((_, j) => {
              const day = addDays(ws, j);
              const isWeekend = getDay(day) === 6 || getDay(day) === 0;
              const bg = isWeekend ? "bg-red-100" : "bg-white";
              return (
                <div
                  key={j}
                  onClick={() => addVacation(day)}
                  className={`border p-2 rounded text-xs cursor-pointer ${bg}`}
                >
                  <div className="font-semibold">{format(day, "d")}</div>
                  <ul>
                    {usersOnDate(day).map((u, idx) => (
                      <li key={idx} className="font-bold">{u}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-4 text-sm text-green-600">{message}</p>
    </div>
  );
}
