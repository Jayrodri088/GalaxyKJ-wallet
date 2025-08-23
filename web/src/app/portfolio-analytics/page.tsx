"use client"

import PortfolioOverview from "@/components/portfolio-overview";
import { Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { motion } from 'framer-motion';
import { AssetDistribution } from "@/components/asset-distribution";
import PerformanceComparison from "@/components/performance-comparison";
import RebalancingSuggestions from "@/components/rebalancing-suggestions";
import RiskAnalysis from "@/components/risk-analysis";

export default function Page() {
    const [optionValue, setOptionValue] = useState("All Time");

    const options = ["7 Days", "1 Month", "3 Month", "1 Year", "All Time"]

    const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOptionValue(event.target.value)
    }

    return (
        <div className=" py-[20px] md:py-[2%] px-[10px] md:px-[3%] flex flex-col items-center   " >
            <header className="w-full flex items-start md:items-center justify-between gap-3 md:gap-24 flex-col md:flex-row  " >

                <div>
                    <h1 className=" bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-2xl md:text-3xl font-semibold md:mb-3 " >Portfolio Analysis</h1>
                    <p className=" text-blue-400 text-base md:text-lg font-medium  " >Analyze your assets, track performance, and optimize your portfolio</p>
                </div>

                <div className=" ml-auto md:ml-none flex items-center justify-center gap-4" >

                    <div className=" bg-[#12132A]/70 backdrop-blur-sm  py-3 px-4 flex items-center gap-5  cursor-pointer rounded-lg"><Calendar />
                        <select name="date" value={optionValue} id="date" className="w-full border-none outline-none bg-gray-900  " onChange={handleSelect}  >
                            {options.map((option, index) => (
                                <option key={index} value={option} > {option} </option>
                            ))}
                        </select>
                    </div>

                    <button className="bg-[#12132A]/70 backdrop-blur-sm py-3 px-4 flex items-center justify-center gap-5 cursor-pointer rounded-lg"
                    >
                        <motion.span
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}>
                            <RefreshCw />
                        </motion.span>  </button>
                </div>

            </header>

            <section className=" w-full h-fit flex flex-col md:flex-row items-start justify-normal mt-[80px]  gap-[30px] " >
                <div className="w-full flex flex-col justify-start items-start gap-10 max-w-[1300px]  " >
                    <PortfolioOverview />
                    <AssetDistribution/>
                    <PerformanceComparison/>
                </div>

                <div className=" w-full max-w-[400px] min-w-[320px]  h-fit flex flex-col items-start gap-10 "  >

                    <RebalancingSuggestions/>
                    <RiskAnalysis/>

                </div>

            </section>

        </div>
    )
}