


import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Line } from 'react-chartjs-2';

  ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);




interface portfolioCardValuesProps {
    heading: string;
    value: number;
}

export default function PortfolioOverview() {


       const portFolioCardValues : portfolioCardValuesProps[] = [
            {
                heading: "Total Value",
                value: 12458.32,
            },
            {
                heading: "24h Change",
                value: 2.3,
            },
            {
                heading: "30d Change",
                value: 5.8,
            },
            {
                heading: "All Time",
                value: 24.7,
            }
        ]


        const lineChartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
              {
                label: 'Portfolio Value',
                data: [8000, 9500, 10400, 11500, 12458.32],
                borderColor: '#4ADD80',
                backgroundColor: 'rgba(74, 221, 128, 0.2)',
                tension: 0.4,
                fill: true,
              },
            ],
          };

          const lineChartOptions = {
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


    return (
        <section className="w-full bg-[#13182B]/50 min-h-[50vh] flex flex-col items-start justify-start gap-5 px-4 py-6 rounded-sm   "  >

       <div>
        <h1  className="text-2xl text-white font-semibold "> Portfolio Overview </h1>
        <p  className="text-lg font-medium text-[#626D81]" > Current value: $12,458.32 (+5.8% this month) </p>
       </div>

       <div className="w-full h-[30vh] lg:h-[50vh] flex items-center justify-center  bg-[#13182B]/90  text-[#6283AD] text-xl font-medium    "  >
       <Line data={lineChartData} options={lineChartOptions} />
       </div>


       <ul className="w-full flex  flex-wrap items-center  gap-3 " >
        {portFolioCardValues.map((card, index) => (
              <li key={index} className=" flex flex-col items-start  h-20 w-full max-w-[240px] justify-center p-2 rounded-lg  bg-[#13182B]/90   "   >
              <h3 className=" text-[#6283AD] text-lg font-medium "  > {card.heading} </h3>
              <p className={` text-xl md:text-2xl  text-[#4ADD80] font-semibold ${index === 0 ? "text-white" : " text-[#4ADD80]"}`}     > {index === 0 ? `$ ${card.value}`: `${card.value}%` } </p>
                      </li>
        ))}

       </ul>



        </section>
    )
}