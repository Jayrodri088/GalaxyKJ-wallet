"use client"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import type { Automation } from "@/types/automation"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface FinancialImpactChartProps {
  automation: Automation
}

export function FinancialImpactChart({ automation }: FinancialImpactChartProps) {

  const generateChartData = () => {
    const months = ["Abr", "May", "Jun", "Jul", "Ago", "Sep"]

    if (automation.type === "payment") {

      const amount = Number.parseFloat(automation.amount as string) || 10
      const frequency = automation.frequency || "monthly"
      const multiplier = frequency === "weekly" ? 4 : frequency === "monthly" ? 1 : frequency === "yearly" ? 1/12 : 1

      const baseBalance = 1000
      const monthlyPayment = amount * multiplier

      const balanceData = months.map((_, index) => baseBalance - monthlyPayment * index)
      const paymentData = months.map((_, index) => monthlyPayment * (index + 1))

      return {
        labels: months,
        datasets: [
          {
            label: "Balance",
            data: balanceData,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Pagos Acumulados",
            data: paymentData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
            borderDash: [5, 5],
          },
        ],
      }
    } else if (automation.type === "swap") {

      const basePrice = 100
      const conditionValue = Number.parseFloat(automation.conditionValue as string) || 5
      const condition = automation.condition || "price_increase"

      let priceData
      if (condition === "price_increase") {
        priceData = months.map((_, index) => basePrice * (1 + 0.02 * index))
      } else if (condition === "price_decrease") {
        priceData = months.map((_, index) => basePrice * (1 - 0.01 * index))
      } else {
        priceData = months.map((_, index) => basePrice * (1 + 0.01 * (index - 2)))
      }


      const triggerPrice =
        condition === "price_target"
        ? Number.parseFloat(conditionValue as unknown as string)
          : condition === "price_increase"
            ? basePrice * (1 + conditionValue / 100)
            : basePrice * (1 - conditionValue / 100)

      const triggerData = months.map(() => triggerPrice)

      return {
        labels: months,
        datasets: [
          {
            label: "Precio",
            data: priceData,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Nivel de Activación",
            data: triggerData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0,
            fill: false,
            borderDash: [5, 5],
          },
        ],
      }
    } else if (automation.type === "rule") {
      const baseBalance = 1000
      const threshold = Number.parseFloat(automation.threshold as string) || 100


      const balanceData = months.map((_, index) => {
        const randomFactor = 0.95 + Math.random() * 0.2
        return baseBalance * randomFactor - 20 * index
      })


      const thresholdData = months.map(() => threshold)

      return {
        labels: months,
        datasets: [
          {
            label: "Balance",
            data: balanceData,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Umbral",
            data: thresholdData,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0,
            fill: false,
            borderDash: [5, 5],
          },
        ],
      }
    }


    return {
      labels: months,
      datasets: [
        {
          label: "Impacto",
          data: [1000, 950, 900, 850, 800, 750],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    }
  }

  const data = generateChartData()

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#9ca3af",
          boxWidth: 12,
          padding: 8,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleColor: "#fff",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 8,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 9,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 9,
          },
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
  }

  return <Line data={data} options={options} />
}

