import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="VerbalStock Logo"
      role="img"
      {...props}
    >
      <g fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
        <path d="M128,72a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,128,72Z" />
        <path d="M168,96a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,168,96Z" />
        <path d="M88,112a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V120A8,8,0,0,0,88,112Z" />
      </g>
    </svg>
  );
}
