import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete, onChange, disabled, error }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character if multiple entered (edge case)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    
    // Call optional onChange
    if (onChange) onChange(newOtp.join(""));

    // Combine and check completion
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
      // Blur last input on complete
      if (index === length - 1) {
          inputRefs.current[index]?.blur();
      }
    }

    // Move to next input if value entered
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      // Move to previous input on backspace if empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return; // Only allow numbers

    const pastedArray = data.split("").slice(0, length);
    const newOtp = [...otp];
    pastedArray.forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    
    const combinedOtp = newOtp.join("");
    if (onChange) onChange(combinedOtp);
    if (combinedOtp.length === length) onComplete(combinedOtp);
    
    // Focus appropriate input
    const nextIndex = Math.min(pastedArray.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((_, index) => (
        <input
          key={index}
          ref={(ref) => {
            if (ref) inputRefs.current[index] = ref;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'}
          `}
        />
      ))}
    </div>
  );
};

export default OtpInput;