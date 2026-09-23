"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useRef,
} from "react";

type MagneticProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  strength?: number;
};

export default function Magnetic({
  children,
  strength = 0.16,
  className = "",
  ...props
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();

    const x =
      event.clientX -
      (rect.left + rect.width / 2);

    const y =
      event.clientY -
      (rect.top + rect.height / 2);

    element.style.transform =
      `translate3d(${x * strength}px, ${y * strength}px, 0)`;
  };

  const leave = () => {
    const element = ref.current;

    if (!element) return;

    element.style.transform =
      "translate3d(0, 0, 0)";
  };

  return (
    <div
      ref={ref}
      className={`stella-magnetic ${className}`}
      onMouseMove={move}
      onMouseLeave={leave}
      {...props}
    >
      {children}
    </div>
  );
}
