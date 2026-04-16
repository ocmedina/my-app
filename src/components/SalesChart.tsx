// src/components/SalesChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Formateador para el eje Y (ej: 10000 -> $10k)
const formatYAxis = (tickItem: number) => {
  if (tickItem >= 1000) {
    return `$${tickItem / 1000}k`;
  }
  return `$${tickItem}`;
};

export default function SalesChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md h-80">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-100">Ventas de la Última Semana</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} stroke="#888888" />
          <YAxis tickFormatter={formatYAxis} stroke="#888888" />
          <Tooltip 
            cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} 
            formatter={(value: number) => [`$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Ventas']}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="total" fill="#3b82f6" name="Ventas" barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}