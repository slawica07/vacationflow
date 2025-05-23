// ...importy bez zmian
import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  getISOWeek,
  getYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  getDay,
  isToday,
  getMonth
} from "date-fns";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgcvhwmfidulpptpqiaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // skrócony dla czytelności
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [vacations, setVacations] = useState({});
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    const fetchVacations = async () => {
      const { data, error } = await supabase.from('vacations').select('*');
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

  const usersOnDate = (date) => vacations[format(date, "yyyy-MM-dd")] || [];

  const addWeekVacation = async (day) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    const name = prompt("Podaj swoje imię:");
    if (!name) return;
    const entries = Array.from({ length: 5 }, (_, i) => ({
      date: format(addDays(weekStart, i), "yyyy-MM-dd"),
      username: name
    }));
    await supabase.from('vacations').insert(entries);
    const updated = { ...vacations };
    entries.forEach(({ date, username }) => {
      updated[date] = [...(updated[date] || []), username];
    });
    setVacations(updated);
    setMessage("Urlop dodany na tydzień.");
  };

  const editVacation = async (day) => {
    const adminPass = prompt("Podaj hasło administratora:");
    if (adminPass !== "Capital1234") return setMessage("Nieprawidłowe hasło.");
    const name = prompt("Podaj nowe imię:");
    const dateStr = format(day, "yyyy-MM-dd");
    if (!name) return;
    await supabase.from('vacations').delete().eq('date', dateStr);
    await supabase.from('vacations').insert([{ date: dateStr, username: name }]);
    const updated = { ...vacations, [dateStr]: [name] };
    setVacations(updated);
    setMessage("Edytowano wpis urlopowy.");
  };

  const deleteVacation = async (day) => {
    const adminPass = prompt("Podaj hasło administratora:");
    if (adminPass !== "Capital1234") return setMessage("Nieprawidłowe hasło.");
    const name = prompt("Podaj imię do usunięcia:");
    const dateStr = format(day, "yyyy-MM-dd");
    if (!name) return;
    await supabase.from('vacations').delete().eq('date', dateStr).eq('username', name);
    const updated = { ...vacations };
    updated[dateStr] = (updated[dateStr] || []).filter(u => u !== name);
    if (updated[dateStr].length === 0) delete updated[dateStr];
    setVacations(updated);
    setMessage("Wpis usunięty.");
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startWeekday = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const weeks = [];
  let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  while (weekStart <= monthEnd) {
    weeks.push(weekStart);
    weekStart = addDays(weekStart, 7);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kalendarz urlopowy – {format(selectedDate, "LLLL yyyy")}</h1>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">◀ Poprzedni</button>
        <span className="text-lg font-semibold">{format(selectedDate, "LLLL yyyy")}</span>
        <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="px-3 py-1 bg-gray-200 rounded">Następny ▶</button>
      </div>
      <div className="grid grid-cols-8 gap-2">
        <div className="font-bold">Tydz.</div>
        {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"].map((d, i) => (
          <div key={i} className="font-bold text-center">{d}</div>
        ))}
        {weeks.map((weekStartDate, wi) => (
          <React.Fragment key={wi}>
            <div className="text-center font-semibold border rounded bg-blue-50">{getISOWeek(weekStartDate)}</div>
            {Array.from({ length: 7 }).map((_, i) => {
              const day = addDays(weekStartDate, i);
              const isCurrentMonth = getMonth(day) === getMonth(selectedDate);
              const isTodayClass = isToday(day) ? "ring ring-blue-500 ring-offset-2" : "";
              return (
                <div
                  key={i}
                  className={`border rounded p-2 min-h-[100px] text-sm relative ${isCurrentMonth ? "bg-white" : "bg-gray-100"} ${isTodayClass}`}
                >
                  <div className="font-bold text-xs">{format(day, "d")}</div>
                  <ul className="text-xs">
                    {usersOnDate(day).map((user, index) => (
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                  <div className="absolute bottom-1 left-1 right-1 flex gap-1 flex-wrap">
                    <button onClick={() => addWeekVacation(day)} className="bg-blue-100 hover:bg-blue-300 text-xs px-1 rounded">Dodaj</button>
                    <button onClick={() => editVacation(day)} className="bg-yellow-100 hover:bg-yellow-300 text-xs px-1 rounded">Edytuj</button>
                    <button onClick={() => deleteVacation(day)} className="bg-red-100 hover:bg-red-300 text-xs px-1 rounded">Usuń</button>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}