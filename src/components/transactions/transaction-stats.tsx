import { Card } from "@/components/ui/card";

export function TransactionStats() {
  const stats = [
    { label: "Total Transactions", value: "10" },
    { label: "Completed", value: "7", color: "text-[#34D399]" },
    { label: "Pending", value: "2", color: "text-[#FBBF24]" },
    { label: "Failed", value: "1", color: "text-[#F87171]" },
  ];

  return (
    <Card className="bg-[#0F1225] border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-6">Stats</h2>
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-400">{stat.label}</span>
            <span className={stat.color || "text-white"}>{stat.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
