import { getLang } from "@/lib/get-lang";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const lang = await getLang();
  return <LoginForm lang={lang} />;
}
