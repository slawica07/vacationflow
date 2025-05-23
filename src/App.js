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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [vacations, setVacations] = useState({});
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const isMaxReachedForWeek = (day) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
      total += (vacations[dateStr]?.length || 0);
    }
    return total >= 25;
  };

  const addWeekVacation = async (day) => {
    if (isMaxReachedForWeek(day)) {
      setMessage("Nie można dodać urlopu – osiągnięto limit 5 osób na tydzień.");
      return;
    }
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
                  className={`border rounded p-2 min-h-[100px] text-sm relative ${isCurrentMonth ? (getDay(day) >= 5 ? "bg-red-100" : "bg-white") : "bg-gray-100"} ${isTodayClass}`}
                >
                  <div className="font-bold text-xs">{format(day, "d")}</div>
                  <ul className="text-xs">
                    {usersOnDate(day).map((user, index) => (
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                  {isMaxReachedForWeek(day) && <div className="text-red-500 text-xs mt-1">Limit 5 osób na urlopie</div>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600">Aby zarządzać wpisem urlopowym, kliknij w konkretny dzień w kalendarzu.</span>
      </div>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}
