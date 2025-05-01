"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-2">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-gray-900/50 border-gray-700 text-gray-200">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="text-gray-200 focus:bg-gray-800 focus:text-gray-200"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 