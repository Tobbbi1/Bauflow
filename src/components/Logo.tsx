'use client'

import React from 'react';

const Logo = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-blue-600"
    >
      <style>
        {`
          .bar1, .bar2, .bar3 {
            animation: grow 1.5s ease-in-out infinite alternate;
          }
          .bar2 {
            animation-delay: 0.25s;
          }
          .bar3 {
            animation-delay: 0.5s;
          }
          @keyframes grow {
            0% {
              transform: scaleY(0.3);
            }
            100% {
              transform: scaleY(1);
            }
          }
        `}
      </style>
      <g transform="translate(0, 24) scale(1, -1)">
        <rect className="bar1" x="4" y="0" width="4" height="16" rx="1" fill="currentColor" transform-origin="bottom" />
        <rect className="bar2" x="10" y="0" width="4" height="20" rx="1" fill="currentColor" transform-origin="bottom" />
        <rect className="bar3" x="16" y="0" width="4" height="12" rx="1" fill="currentColor" transform-origin="bottom" />
      </g>
    </svg>
  );
};

export default Logo; 