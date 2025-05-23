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

const isMaxReachedForWeek = (day) => {
  let total = 0;
  const weekStart = startOfWeek(day, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
    total += (vacations[dateStr]?.length || 0);
  }
  return total >= 25;
};

const addWeekVacation = async (day, action) => {
  const weekStart = startOfWeek(day, { weekStartsOn: 1 });
  const dateStr = format(day, "yyyy-MM-dd");

  if (action.toLowerCase() === 'd') {
    if (isMaxReachedForWeek(day)) {
      setMessage("Nie można dodać urlopu – osiągnięto limit 5 osób na tydzień.");
      return;
    }
    const name = prompt("Podaj swoje imię:");
    if (!name || !/^[A-Za-zÀ-ÿ\- ]{2,}$/.test(name)) {
      setMessage("Nieprawidłowe imię. Użyj tylko liter i minimum 2 znaków.");
      return;
    }
    const entries = Array.from({ length: 7 }, (_, i) => ({
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
  } else if (action.toLowerCase() === 'u') {
    const pass = prompt("Podaj hasło administratora:");
    if (pass !== 'Capital1234') {
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
    setMessage("Usunięto urlop na cały tydzień dla: " + name);
  }
};

const handleManualSave = async () => {
  await supabase.from("vacations").delete().not("username", "is", null);
  const all = Object.entries(vacations).flatMap(([date, users]) =>
    users.map(username => ({ date, username }))
  );
  await supabase.from("vacations").insert(all);
  setMessage("Dane zostały zapisane do bazy danych.");
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


return <div>TODO: kalendarz</div>;
}
