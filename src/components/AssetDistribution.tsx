


export default function AssetDistribution() {


    const asstesData = [
        {
            name: "XLM",
            percentage: 35,
            amount: 4360.41,
            colors: "#A755F7"
        },
        {
            name: "BTC",
            percentage: 25,
            amount: 3114.58,
            colors: "#3B82F6"
        },
        {
            name: "ETH",
            percentage: 20,
            amount: 2491.66,
            colors: "#22C55E"
        },
        {
            name: "SOL",
            percentage: 15,
            amount: 1868.75,
            colors: "#CA9B0C"
        },
        {
            name: "Others",
            percentage: 5,
            amount: 622.92,
            colors: "#EF4444"
        },
    ]


    return (
        <section className="w-full min-h-[50vh] flex flex-col items-start justify-start gap-5  rounded-lg bg-[#13182B]/50 backdrop-blur-sm px-10 py-12  " >
            <div>
                <h2 className="text-2xl text-white font-semibold ">Asset Distribution</h2>
                <p className="text-lg font-medium text-[#626D81] ">Breakdown of your portfolio by asset</p>
            </div>

            <div className="w-full  flex flex-col md:flex-row items-start gap-5 " >

                <div className=" w-full max-w-[630px] min-w-[300px] md:min-w-[350px] h-[300px]  flex items-center justify-center  flex-grow-1 bg-[#13182B]/90 backdrop-blur-sm   text-[#6283AD] text-xl font-medium  p-3  rounded-sm " >
                    Asset allocation chart would appear here
                </div>


                <ul className="w-full flex flex-col gap-6 max-w-[580px]  p-2 flex-grow-0 "  >
                    {asstesData.map((asset, index) => (
                        <li key={index} className="w-full flex justify-between items-center gap-10"  > <h4 className="flex items-center gap-1 text-white " ><span className="block h-4 w-4  rounded-full " style={{ backgroundColor: asset.colors }} ></span> {asset.name} </h4> <span className="flex items-center gap-3" ><p> {asset.percentage}% </p> <small className="text-[#727886] text-sm " >${asset.amount} </small> </span>  </li>
                    ))}
                </ul>
            </div>



        </section>
    )
}