import React from 'react';
import logo from '@/../public/CareerServicesLogo2.png'
import logo2 from '@/../public/Pace-University-Career-Services-logo.png'

const AuthLeftSide: React.FC = () => {
  return (
    <div className="flex-1 lg:flex hidden relative">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: "url('https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg')"
      }}></div>
      
      {/* White gradient overlay */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 250, 252, 0.8) 50%,
            rgba(241, 245, 249, 0.95) 100%
          )`
      }}></div>
      
      {/* Content - Centered */}
      <div className="relative z-10 flex flex-col justify-center items-center text-black px-16 py-12 text-center h-full w-full">
        {/* LinkSweep Title */}
        <h1 className="text-6xl font-bold tracking-tight drop-shadow-lg mb-16 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">LinkSweep</h1>
        
        {/* Animated Chain Icon */}
        <div className="flex justify-center mb-16">
          <div className="text-5xl animate-[bounce_3s_ease-in-out_infinite]">🔗</div>
        </div>

        {/* University Logo */}
        <div>
          <img 
            src={logo}
            alt="Pace University Career Services"
            className="mx-auto max-w-sm h-auto opacity-95 drop-shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLeftSide;