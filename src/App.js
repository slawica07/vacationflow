
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
  const [activeDay, setActiveDay] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchVacations();
  }, []);

  const fetchVacations = async () => {
    const { data, error } = await supabase.from("vacations").select("*");
    if (error) {
      setMessage("Błąd: " + error.message);
    } else {
      const grouped = {};
      data.forEach(({ date, username }) => {
        grouped[date] = grouped[date] ? [...grouped[date], username] : [username];
      });
      setVacations(grouped);
    }
  };

  
const addWeekVacation = async (day) => {
    // Sprawdzenie limitu 5 osób na tydzień
    const start = startOfWeek(day, { weekStartsOn: 1 });
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = format(addDays(start, i), "yyyy-MM-dd");
      total += (vacations[dateStr]?.length || 0);
    }
    if (total >= 35) {
      setMessage("Nie można dodać urlopu – osiągnięto limit 5 osób na tydzień.");
      return;
    }

    const name = prompt("Podaj swoje imię:");
    if (!name || name.length < 2) return;
    const entries = Array.from({ length: 7 }, (_, i) => ({
      date: format(addDays(start, i), "yyyy-MM-dd"),
      username: name
    }));
    await supabase.from("vacations").insert(entries);
    const updated = { ...vacations };
    entries.forEach(({ date, username }) => {
      updated[date] = [...(updated[date] || []), username];
    });
    setVacations(updated);
    setMessage("Urlop dodany na tydzień.");
};

    const name = prompt("Podaj swoje imię:");
    if (!name || name.length < 2) return;
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    const entries = Array.from({ length: 7 }, (_, i) => ({
      date: format(addDays(weekStart, i), "yyyy-MM-dd"),
      username: name
    }));
    await supabase.from("vacations").insert(entries);
    const updated = { ...vacations };
    entries.forEach(({ date, username }) => {
      updated[date] = [...(updated[date] || []), username];
    });
    setVacations(updated);
    setMessage("Dodano urlop dla tygodnia.");
  };

  const deleteWeekVacation = async (day) => {
    const pass = prompt("Podaj hasło administratora:");
    if (pass !== "Capital1234") return alert("Nieprawidłowe hasło.");
    const name = prompt("Podaj imię do usunięcia:");
    if (!name || name.length < 2) return;
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
      await supabase.from("vacations")
        .delete()
        .eq("date", dateStr)
        .eq("username", name);
    }
    fetchVacations();
    setMessage("Usunięto urlop.");
  };

  const handleSave = async () => {
    const all = Object.entries(vacations).flatMap(([date, users]) =>
      users.map(username => ({ date, username }))
    );
    await supabase.from("vacations").delete().not("username", "is", null);
    await supabase.from("vacations").insert(all);
    setMessage("Dane zapisane.");
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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kalendarz urlopowy – {format(selectedDate, "LLLL yyyy")}</h1>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">◀ Poprzedni</button>
        <span className="text-lg font-semibold">{format(selectedDate, "LLLL yyyy")}</span>
        <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">Następny ▶</button>
      </div>
      <div className="grid grid-cols-8 gap-2">
        <div className="font-bold text-center">Tydz.</div>
        {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"].map((d, i) => (
          <div key={i} className="font-bold text-center">{d}</div>
        ))}
        {weeks.map((weekStartDate, wi) => (
          <React.Fragment key={wi}>
            <div className="text-center font-semibold border rounded bg-blue-50">{getISOWeek(weekStartDate)}</div>
            {Array.from({ length: 7 }).map((_, i) => {
              const day = addDays(weekStartDate, i);
              const isWeekend = getDay(day) === 6 || getDay(day) === 0;
              const isTodayClass = isToday(day) ? "ring ring-blue-500 ring-offset-2" : "";
              const bg = isWeekend ? "bg-red-100" : "bg-white";
              return (
                <div
                  key={i}
                  onClick={() => setActiveDay(format(day, "yyyy-MM-dd") === activeDay ? null : format(day, "yyyy-MM-dd"))}
                  className={`cursor-pointer border rounded p-2 min-h-[100px] text-sm relative ${bg} ${isTodayClass}`}
                >
                  <div className="font-bold text-xs">{format(day, "d")}</div>
                  <ul className="text-xs">
                    {usersOnDate(day).map((user, index) => (
                      <li key={index} className="font-bold">{user}</li>
                    ))}
                  </ul>
                  {activeDay === format(day, "yyyy-MM-dd") && (
                    <div className="mt-2 flex flex-col gap-1">
                      <button onClick={() => addWeekVacation(day)} className="bg-blue-100 hover:bg-blue-300 text-xs rounded px-2 py-1">Dodaj urlop</button>
                      <button onClick={() => deleteWeekVacation(day)} className="bg-red-100 hover:bg-red-300 text-xs rounded px-2 py-1">Usuń urlop</button>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button onClick={async () => {
          const all = Object.entries(vacations).flatMap(([date, users]) =>
            users.map(username => ({ date, username }))
          );
          await supabase.from("vacations").delete().not("username", "is", null);
          await supabase.from("vacations").insert(all);
          setMessage("Dane zapisane.");
        }} className="bg-green-200 hover:bg-green-400 px-4 py-1 rounded text-sm">Zapisz</button>
        <button onClick={fetchVacations} className="bg-blue-200 hover:bg-blue-400 px-4 py-1 rounded text-sm">Odśwież</button>
      </div>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}
