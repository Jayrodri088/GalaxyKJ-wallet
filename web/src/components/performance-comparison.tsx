"use client"
import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type BenchmarkData = {
  Bitcoin: number;
  Ethereum: number;
  "DeFi Index": number;
  "Top 10 Crypto": number;
};

export default function PerformanceComparison() {
  const [optionValue, setOptionValue] = useState<keyof BenchmarkData>("Top 10 Crypto");

  const cryptoOptions: (keyof BenchmarkData)[] = [
    "Bitcoin",
    "Ethereum",
    "DeFi Index",
    "Top 10 Crypto"
  ];

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptionValue(event.target.value as keyof BenchmarkData);
  };

  const benchmarkData: BenchmarkData = {
    Bitcoin: -1.2,
    Ethereum: 1.5,
    "DeFi Index": 3.0,
    "Top 10 Crypto": -2.1,
  };

  const portfolioPerformance = 5.8;

  const chartData = {
    labels: ["Your Portfolio", optionValue],
    datasets: [
      {
        label: "Performance (%)",
        data: [portfolioPerformance, benchmarkData[optionValue]],
        backgroundColor: ["#4ADD80", "#3B82F6"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#A0AEC0',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#A0AEC0' },
        grid: { color: '#2D3748' },
      },
      y: {
        ticks: { color: '#A0AEC0' },
        grid: { color: '#2D3748' },
      },
    },
  };

  const performanceDifference = portfolioPerformance - benchmarkData[optionValue];
  const isOutperforming = performanceDifference > 0;

  return (
    <section className="w-full bg-[#13182B]/50 min-h-[50vh] flex flex-col items-start justify-start gap-5 rounded-sm px-4 py-6">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl text-white font-semibold">Performance Comparison</h2>
          <p className="text-lg font-medium text-[#626D81]">Compare your portfolio against market benchmarks</p>
        </div>

        <div className="bg-[#13182B]/90 py-2 px-4 rounded-sm cursor-pointer ml-auto">
          <select
            name="crypto"
            id="crypto"
            value={optionValue}
            onChange={handleSelect}
            className="w-full border-none outline-none bg-[#13182B]/90"
          >
            {cryptoOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-[300px] flex items-center justify-center bg-[#13182B]/90 text-[#6283AD] text-xl font-medium">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="w-full flex items-center justify-between flex-col md:flex-row gap-2">
        <div className="w-full basis-1/2 min-w-[200px] rounded-lg px-4 py-5 bg-[#13182B]/90 flex flex-col items-start gap-1">
          <h5 className="text-[#6283AD] text-lg font-medium">Your Portfolio</h5>
          <h3 className="text-[#4ADD80] text-2xl font-semibold">+{portfolioPerformance}%</h3>
        </div>
        <div className="w-full basis-1/2 min-w-[200px] rounded-lg px-4 py-5 bg-[#13182B]/90">
          <h5 className="text-[#6283AD] text-lg font-medium">{optionValue}</h5>
          <h3 className={`text-2xl font-semibold ${
            benchmarkData[optionValue] >= 0 ? 'text-[#4ADD80]' : 'text-[#EF4444]'
          }`}>
            {benchmarkData[optionValue] >= 0 ? '+' : ''}{benchmarkData[optionValue]}%
          </h3>
        </div>
      </div>

      <p className="text-[#6283AD] text-base font-medium">
        Your portfolio is {isOutperforming ? 'outperforming' : 'underperforming'} the selected benchmark by
        <span className={isOutperforming ? 'text-[#4ADD80]' : 'text-[#EF4444]'}>
          {' '}{Math.abs(performanceDifference).toFixed(1)}%
        </span>
        {isOutperforming ? ' in this period.' : '.'}
      </p>
    </section>
  );
}