import { getLanguageLabel } from "../utils/languages";

export interface TranslationConfig {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model?: string;
}

export interface TranslationResult {
  translatedText: string;
  success: boolean;
  error?: string;
}

class TranslationService {
  async translate(config: TranslationConfig): Promise<TranslationResult> {
    const { text, sourceLanguage, targetLanguage, provider, apiKey, model } = config;

    if (!text || !apiKey) {
      return {
        translatedText: text,
        success: false,
        error: "Missing text or API key",
      };
    }

    // If source and target are the same, no translation needed
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        success: true,
      };
    }

    const sourceLang = getLanguageLabel(sourceLanguage);
    const targetLang = getLanguageLabel(targetLanguage);

    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translation, nothing else:\n\n${text}`;

    try {
      switch (provider) {
        case "openai":
          return await this.translateWithOpenAI(prompt, apiKey, model || "gpt-4o-mini");
        case "anthropic":
          return await this.translateWithAnthropic(prompt, apiKey, model || "claude-3-5-haiku-20241022");
        case "gemini":
          return await this.translateWithGemini(prompt, apiKey, model || "gemini-2.5-flash");
        default:
          return {
            translatedText: text,
            success: false,
            error: `Unknown provider: ${provider}`,
          };
      }
    } catch (error) {
      console.error("Translation error:", error);
      return {
        translatedText: text,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async translateWithOpenAI(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<TranslationResult> {
    try {
      // Try Responses API first (newer models)
      const baseUrl = localStorage.getItem("cloudReasoningBaseUrl") || "https://api.openai.com/v1";

      // Check if model requires Responses API
      const requiresResponsesApi = model.startsWith("gpt-5") || model.startsWith("o3") || model.startsWith("o4");

      if (requiresResponsesApi) {
        const response = await fetch(`${baseUrl}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: [{ type: "text", text: prompt }],
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.output?.[0]?.text || data.output?.[0]?.content?.[0]?.text || "";

        return {
          translatedText: translatedText.trim(),
          success: true,
        };
      }

      // Use Chat Completions API for older models
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content || "";

      return {
        translatedText: translatedText.trim(),
        success: true,
      };
    } catch (error) {
      console.error("OpenAI translation error:", error);
      throw error;
    }
  }

  private async translateWithAnthropic(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<TranslationResult> {
    try {
      // Use IPC for Anthropic to avoid CORS
      if (typeof window !== "undefined" && window.electronAPI?.anthropicRequest) {
        const result = await window.electronAPI.anthropicRequest({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.3,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        const translatedText = result.content?.[0]?.text || "";
        return {
          translatedText: translatedText.trim(),
          success: true,
        };
      }

      throw new Error("Anthropic IPC bridge not available");
    } catch (error) {
      console.error("Anthropic translation error:", error);
      throw error;
    }
  }

  private async translateWithGemini(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<TranslationResult> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        translatedText: translatedText.trim(),
        success: true,
      };
    } catch (error) {
      console.error("Gemini translation error:", error);
      throw error;
    }
  }
}

export default new TranslationService();
