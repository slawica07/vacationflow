
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

  const isMaxReachedForWeek = (day) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
      total += (vacations[dateStr]?.length || 0);
    }
    return total >= 35;
  };

  const addWeekVacation = async (day, action) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });

    if (action === 'd') {
      if (isMaxReachedForWeek(day)) {
        setMessage("Nie można dodać urlopu – osiągnięto limit 5 osób na tydzień.");
        return;
      }
      const name = prompt("Podaj swoje imię:");
      if (!name || !/^[A-Za-zÀ-ÿ\- ]{2,}$/.test(name)) {
        setMessage("Nieprawidłowe imię.");
        return;
      }
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
      setMessage("Urlop dodany na tydzień.");
    } else if (action === 'u') {
      const pass = prompt("Podaj hasło administratora:");
      if (pass !== "Capital1234") {
        setMessage("Nieprawidłowe hasło.");
        return;
      }
      const name = prompt("Podaj imię do usunięcia:");
      if (!name) return;
      const deletions = Array.from({ length: 7 }, (_, i) =>
        supabase.from('vacations')
          .delete()
          .eq('date', format(addDays(weekStart, i), "yyyy-MM-dd"))
          .eq('username', name)
      );
      await Promise.all(deletions);
      const updated = { ...vacations };
      for (let i = 0; i < 7; i++) {
        const d = format(addDays(weekStart, i), "yyyy-MM-dd");
        if (updated[d]) {
          updated[d] = updated[d].filter(u => u !== name);
          if (updated[d].length === 0) delete updated[d];
        }
      }
      setVacations(updated);
      await supabase.from("vacations").delete().not("username", "is", null);
      const all = Object.entries(updated).flatMap(([date, users]) => users.map(username => ({ date, username })));
      await supabase.from("vacations").insert(all);
      setMessage("Usunięto urlop dla: " + name);
    }
  };

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

  const handleRefresh = async () => {
    const { data, error } = await supabase.from("vacations").select("*");
    if (data) {
      const grouped = {};
      data.forEach(({ date, username }) => {
        grouped[date] = grouped[date] ? [...grouped[date], username] : [username];
      });
      setVacations(grouped);
      setMessage("Dane odświeżone z bazy.");
    } else {
      setMessage("Błąd podczas odświeżania danych.");
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
              const isWeekend = getDay(day) === 6 || getDay(day) === 0;
              return (
                <div
                  key={i}
                  onClick={() => setActiveDay(format(day, "yyyy-MM-dd"))}
                  className={`cursor-pointer border rounded p-2 min-h-[100px] text-sm relative ${isCurrentMonth ? (isWeekend ? "bg-red-100" : "bg-white") : "bg-gray-100"} ${isTodayClass}`}
                >
                  <div className="font-bold text-xs">{format(day, "d")}</div>
                  <ul className="text-xs">
                    {usersOnDate(day).map((user, index) => (
                      <li key={index} className="font-bold">{user}</li>
                    ))}
                  </ul>
                  {isMaxReachedForWeek(day) && <div className="text-red-500 text-xs mt-1">Limit 5 osób</div>}
                  {activeDay === format(day, "yyyy-MM-dd") && (
                    <div className="mt-2 flex flex-col gap-1">
                      <button onClick={() => addWeekVacation(day, 'd')} className="bg-blue-100 hover:bg-blue-300 text-xs rounded px-2 py-1">Dodaj urlop</button>
                      <button onClick={() => addWeekVacation(day, 'u')} className="bg-red-100 hover:bg-red-300 text-xs rounded px-2 py-1">Usuń</button>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <button onClick={handleManualSave} className="bg-green-200 hover:bg-green-400 px-4 py-1 rounded text-sm">Zapisz</button>
        <button onClick={handleRefresh} className="bg-blue-200 hover:bg-blue-400 px-4 py-1 rounded text-sm">Odśwież</button>
        <span className="text-sm text-gray-600">Kliknij w dzień, aby zarządzać wpisem urlopowym.</span>
      </div>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
    </div>
  );
}
