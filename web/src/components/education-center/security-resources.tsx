import securityProps from "@/data/education-center-data";
import ResourceCard from "@/components/ui/resource-card";
import { CircleCheckBig, Download, Shield, Wrench } from "lucide-react";

function SecurityResources() {
    return (
        <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4"  >

            {
                securityProps.map((item, index) => {

                    const LabelIcon = () => {
                        if (item.category.toLocaleLowerCase() == "checklist") {
                            return <CircleCheckBig className=" text-[#21B057]" />
                        }

                        if (item.category.toLocaleLowerCase() == "guide") {
                            return <Shield className="text-[#3B82F6] " />
                        }

                        if (item.category.toLocaleLowerCase() == "article") {
                            return <Download className="text-[#A855F7] " />
                        }
                        if (item.category.toLocaleLowerCase() == "tool") {
                            return <Wrench className="text-[#7F6619] " />
                        }

                    }

                    return (
                        <ResourceCard
                            key={index}
                            heading={item.heading}
                            content={item.content}
                            category={item.category}
                            level={item.level}
                            labelIcon={<LabelIcon />}
                        />
                    )
                })
            }



        </div>
    )
}

export { SecurityResources };
export default SecurityResources;