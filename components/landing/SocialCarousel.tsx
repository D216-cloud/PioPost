
"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import c1 from "@/assets/carousel-1.jpg";
import c2 from "@/assets/carousel-2.jpg";
import c3 from "@/assets/carousel-3.jpg";
import c4 from "@/assets/carousel-4.jpg";
import c6 from "@/assets/carousel-6.jpg";
import c7 from "@/assets/carousel-7.jpg";

const images = [c1, c2, c3, c4, c6, c7];
// Duplicate for seamless loop
const allImages = [...images, ...images];

export function SocialCarousel() {
  return (
    <div className="w-full overflow-hidden py-10">
      <div className="flex w-fit">
        <motion.div 
          className="flex gap-6 px-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 30, 
            ease: "linear", 
            repeat: Infinity 
          }}
        >
          {allImages.map((img, idx) => (
            <motion.div 
              key={idx} 
              className="w-[180px] md:w-[240px] aspect-[9/16] shrink-0 rounded-3xl overflow-hidden relative shadow-xl border border-white/10 cursor-pointer"
              whileHover={{ 
                rotateY: 12, 
                rotateX: -5,
                scale: 1.03,
                z: 20,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              style={{ transformStyle: "preserve-3d" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Image 
                src={img} 
                alt={`Carousel ${idx}`} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 180px, 240px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
