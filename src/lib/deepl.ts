/**
 * DeepL API でテキストを翻訳する。
 * 失敗しても例外をスローせず null を返す (メイン処理を止めない)。
 */
export async function translate(
  text: string,
  targetLang: "DE" | "JA"
): Promise<string | null> {
  if (!text.trim()) return null;

  // 環境変数は関数内で読む (モジュール初期化タイミングの問題を避けるため)
  const apiUrl = process.env.DEEPL_API_URL;
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error("[deepl] 環境変数 DEEPL_API_URL または DEEPL_API_KEY が未設定");
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text], target_lang: targetLang }),
    });

    if (!res.ok) {
      console.error(`[deepl] API エラー: status=${res.status}`);
      return null;
    }

    const data = await res.json();
    const result = data.translations?.[0]?.text ?? null;
    console.log(`[deepl] 翻訳完了: "${text.substring(0, 30)}..." → "${String(result).substring(0, 30)}..."`);
    return result;
  } catch (e) {
    console.error("[deepl] fetch 例外:", e);
    return null;
  }
}
