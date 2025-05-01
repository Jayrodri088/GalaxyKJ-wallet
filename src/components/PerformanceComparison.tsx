"use client"
import React, { useState } from "react"




export default function PerformanceComparison() {
    const [optionValue, setOptionValue] = useState("Top 10 Crypto")


    const cryptoOptions = ["Bitcoin", "Ethereum", "DeFi Index", "Top 10 Crypto",]

    const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setOptionValue(event.target.value)
    }



    return (
        <section className="w-full bg-[#13182B]/50  min-h-[50vh] flex flex-col items-start justify-start gap-5 rounded-sm px-4 py-6 " >
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6  " >

                <div>
                    <h2 className="text-2xl text-white font-semibold " >Performance Comparison</h2>
                    <p className="text-lg font-medium text-[#626D81] " >Compare your portfolio against market benchmarks</p>
                </div>

                <div className=" bg-[#13182B]/90 py-2 px-4 rounded-sm cursor-pointer ml-auto " >
                    <select name="cryto " id="crypto" value={optionValue} onChange={handleSelect} className="w-full border-none outline-none  bg-[#13182B]/90   " >


                        {cryptoOptions.map((option, index) => (
                            <option key={index} value={option} > {option} </option>
                        ))}


                    </select>

                </div>


            </div>

            <div className=" w-full h-[300px] flex items-center justify-center  bg-[#13182B]/90  text-[#6283AD] text-xl font-medium    " >  Comparison chart would appear here </div>


            <div className="w-full flex items-center justify-between flex-col md:flex-row gap-2 ">
                <div className=" w-full basis-1/2  min-w-[200px] rounded-lg px-4 py-5  bg-[#13182B]/90 flex flex-col items-start gap-1  "  >
                    <h5 className=" text-[#6283AD] text-lg font-medium " >Your Portfolio</h5>
                    <h3 className=" text-[#4ADD80] text-2xl font-semibold  " >+5.8%</h3>
                </div>
                <div className=" w-full basis-1/2  min-w-[200px] rounded-lg px-4 py-5  bg-[#13182B]/90   ">
                    <h5 className=" text-[#6283AD] text-lg font-medium ">Top 10 Crypto</h5>
                    <h3 className=" text-[#EF4444] text-2xl font-semibold  ">-2.1%</h3>
                </div>

            </div>

            <p className=" text-[#6283AD] text-base   font-medium ">  Your portfolio is outperforming the selected benchmark by <span className="text-[#4ADD80] " > 7.9%</span> in this period.</p>




        </section>
    )
}