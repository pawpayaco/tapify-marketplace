import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function ImageModalGallery({ images, className = "" }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square cursor-pointer overflow-visible"
          onMouseEnter={() => !isMobile && setHoveredIndex(index)}
          onMouseLeave={() => !isMobile && setHoveredIndex(null)}
        >
          <motion.div
            animate={hoveredIndex === index ? {
              scale: 2,
              zIndex: 30,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            } : {
              scale: 1,
              zIndex: 1,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/20 pointer-events-none"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      ))}
    </div>
  );
}
