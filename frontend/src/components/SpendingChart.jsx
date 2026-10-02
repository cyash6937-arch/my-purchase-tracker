import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatINR } from '../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const MonthlySpendingChart = ({ monthlyData = [] }) => {
  const labels = monthlyData.map(item => item.month);
  const totals = monthlyData.map(item => item.total_spent);
  const gsts = monthlyData.map(item => item.total_gst);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Spent (₹)',
        data: totals,
        backgroundColor: '#10b981', // emerald-500
        borderRadius: 8,
        hoverBackgroundColor: '#059669',
      },
      {
        label: 'GST Paid (₹)',
        data: gsts,
        backgroundColor: '#3b82f6', // blue-500
        borderRadius: 8,
        hoverBackgroundColor: '#2563eb',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${formatINR(context.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
        }
      }
    }
  };

  return (
    <div className="h-64 sm:h-72 w-full">
      {monthlyData.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
          No monthly data available yet.
        </div>
      )}
    </div>
  );
};

export const CategorySpendingChart = ({ categoryData = [] }) => {
  const palette = [
    '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', 
    '#06b6d4', '#ef4444', '#14b8a6', '#64748b', '#eab308'
  ];

  const labels = categoryData.map(c => c.category);
  const values = categoryData.map(c => c.total_spent);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 500 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${formatINR(context.raw)}`
        }
      }
    }
  };

  return (
    <div className="h-64 sm:h-72 w-full flex items-center justify-center">
      {categoryData.length > 0 ? (
        <Doughnut data={data} options={options} />
      ) : (
        <div className="text-slate-400 text-sm">
          No category spending recorded yet.
        </div>
      )}
    </div>
  );
};
