import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden md:min-h-[80vh]">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20" />

      {/* Subtle decorative circles — with floating animation */}
      <div className="animate-float absolute top-20 -left-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-800/10" />
      <div className="animate-float-slow absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-orange-200/20 blur-3xl dark:bg-orange-800/10" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="animate-fade-in-up mb-4 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Atacado de moda country
        </p>
        <h1 className="animate-fade-in-up delay-100 mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          NO LIMITE
          <br />
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
            DO LAÇO
          </span>
        </h1>
        <p className="animate-fade-in-up delay-200 mx-auto mb-10 max-w-md text-lg text-muted-foreground">
          Atacado de moda country e acessórios. Qualidade, estilo e os melhores
          preços para sua loja.
        </p>
        <Button
          asChild
          size="lg"
          className="animate-fade-in-up delay-300 group gap-2 rounded-full px-8 text-base"
        >
          <Link href="/produtos">
            Ver Produtos
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
