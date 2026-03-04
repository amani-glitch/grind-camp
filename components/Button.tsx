import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "px-6 py-3 font-display uppercase tracking-wider text-sm md:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5";
  
  const variants = {
    primary: "bg-grind-orange hover:bg-grind-fire text-white shadow-[0_0_15px_rgba(255,106,0,0.3)] hover:shadow-[0_0_25px_rgba(255,106,0,0.6)] border border-transparent",
    secondary: "bg-white text-grind-black hover:bg-gray-200 border border-transparent",
    outline: "bg-transparent border-2 border-grind-orange text-grind-orange hover:bg-grind-orange hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};