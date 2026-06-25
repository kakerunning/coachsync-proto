import { getLang } from "@/lib/get-lang";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const lang = await getLang();
  return <SignupForm lang={lang} />;
}
