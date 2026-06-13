interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export class Cosmos {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private nebulae: Nebula[] = [];
  private animationId: number | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.draw();
  }

  private init(): void {
    const starCount = Math.floor((this.width * this.height) / 8000);
    this.stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    }));

    this.nebulae = [
      { x: this.width * 0.2, y: this.height * 0.3, radius: 300, color: '201, 169, 110' },
      { x: this.width * 0.8, y: this.height * 0.7, radius: 250, color: '100, 100, 180' },
      { x: this.width * 0.5, y: this.height * 0.1, radius: 200, color: '80, 120, 160' },
    ];
  }

  private draw(): void {
    const { ctx, width, height } = this;

    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, width, height);

    for (const nebula of this.nebulae) {
      const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
      );
      gradient.addColorStop(0, `rgba(${nebula.color}, 0.03)`);
      gradient.addColorStop(0.5, `rgba(${nebula.color}, 0.01)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    for (const star of this.stars) {
      const pulse = Math.sin(star.pulse) * 0.2 + 0.8;
      const alpha = star.opacity * pulse;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      if (star.size > 1) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
        ctx.fill();
      }
    }
  }

  private animate(): void {
    for (const star of this.stars) {
      star.pulse += star.pulseSpeed;
    }
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', () => this.resize());
  }
}
