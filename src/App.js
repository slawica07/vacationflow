import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  getISOWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  getDay,
  isToday,
  getMonth
} from "date-fns";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mgcvhwmfidulpptpqiaj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    for (let i = 0; i < 5; i++) {
      const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
      total += vacations[dateStr]?.length || 0;
    }
    return total >= 25;
  };

  const addWeekVacation = async (day, action) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    const dateStr = format(day, "yyyy-MM-dd");

    if (action === "d") {
      if (isMaxReachedForWeek(day)) {
        setMessage("Nie można dodać urlopu – osiągnięto limit 5 osób na tydzień.");
        return;
      }
      const name = prompt("Podaj swoje imię:");
      if (!name || !/^[A-Za-zÀ-ÿ\- ]{2,}$/.test(name)) {
        setMessage("Nieprawidłowe imię. Użyj tylko liter i minimum 2 znaków.");
        return;
      }
      const entries = Array.from({ length: 5 }, (_, i) => ({
        date: format(addDays(weekStart, i), "yyyy-MM-dd"),
        username: name,
      }));
      await supabase.from("vacations").insert(entries);
      const updated = { ...vacations };
      entries.forEach(({ date, username }) => {
        updated[date] = [...(updated[date] || []), username];
      });
      setVacations(updated);
      setMessage("Urlop dodany na tydzień.");
      return;
    }

    if (action === "e") {
      const pass = prompt("Podaj hasło administratora:");
      if (pass !== "Capital1234") {
        setMessage("Nieprawidłowe hasło.");
        return;
      }
      const name = prompt("Podaj nowe imię:");
      if (!name) return;
      await supabase.from("vacations").delete().eq("date", dateStr);
      await supabase.from("vacations").insert([{ date: dateStr, username: name }]);
      const updated = { ...vacations, [dateStr]: [name] };
      setVacations(updated);
      setMessage("Wpis zaktualizowany.");
    }

    if (action === "u") {
      const pass = prompt("Podaj hasło administratora:");
      if (pass !== "Capital1234") {
        setMessage("Nieprawidłowe hasło.");
        return;
      }
      const name = prompt("Podaj imię do usunięcia:");
      if (!name) return;
      await supabase.from("vacations").delete().eq("date", dateStr).eq("username", name);
      const updated = { ...vacations };
      updated[dateStr] = (updated[dateStr] || []).filter((u) => u !== name);
      if (updated[dateStr].length === 0) delete updated[dateStr];
      setVacations(updated);
      setMessage("Wpis usunięty.");
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
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                  {isMaxReachedForWeek(day) && <div className="text-red-500 text-xs mt-1">Limit 5 osób na urlopie</div>}
                  {activeDay === format(day, "yyyy-MM-dd") && (
                    <div className="mt-2 flex flex-col gap-1">
                      <button onClick={() => addWeekVacation(day, "d")} className="bg-blue-100 hover:bg-blue-300 text-xs rounded px-2 py-1">Dodaj urlop</button>
                      <button onClick={() => addWeekVacation(day, "e")} className="bg-yellow-100 hover:bg-yellow-300 text-xs rounded px-2 py-1">Edycja</button>
                      <button onClick={() => addWeekVacation(day, "u")} className="bg-red-100 hover:bg-red-300 text-xs rounded px-2 py-1">Usuń</button>
                      <button onClick={() => setActiveDay(null)} className="bg-gray-200 hover:bg-gray-300 text-xs rounded px-2 py-1 mt-1">Zamknij</button>
                    </div>
                  )}
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