import { EmpresaProvider } from "../contexts/EmpresaContext";

export default function AdminLayout({ children }) {
  return <EmpresaProvider>{children}</EmpresaProvider>;
}
