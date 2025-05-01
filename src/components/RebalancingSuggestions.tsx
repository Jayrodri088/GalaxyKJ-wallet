import { ArrowUpDown, Zap } from "lucide-react";




export default function RebalancingSuggestions() {
    return (
        <section className="w-full flex items-start flex-col gap-5 px-4 py-7 bg-[#13182B]/50 rounded-sm  " >
            <div className="w-full flex justify-between items-center " >
                <h2 className=" text-xl text-white font-semibold "  >Rebalancing Suggestions</h2>
                <small className=" block px-3 py-1 rounded-xl bg-[#251442] text-[#A974E1] text-xs whitespace-nowrap "  >AI Powered</small>
            </div>
            <p className=" text-sm font-normal text-[#626D81] " >Optimize your portfolio allocation </p>


            <div className="w-full flex flex-col items-start gap-[10px] bg-[#13182B]/90 py-3 px-2 rounded-sm " >

                <div className="w-full flex justify-between items-center " >
                    <h2 className="text-lg text-white font-medium  flex items-center justify-center gap-2   "  ><ArrowUpDown size={18}  color={"#EBBF16"} /> <span> XLM Overweight</span></h2>
                    <span className=" block px-3 py-1 rounded-xl bg-[#2F2423] text-[#EBBF16] text-sm whitespace-nowrap ">High Priority</span>
                </div>
                <p className="text-[#6283AD] text-sm font-medium " >Your XLM allocation (35%)  exceeds the recommended level (25%). Consider rebalancing </p>
                <button className="w-full  text-base text-white font-semibold rounded-sm py-2 px-6   bg-gradient-to-r from-purple-500 to-blue-500 cursor-pointer transform transition duration-200 ease-in-out hover:scale-[95%] " >Rebalance Now</button>


            </div>

            <div className="w-full flex flex-col items-start gap-[10px] bg-[#13182B]/90 py-3 px-2 rounded-sm " >

                <div className="w-full flex justify-between items-center " >
                    <h2  className="text-lg text-white font-medium flex items-center justify-center gap-2  " ><ArrowUpDown size={18}  color={"#365E8F"} />  <span>Add Stablecoins</span> </h2>
                    <span className=" block px-3 py-1 rounded-xl text-[#365E8F] bg-[#121C3A] text-sm whitespace-nowrap ">Medium Priority</span>
                </div>
                <p className="text-[#6283AD] text-sm font-medium ">Adding 10% stablecoins would reduce volatility and provide dry powder for opportunities. </p>
                <button className="w-full  text-base text-white font-semibold rounded-sm py-2 px-6 bg-[#000000]   cursor-pointer  transform transition duration-200 ease-in-out hover:scale-[95%] ">View Details</button>


            </div>

            <div className="w-full flex flex-col items-start gap-[10px] bg-[#13182B]/90 py-3 px-2 rounded-sm ">

                <div className="w-full flex justify-between items-center " >
                    <h2   className="text-lg text-white font-medium  flex items-center justify-center gap-2 " ><ArrowUpDown size={18}  color={"#277346"} /> <span> Diversify Alts </span> </h2>
                    <span className=" block px-3 py-1 rounded-xl text-[#277346] bg-[#0C1B1C] text-sm whitespace-nowrap "  > Low Priority</span>
                </div>
                <p  className="text-[#6283AD] text-sm font-medium ">Consider adding small positions in promising mid-cap altcoins for growth potential. </p>
                <button className="w-full  text-base text-white font-semibold rounded-sm py-2 px-6 bg-[#000000] cursor-pointer    transform transition duration-200 ease-in-out hover:scale-[95%]  " >View Details</button>


            </div>






            <p className="text-base font-medium text-[#A755F7] flex items-center justify-center gap-1 cursor-pointer "  > <span>Run full portfolio optimization </span> <Zap size={18} color="#A755F7" /></p>

        </section>
    )
}