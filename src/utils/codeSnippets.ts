export interface SnippetParams {
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

function escapePythonTriple(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
}

export function generateJavaScriptSnippet(params: SnippetParams): string {
  const sys = JSON.stringify(params.systemInstruction);
  const prompt = JSON.stringify(params.userPrompt);
  const configLines = [
    params.systemInstruction.trim() ? `    systemInstruction: ${sys},` : null,
    `    temperature: ${params.temperature.toFixed(2)},`,
    `    topP: ${params.topP.toFixed(2)},`,
    `    maxOutputTokens: ${params.maxOutputTokens},`,
  ]
    .filter(Boolean)
    .join('\n');

  return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: ${JSON.stringify(params.model)},
  contents: ${prompt},
  config: {
${configLines}
  },
});

console.log(response.text);
console.log(response.usageMetadata);`;
}

export function generatePythonSnippet(params: SnippetParams): string {
  const sys = escapePythonTriple(params.systemInstruction);
  const prompt = escapePythonTriple(params.userPrompt);
  const configLines = [
    params.systemInstruction.trim() ? `        system_instruction="""${sys}""",` : null,
    `        temperature=${params.temperature.toFixed(2)},`,
    `        top_p=${params.topP.toFixed(2)},`,
    `        max_output_tokens=${params.maxOutputTokens},`,
  ]
    .filter(Boolean)
    .join('\n');

  return `import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model=${JSON.stringify(params.model)},
    contents="""${prompt}""",
    config=types.GenerateContentConfig(
${configLines}
    ),
)

print(response.text)
print(response.usage_metadata)`;
}
