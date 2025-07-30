import { Clock, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ResourceCardProps {
  imageSrc?: string;
  title: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  category: string;
}

export function ResourceCard({
  imageSrc,
  title,
  description,
  duration,
  level,
  category,
}: ResourceCardProps) {
  const [imageError, setImageError] = useState(false);

  const getLevelColor = () => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "intermediate":
        return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "advanced":
        return "bg-purple-900/30 text-purple-400 border-purple-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  const getCategoryColor = () => {
    switch (category.toLowerCase()) {
      case "fundamentals":
        return "bg-blue-900/30 text-blue-300 border-blue-800";
      case "technology":
        return "bg-indigo-900/30 text-indigo-300 border-indigo-800";
      case "finance":
        return "bg-emerald-900/30 text-emerald-300 border-emerald-800";
      case "security":
        return "bg-red-900/30 text-red-300 border-red-800";
      case "defi":
        return "bg-amber-900/30 text-amber-300 border-amber-800";
      case "nft":
        return "bg-pink-900/30 text-pink-300 border-pink-800";
      default:
        return "bg-gray-900/30 text-gray-300 border-gray-800";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-700/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]">
      <div className="relative h-44 w-full flex items-center justify-center bg-gray-800/50">
        {!imageError && imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <ImageIcon className="h-12 w-12 text-gray-600" />
            <span className="text-sm text-gray-500 mt-2">
              Image placeholder
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded border ${getLevelColor()}`}
            >
              {level}
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-4">{description}</p>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-800">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {duration}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded border ${getCategoryColor()}`}
          >
            {category}
          </span>
        </div>
      </div>
    </div>
  );
}
