import * as React from "react";
import { cn } from "../../lib/utils";


const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "span" : "button";

    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition rounded-xl",
      outline:
        "border border-gray-300 text-gray-800 hover:bg-gray-100 rounded-xl transition",
      ghost:
        "text-gray-700 hover:bg-gray-200 transition rounded-xl",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 rounded-xl transition",
    };

    const sizes = {
      default: "px-4 py-2 text-sm font-medium",
      sm: "px-3 py-1.5 text-sm",
      lg: "px-5 py-2 text-base",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center font-semibold focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
