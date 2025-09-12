import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    isFounder: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ isFounder }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const founderColors = ["#facc15", "#fbbf24", "#f59e0b", "#d97706", "#ffffff"];
        const regularColors = ["#0057FF", "#3385FF", "#66A7FF", "#004AD8", "#fbbf24"];
        const colors = isFounder ? founderColors : regularColors;
        
        const particles: { x: number, y: number, color: string, size: number, speedX: number, speedY: number, angle: number, spin: number }[] = [];
        const maxParticles = isFounder ? 250 : 150;
        const particleSize = isFounder ? 7 : 5;

        function createParticles() {
            for (let i = 0; i < maxParticles; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height - height,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * particleSize + 5,
                    speedX: Math.random() * 3 - 1.5,
                    speedY: Math.random() * 5 + 2,
                    angle: Math.random() * 360,
                    spin: Math.random() < 0.5 ? -1 : 1
                });
            }
        }

        function drawParticles() {
            ctx!.clearRect(0, 0, width, height);
            particles.forEach(p => {
                ctx!.save();
                ctx!.fillStyle = p.color;
                 if (isFounder) {
                    ctx!.shadowBlur = 10;
                    ctx!.shadowColor = p.color;
                }
                ctx!.translate(p.x, p.y);
                ctx!.rotate(p.angle * Math.PI / 180);
                ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx!.restore();
            });
        }

        function updateParticles() {
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.angle += p.spin * 5;
                if (p.y > height) {
                    p.y = -20;
                    p.x = Math.random() * width;
                }
            });
        }

        let animationFrameId: number;

        function animate() {
            drawParticles();
            updateParticles();
            animationFrameId = requestAnimationFrame(animate);
        }
        
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        
        window.addEventListener('resize', handleResize);

        createParticles();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [isFounder]);

    return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-50 pointer-events-none" />;
};

export default Confetti;