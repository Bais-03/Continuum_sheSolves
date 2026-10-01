import { useEffect, useState } from "react";

export function ContinuumLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Start the exit transition after the intro has settled.
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 1750);

    // Remove the loader after the fade-out finishes.
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2150);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes continuum-logo-in {
          0% {
            opacity: 0;
            transform: scale(0.78) translateY(10px);
          }
          60% {
            opacity: 1;
            transform: scale(1.03) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes continuum-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes continuum-text-in {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes continuum-subtitle-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.8;
          }
        }

        @keyframes continuum-line {
          0% {
            transform: scaleX(0);
            transform-origin: left;
          }
          100% {
            transform: scaleX(1);
            transform-origin: left;
          }
        }

        @keyframes continuum-glow {
          0%, 100% {
            opacity: 0.18;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.28;
            transform: scale(1.06);
          }
        }

        @keyframes continuum-exit {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.015);
          }
        }

        .continuum-loader {
          animation: ${exiting
            ? "continuum-exit 400ms ease-out forwards"
            : "none"};
        }

        .continuum-logo {
          animation:
            continuum-logo-in 850ms cubic-bezier(.22,1,.36,1) forwards,
            continuum-float 2.8s ease-in-out 850ms infinite;
        }

        .continuum-glow {
          animation: continuum-glow 2.8s ease-in-out infinite;
        }

        .continuum-title {
          opacity: 0;
          animation: continuum-text-in 550ms ease-out 500ms forwards;
        }

        .continuum-subtitle {
          opacity: 0;
          animation: continuum-subtitle-in 500ms ease-out 750ms forwards;
        }

        .continuum-line {
          transform: scaleX(0);
          animation:
            continuum-line 650ms cubic-bezier(.22,1,.36,1) 850ms forwards;
        }
      `}</style>

      <div
        className="continuum-loader fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        aria-label="Loading Continuum"
      >
        <div className="relative flex flex-col items-center">
          {/* Soft ambient glow */}
          <div
            className="continuum-glow absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-3xl"
            aria-hidden="true"
          />

          {/* Continuum logo */}
          <img
            src="/continuum-mark.png"
            alt="Continuum"
            className="continuum-logo relative h-28 w-28 object-contain"
          />

          {/* Product name */}
          <div className="continuum-title mt-5 font-display text-4xl font-semibold tracking-tight">
            Continuum<span className="text-gold">.</span>
          </div>

          {/* Tagline */}
          <p className="continuum-subtitle mt-2 text-sm tracking-wide text-muted-foreground">
            Household readiness
          </p>

          {/* Loading indicator */}
          <div className="mt-6 h-px w-28 overflow-hidden bg-muted">
            <div className="continuum-line h-full w-full bg-gold" />
          </div>
        </div>
      </div>
    </>
  );
}