
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
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchVacations = async () => {
      const { data, error } = await supabase.from("vacations").select("*");
      if (error) {
        setMessage("Błąd: " + error.message);
      } else {
        setMessage("Połączenie udane. Wczytano " + data.length + " rekordów.");
      }
    };
    fetchVacations();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Test połączenia z Supabase</h1>
      <p className="text-gray-700">{message}</p>
    </div>
  );
}
