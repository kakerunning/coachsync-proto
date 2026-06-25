import { cookies } from "next/headers";
import type { Lang } from "./translations";

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const lang = cookieStore.get("cs_lang")?.value;
  return (["ja", "en", "de"] as Lang[]).includes(lang as Lang)
    ? (lang as Lang)
    : "ja";
}
