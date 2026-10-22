'use client'
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'
import { useRef } from 'react'
const T=["FREE STAINLESS STEEL SHAKER ON ORDERS ₱3,000+","100% AUTHENTIC SUPPLEMENTS DIRECT FROM US/UK IMPORTERS","DOOR-TO-DOOR NATIONWIDE SHIPPING & SAME-DAY BUTUAN DELIVERY","USE CODE 'LIFTZONE10' FOR 10% OFF YOUR FIRST ORDER","HEAVY COMMERCIAL EQUIPMENT INSTALLATION AVAILABLE"]
export default function Ticker(){const base=useMotionValue(0),{scrollY}=useScroll(),v=useSpring(useVelocity(scrollY),{damping:50,stiffness:400}),dir=useRef(1)
 const x=useTransform(base,b=>`${(((b%25)+25)%25)-25}%`),skew=useTransform(v,[-1500,1500],[-10,10])
 useAnimationFrame((_,dt)=>{const vf=v.get()/1000;if(vf<-.01)dir.current=-1;else if(vf>.01)dir.current=1;base.set(base.get()-dir.current*(1+Math.abs(vf)*4)*dt*.004)})
 const row=T.map((t,i)=><span key={i} className="mx-4">{t}<i className="ml-8 inline-block h-2 w-2 rounded-full bg-brand-500 shadow-neon"/></span>)
 return <div className="overflow-hidden whitespace-nowrap border-b border-brand-500 bg-bg py-2 font-head text-xs font-bold"><motion.div style={{x,skewX:skew}} className="inline-block">{row}{row}{row}{row}</motion.div></div>}
