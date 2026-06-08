"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function signup(_prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as "ATHLETE" | "COACH";

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (authError) {
    return { error: authError.message };
  }

  try {
    await prisma.user.create({ data: { email, name, role } });
  } catch {
    return { error: "ユーザー登録に失敗しました。このメールアドレスはすでに使用されている可能性があります。" };
  }

  if (role === "COACH") {
    redirect("/coach");
  }
  redirect("/athlete");
}
