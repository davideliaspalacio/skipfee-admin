import { redirect } from "next/navigation";

// La raíz manda al tablero de pedidos. Si no hay sesión, el layout de (admin)
// rebota a /login conservando la intención.
export default function Home() {
  redirect("/pedidos");
}
