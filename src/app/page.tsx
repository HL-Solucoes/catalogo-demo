import { Hero } from "@/components/global/hero";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Featured section */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="animate-fade-in-up mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Por que escolher a gente?
        </h2>
        <p className="animate-fade-in-up delay-100 mx-auto mb-12 max-w-xl text-muted-foreground">
          Trabalhamos com atacado para lojistas de todo o Brasil. Qualidade,
          preço justo e atendimento humanizado.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              emoji: "🤠",
              title: "Estilo Autêntico",
              desc: "Moda country legítima, do chapéu à bota.",
            },
            {
              emoji: "📦",
              title: "Atacado Facilitado",
              desc: "Pedido simples, direto pelo WhatsApp.",
            },
            {
              emoji: "💰",
              title: "Preço Justo",
              desc: "Margem saudável para sua revenda.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="animate-fade-in-up animate-stagger rounded-xl border bg-card p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
              style={{ "--stagger": index + 3 } as React.CSSProperties}
            >
              <span className="mb-3 block text-4xl">{item.emoji}</span>
              <h3 className="mb-1 font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
