/** GET /api/debug-deepl — DeepL接続テスト用 (開発時のみ使用) */
export async function GET() {
  const apiUrl = process.env.DEEPL_API_URL;
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiUrl || !apiKey) {
    return Response.json({
      ok: false,
      error: "環境変数が未設定",
      DEEPL_API_URL: apiUrl ?? "(未設定)",
      DEEPL_API_KEY: apiKey ? "(設定済み)" : "(未設定)",
    });
  }

  try {
    const res = await fetch(`${apiUrl}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: ["こんにちは"], target_lang: "DE" }),
    });

    const body = await res.json();

    return Response.json({
      ok: res.ok,
      status: res.status,
      result: body,
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) });
  }
}
