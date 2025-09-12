import React from 'react';

const Globe: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-2 opacity-25 pointer-events-none">
      <style>
        {`
          @keyframes rotate-globe {
            0% { transform: rotateY(0) rotateX(20deg); }
            100% { transform: rotateY(360deg) rotateX(20deg); }
          }
          @keyframes pulse-dot {
            0%, 100% { transform: scale(0.8); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 1; }
          }
          .globe-container {
            width: 100%;
            height: 100%;
            perspective: 1000px;
          }
          .globe {
            width: 1000px;
            height: 1000px;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-top: -500px;
            margin-left: -500px;
            transform-style: preserve-3d;
            animation: rotate-globe 40s linear infinite;
          }
          .globe-sphere {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(0, 87, 255, 0.2), transparent 70%);
          }
          .globe-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 1px solid rgba(0, 87, 255, 0.2);
          }
          .dot {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #0057FF;
            animation: pulse-dot 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="globe-container">
        <div className="globe">
          <div className="globe-sphere" />
          <div className="globe-ring" style={{ transform: 'rotateY(0deg)' }} />
          <div className="globe-ring" style={{ transform: 'rotateY(60deg)' }} />
          <div className="globe-ring" style={{ transform: 'rotateY(120deg)' }} />
          <div className="globe-ring" style={{ transform: 'rotateX(90deg) rotateY(0deg)' }} />
          <div className="globe-ring" style={{ transform: 'rotateX(90deg) rotateY(60deg)' }} />
          <div className="globe-ring" style={{ transform: 'rotateX(90deg) rotateY(120deg)' }} />
          
          {/* Simulated backer locations */}
          <div className="dot" style={{ top: '20%', left: '50%', transform: 'translateZ(491px) translateX(-50%)', animationDelay: '0.2s' }}></div>
          <div className="dot" style={{ top: '40%', left: '70%', transform: 'translateZ(367px) translateX(-50%)', animationDelay: '0.5s' }}></div>
          <div className="dot" style={{ top: '60%', left: '30%', transform: 'translateZ(300px) translateX(-50%)', animationDelay: '0.8s' }}></div>
          <div className="dot" style={{ top: '75%', left: '80%', transform: 'translateZ(150px) translateX(-50%)', animationDelay: '1.1s' }}></div>
          <div className="dot" style={{ top: '30%', left: '10%', transform: 'translateZ(200px) translateX(-50%)', animationDelay: '1.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Globe;