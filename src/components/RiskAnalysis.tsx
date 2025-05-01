export default function RiskAnalysis() {
    const marketData = [
        {
            title: "Volatility",
            percentage: 55,
        },
        {
            title: "Sharpe Ratio",
            percentage: 60,
        },
        {
            title: "Drawdown Risk",
            percentage: 75,
        },
        {
            title: "Diversification",
            percentage: 30,
        },
    ];

    const getRangeInfo = (percentage: number) => {
        if (percentage === undefined || percentage === null) return { color: "#9CA3AF", label: "N/A" };

        if (percentage <= 40) return { color: "#EF4444", label: "Low" };
        else if (percentage <= 60) return { color: "#F59E0B", label: "Medium" };
        else if (percentage <= 75) return { color: "#10B981", label: "Good" };
        else return { color: "#8B5CF6", label: "Excellent" };
    };

    return (
        <div className="w-full flex items-start flex-col gap-5 px-4 py-7 bg-[#13182B]/50 rounded-sm">
            <div>
                <h2 className="text-xl text-white font-semibold">Risk Analysis</h2>
                <p className="text-sm font-normal text-[#626D81]">Current portfolio risk metrics</p>
            </div>

            <div className="w-full flex flex-col items-start gap-3">
                {marketData.map((data, index) => {
                    const rangeInfo = getRangeInfo(data.percentage);

                    return (
                        <div key={index} className="w-full">
                            <div className="w-full flex items-center justify-between gap-5">
                                <h3 className="text-sm font-normal text-white">{data.title}</h3>
                                <h2 className="text-base font-medium text-white">
                                    {rangeInfo.label} ({data.percentage}%)
                                </h2>
                            </div>
                            <div className="w-full h-[10px] bg-gray-700 rounded-[20px] relative overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full rounded-[20px]"
                                    style={{
                                        backgroundColor: rangeInfo.color,
                                        width: `${data.percentage}%`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-base font-medium text-[#A755F7] cursor-pointer">
                Run full portfolio optimization
            </p>
        </div>
    );
}