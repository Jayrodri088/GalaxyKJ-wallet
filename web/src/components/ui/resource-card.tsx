import { ReactNode } from "react";
import { motion } from "framer-motion";

interface securityProp {
    heading: string,
    content: string,
    level: string,
    category: string,
    labelIcon: ReactNode,
}

export default function ResourceCard({ heading, content, level, category, labelIcon }: securityProp) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="min-w-[300px] max-w-[500px] min-h-[180px] bg-[#13182A] backdrop-blur-md border-[1px] border-[#374151] m-2 rounded-lg px-7 py-8 flex flex-col items-start gap-7"
        >
            <div className="w-full flex items-center justify-items-start gap-4">
                <label>{labelIcon}</label>
                <label className="bg-[#F1F5F9] py-1 px-3 rounded-[18px] text-xs font-medium text-[#000000]">{category}</label>
                <label className="bg-transparent py-1 px-3 rounded-[18px] text-xs font-medium text-[#040B1A] border-[1px] border-[#F1F5F9]">{level}</label>
            </div>

            <div>
                <h1 className="mb-3 text-base font-semibold text-[#050B1A]">{heading}</h1>
                <p className="text-sm font-medium text-[#F1F5F9]">{content}</p>
            </div>

            <button className="ml-auto text-sm font-normal cursor-pointer text-[#F1F5F9] hover:text-gray-400 transition ease-in-out duration-300">View Resource</button>
        </motion.div>
    );
}