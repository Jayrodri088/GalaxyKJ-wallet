import { useState, useEffect } from 'react';

interface ToggleSliderProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export const ToggleSlider: React.FC<ToggleSliderProps> = ({ value, onChange, label }) => {
  const [isOn, setIsOn] = useState(value);

  useEffect(() => {
    setIsOn(value);
  }, [value]);

  const handleToggle = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex items-center justify-between">
      {label && (
        <span className="text-sm text-gray-300">{label}</span>
      )}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-400">
          {isOn ? 'On' : 'Off'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isOn ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}; 