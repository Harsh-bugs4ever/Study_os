// import { useRef, useEffect, useState } from 'react';

// interface AnimatedBookProps {
//   className?: string;
// }

// export function AnimatedBook({ className = '' }: AnimatedBookProps) {
//   const [hovered, setHovered] = useState(false);
//   const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
//   const pageRef = useRef<number>(0);
//   const [pageAngle, setPageAngle] = useState(0);
//   const rafRef = useRef<number>(0);
//   const tRef = useRef(0);

//   useEffect(() => {
//     const speed = hovered ? 0.035 : 0.012;
//     const animate = () => {
//       tRef.current += speed;
//       // Page flip: oscillates 0–180 degrees
//       const raw = ((Math.sin(tRef.current) + 1) / 2) * 180;
//       setPageAngle(raw);
//       rafRef.current = requestAnimationFrame(animate);
//     };
//     rafRef.current = requestAnimationFrame(animate);
//     return () => cancelAnimationFrame(rafRef.current);
//   }, [hovered]);

//   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const cx = rect.left + rect.width / 2;
//     const cy = rect.top + rect.height / 2;
//     setMouseOffset({
//       x: ((e.clientX - cx) / (rect.width / 2)) * 12,
//       y: ((e.clientY - cy) / (rect.height / 2)) * 8,
//     });
//   };

//   const glowIntensity = hovered ? 0.7 : 0.3;

//   return (
//     <div
//       className={`relative flex items-center justify-center ${className}`}
//       style={{ perspective: '600px', width: 160, height: 200 }}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => { setHovered(false); setMouseOffset({ x: 0, y: 0 }); }}
//       onMouseMove={handleMouseMove}
//     >
//       {/* Glow behind book */}
//       <div
//         className="absolute rounded-full pointer-events-none"
//         style={{
//           width: 120, height: 120,
//           background: `radial-gradient(circle, rgba(212,175,55,${glowIntensity * 0.4}) 0%, transparent 70%)`,
//           filter: 'blur(20px)',
//           transition: 'opacity 0.4s ease',
//           top: '50%', left: '50%',
//           transform: 'translate(-50%, -50%)',
//         }}
//       />

//       {/* 3D Book */}
//       <div
//         style={{
//           width: 100, height: 130,
//           transformStyle: 'preserve-3d',
//           transform: `rotateX(${-mouseOffset.y}deg) rotateY(${20 + mouseOffset.x}deg)`,
//           transition: hovered ? 'transform 0.1s ease' : 'transform 0.5s ease',
//           position: 'relative',
//         }}
//       >
//         {/* Back cover */}
//         <div style={{
//           position: 'absolute', width: 100, height: 130,
//           background: 'linear-gradient(135deg, #4a2f0e 0%, #2d1a07 100%)',
//           borderRadius: '3px 6px 6px 3px',
//           boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
//           transform: 'translateZ(-6px)',
//         }} />

//         {/* Spine */}
//         <div style={{
//           position: 'absolute', width: 12, height: 130,
//           background: 'linear-gradient(90deg, #2d1a07, #5a3515, #2d1a07)',
//           left: -12, top: 0,
//           transform: 'rotateY(-90deg) translateZ(-6px)',
//           transformOrigin: 'right center',
//         }} />

//         {/* Front cover */}
//         <div style={{
//           position: 'absolute', width: 100, height: 130,
//           background: 'linear-gradient(160deg, #7a4a1e 0%, #5a3515 40%, #3d2309 100%)',
//           borderRadius: '3px 6px 6px 3px',
//           boxShadow: hovered
//             ? '0 0 30px rgba(212,175,55,0.4), 0 8px 32px rgba(0,0,0,0.5)'
//             : '0 4px 16px rgba(0,0,0,0.4)',
//           transition: 'box-shadow 0.3s ease',
//           overflow: 'hidden',
//         }}>
//           {/* Cover decoration */}
//           <div style={{
//             position: 'absolute', inset: 6,
//             border: '1px solid rgba(212,175,55,0.3)',
//             borderRadius: 2,
//           }} />
//           <div style={{
//             position: 'absolute', top: 20, left: 0, right: 0,
//             textAlign: 'center', fontSize: 9,
//             color: 'rgba(212,175,55,0.7)',
//             fontFamily: "'Playfair Display', serif",
//             letterSpacing: '0.1em',
//           }}>॥ ज्ञान ॥</div>
//           <div style={{
//             position: 'absolute', top: '35%', left: '50%',
//             transform: 'translateX(-50%)',
//             fontSize: 28, opacity: 0.4,
//           }}>📜</div>
//           <div style={{
//             position: 'absolute', bottom: 16, left: 0, right: 0,
//             textAlign: 'center', fontSize: 7,
//             color: 'rgba(212,175,55,0.5)',
//             fontFamily: "'Playfair Display', serif",
//             letterSpacing: '0.15em',
//           }}>GURUKUL</div>

//           {/* Sheen overlay on hover */}
//           {hovered && (
//             <div style={{
//               position: 'absolute', inset: 0,
//               background: 'linear-gradient(130deg, transparent 30%, rgba(255,220,100,0.08) 50%, transparent 70%)',
//               animation: 'none',
//             }} />
//           )}
//         </div>

//         {/* Page layers */}
//         {[0, 1, 2].map(i => (
//           <div key={i} style={{
//             position: 'absolute',
//             width: 94, height: 122,
//             top: 4, left: 3,
//             background: `hsl(40, 30%, ${92 - i * 3}%)`,
//             borderRadius: '1px 3px 3px 1px',
//             transformOrigin: 'left center',
//             transform: `translateZ(${(i + 1) * 1.5}px)`,
//           }}>
//             {/* Page lines */}
//             {Array.from({ length: 8 }, (_, j) => (
//               <div key={j} style={{
//                 position: 'absolute',
//                 left: 8, right: 8,
//                 top: 14 + j * 12,
//                 height: 1,
//                 background: 'rgba(139,90,43,0.12)',
//               }} />
//             ))}
//           </div>
//         ))}

//         {/* Flipping page */}
//         <div style={{
//           position: 'absolute',
//           width: 94, height: 122,
//           top: 4, left: 3,
//           transformOrigin: 'left center',
//           transformStyle: 'preserve-3d',
//           transform: `rotateY(${-pageAngle}deg) translateZ(5px)`,
//         }}>
//           {/* Front of flipping page */}
//           <div style={{
//             position: 'absolute', inset: 0,
//             background: 'linear-gradient(135deg, #fdf6e3, #f5e6c8)',
//             borderRadius: '1px 3px 3px 1px',
//             boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
//             backfaceVisibility: 'hidden',
//           }}>
//             {Array.from({ length: 7 }, (_, j) => (
//               <div key={j} style={{
//                 position: 'absolute', left: 8, right: 8,
//                 top: 16 + j * 13, height: 1,
//                 background: 'rgba(100,70,30,0.15)',
//               }} />
//             ))}
//           </div>
//           {/* Back of flipping page */}
//           <div style={{
//             position: 'absolute', inset: 0,
//             background: 'linear-gradient(135deg, #f0ddb5, #e8cfa0)',
//             borderRadius: '1px 3px 3px 1px',
//             boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
//             backfaceVisibility: 'hidden',
//             transform: 'rotateY(180deg)',
//           }} />
//         </div>

//         {/* Gold page edge strip */}
//         <div style={{
//           position: 'absolute',
//           width: 4, height: 122,
//           right: 0, top: 4,
//           background: 'linear-gradient(90deg, rgba(212,175,55,0.3), rgba(212,175,55,0.5))',
//           borderRadius: '0 2px 2px 0',
//         }} />
//       </div>

//       {/* Floating text label */}
//       <div style={{
//         position: 'absolute', bottom: -24,
//         fontSize: 9, letterSpacing: '0.2em',
//         color: 'rgba(212,175,55,0.5)',
//         fontFamily: "'Playfair Display', serif",
//         whiteSpace: 'nowrap',
//         opacity: hovered ? 0.8 : 0.4,
//         transition: 'opacity 0.3s ease',
//       }}>
//         ✦ REVISION HUB ✦
//       </div>
//     </div>
//   );
// }

import { useRef, useEffect, useState } from 'react';

interface AnimatedBookProps {
  className?: string;
}

// Number of pages cycling through the book
const NUM_PAGES = 6;

export function AnimatedBook({ className = '' }: AnimatedBookProps) {
  const [hovered, setHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  // Each page has its own angle (0 = flat on right side, 180 = fully flipped to left)
  const [pageAngles, setPageAngles] = useState<number[]>(() => Array(NUM_PAGES).fill(0));
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const baseSpeed = hovered ? 0.022 : 0.010;
    // Each page starts flipping staggered in time
    const stagger = (Math.PI * 2) / NUM_PAGES;

    const animate = () => {
      tRef.current += baseSpeed;
      const t = tRef.current;

      const angles = Array.from({ length: NUM_PAGES }, (_, i) => {
        // Each page offset by stagger so they flip one after another
        const phase = t - i * stagger;
        // Map sine wave to 0–180: when phase crosses a cycle it flips fully
        // Use a smooth eased version: slow at start/end, fast in middle
        const raw = (Math.sin(phase) + 1) / 2; // 0→1→0→1 continuously
        return raw * 180;
      });

      setPageAngles(angles);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setMouseOffset({
      x: ((e.clientX - cx) / (rect.width / 2)) * 12,
      y: ((e.clientY - cy) / (rect.height / 2)) * 8,
    });
  };

  const glowIntensity = hovered ? 0.7 : 0.3;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ perspective: '600px', width: 160, height: 200 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouseOffset({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
    >
      {/* Glow behind book */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 120, height: 120,
          background: `radial-gradient(circle, rgba(212,175,55,${glowIntensity * 0.4}) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          transition: 'opacity 0.4s ease',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* 3D Book */}
      <div
        style={{
          width: 100, height: 130,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${-mouseOffset.y}deg) rotateY(${20 + mouseOffset.x}deg)`,
          transition: hovered ? 'transform 0.1s ease' : 'transform 0.5s ease',
          position: 'relative',
        }}
      >
        {/* Back cover */}
        <div style={{
          position: 'absolute', width: 100, height: 130,
          background: 'linear-gradient(135deg, #4a2f0e 0%, #2d1a07 100%)',
          borderRadius: '3px 6px 6px 3px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          transform: 'translateZ(-6px)',
        }} />

        {/* Spine */}
        <div style={{
          position: 'absolute', width: 12, height: 130,
          background: 'linear-gradient(90deg, #2d1a07, #5a3515, #2d1a07)',
          left: -12, top: 0,
          transform: 'rotateY(-90deg) translateZ(-6px)',
          transformOrigin: 'right center',
        }} />

        {/* Front cover */}
        <div style={{
          position: 'absolute', width: 100, height: 130,
          background: 'linear-gradient(160deg, #7a4a1e 0%, #5a3515 40%, #3d2309 100%)',
          borderRadius: '3px 6px 6px 3px',
          boxShadow: hovered
            ? '0 0 30px rgba(212,175,55,0.4), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.3s ease',
          overflow: 'hidden',
        }}>
          {/* Cover decoration */}
          <div style={{
            position: 'absolute', inset: 6,
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 2,
          }} />
          <div style={{
            position: 'absolute', top: 20, left: 0, right: 0,
            textAlign: 'center', fontSize: 9,
            color: 'rgba(212,175,55,0.7)',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '0.1em',
          }}>॥ ज्ञान ॥</div>
          <div style={{
            position: 'absolute', top: '35%', left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 28, opacity: 0.4,
          }}>📜</div>
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            textAlign: 'center', fontSize: 7,
            color: 'rgba(212,175,55,0.5)',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '0.15em',
          }}>GURUKUL</div>

          {/* Sheen overlay on hover */}
          {hovered && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(130deg, transparent 30%, rgba(255,220,100,0.08) 50%, transparent 70%)',
              animation: 'none',
            }} />
          )}
        </div>

        {/* Page layers */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 94, height: 122,
            top: 4, left: 3,
            background: `hsl(40, 30%, ${92 - i * 3}%)`,
            borderRadius: '1px 3px 3px 1px',
            transformOrigin: 'left center',
            transform: `translateZ(${(i + 1) * 1.5}px)`,
          }}>
            {/* Page lines */}
            {Array.from({ length: 8 }, (_, j) => (
              <div key={j} style={{
                position: 'absolute',
                left: 8, right: 8,
                top: 14 + j * 12,
                height: 1,
                background: 'rgba(139,90,43,0.12)',
              }} />
            ))}
          </div>
        ))}

        {/* Multiple continuously flipping pages — each staggered */}
        {pageAngles.map((angle, i) => {
          // Alternate page colours for visual variety
          const frontShade = i % 2 === 0 ? '#fdf6e3' : '#f7edd4';
          const backShade  = i % 2 === 0 ? '#f0ddb5' : '#ead9a8';
          // Pages mid-flip cast a slight shadow; fully open/closed pages are mostly hidden
          const isMidFlip = angle > 20 && angle < 160;
          return (
            <div key={i} style={{
              position: 'absolute',
              width: 94, height: 122,
              top: 4, left: 3,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${-angle}deg) translateZ(${4 + i * 0.4}px)`,
              // Hide pages that are fully resting (not mid-flip) to avoid z-fighting clutter
              opacity: isMidFlip ? 1 : 0.15,
              transition: 'opacity 0.1s',
            }}>
              {/* Front face */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${frontShade}, #f5e6c8)`,
                borderRadius: '1px 3px 3px 1px',
                boxShadow: isMidFlip ? '-3px 0 10px rgba(0,0,0,0.18)' : 'none',
                backfaceVisibility: 'hidden',
              }}>
                {Array.from({ length: 7 }, (_, j) => (
                  <div key={j} style={{
                    position: 'absolute', left: 8, right: 8,
                    top: 16 + j * 13, height: 1,
                    background: 'rgba(100,70,30,0.13)',
                  }} />
                ))}
              </div>
              {/* Back face */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${backShade}, #dfc890)`,
                borderRadius: '1px 3px 3px 1px',
                boxShadow: isMidFlip ? '2px 0 8px rgba(0,0,0,0.12)' : 'none',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}>
                {Array.from({ length: 7 }, (_, j) => (
                  <div key={j} style={{
                    position: 'absolute', left: 8, right: 8,
                    top: 16 + j * 13, height: 1,
                    background: 'rgba(100,70,30,0.10)',
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Gold page edge strip */}
        <div style={{
          position: 'absolute',
          width: 4, height: 122,
          right: 0, top: 4,
          background: 'linear-gradient(90deg, rgba(212,175,55,0.3), rgba(212,175,55,0.5))',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Floating text label */}
      <div style={{
        position: 'absolute', bottom: -24,
        fontSize: 9, letterSpacing: '0.2em',
        color: 'rgba(212,175,55,0.5)',
        fontFamily: "'Playfair Display', serif",
        whiteSpace: 'nowrap',
        opacity: hovered ? 0.8 : 0.4,
        transition: 'opacity 0.3s ease',
      }}>
        ✦ REVISION HUB ✦
      </div>
    </div>
  );
}