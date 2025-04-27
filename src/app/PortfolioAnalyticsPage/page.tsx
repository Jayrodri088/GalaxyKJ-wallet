"use client"

import PortfolioOverview from "@/components/PortfolioOverview";
import { Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { motion } from 'framer-motion';



export default function Page() {
    const [optionValue, setOptionValue] = useState("All Time");




    const options = ["7 Days", "1 Month", "3 Month", "1 Year", "All Time"]

    const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOptionValue(event.target.value)
    }




    return (
        <div className="py-[2%] px-[3%] flex flex-col items-center   " >
            <header className="w-full flex items-center justify-between gap-24  " >

                <div>
                    <h1 className=" bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-3xl font-semibold mb-3 " >Portfolio Analysis</h1>
                    <p className=" text-blue-400 text-lg font-medium  " >Analyze your assets, track performance, and optimize your portfolio</p>
                </div>

                <div className="flex items-center justify-center gap-4" >

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



            <section className=" w-full h-fit flex items-start justify-normal mt-[80px]  gap-[40px] " >
                <div className="w-full flex flex-col justify-start items-start gap-10 max-w-[1300px]  " >
                    <PortfolioOverview />
                </div>


                righht part

            </section>





        </div>
    )
}