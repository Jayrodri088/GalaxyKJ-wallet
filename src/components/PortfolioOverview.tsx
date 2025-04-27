
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
    return (
        <section className="w-full bg-red-800 min-h-[50vh] flex flex-col items-start justify-start gap-5  "  >

       <div>
        <h1> Portfolio Overview </h1>
        <p> Current value: $12,458.32 (+5.8% this month) </p>
       </div>

       <div className="w-full h-[50vh] bg-green-600 flex items-center justify-center   "  >
graph
       </div>


       <ul className="w-full flex items-center justify-between gap-4 " >
        {portFolioCardValues.map((card, index) => (
              <li key={index} className=" flex flex-col items-start bg-pink-500 h-20 w-2xs justify-center p-2 rounded-lg   "   >
              <h3 className=" text-lg text-green-500 font-medium "  > {card.heading} </h3>
              <p className={` text-2xl text-red-900 font-bold ${index === 0 ? "text-white" : "text-red-400"}`}     > {index === 0 ? `$ ${card.value}`: `${card.value}%` } </p>
                      </li>
        ))}

       </ul>



        </section>
    )
}