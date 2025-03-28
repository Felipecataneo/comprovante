import Comprovante from "@/components/comprovante";


export default function HomePage() {
  // Como a lógica do cliente está encapsulada em Comprovante,
  // esta página pode permanecer um Server Component por padrão.
  return (
    <main> {/* Ou outra tag container se preferir */}
      <Comprovante />
    </main>
  );
}