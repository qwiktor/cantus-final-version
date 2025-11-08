import { GoogleGenAI, Type } from "@google/genai";
import type { Handler } from "@netlify/functions";

// Ta funkcja będzie działać na serwerze, a nie w przeglądarce.
// Ma bezpieczny dostęp do klucza API.

const PROMPT = `Jesteś ekspertem w dziedzinie muzyki chóralnej, specjalizującym się w analizie nut. Twoim zadaniem jest przeanalizowanie dostarczonych obrazów stron z nutami i zidentyfikowanie każdego utworu. Dla każdego utworu określ jego tytuł, numer strony początkowej oraz numer strony końcowej.

Ważne zasady:
1. Numery stron są oparte na 1-indeksowej kolejności dostarczonych obrazów (pierwszy obraz to strona 1, drugi to strona 2, itd.).
2. Tytuł utworu jest zazwyczaj napisany dużą czcionką na górze pierwszej strony utworu.
3. Utwór może mieć jedną lub więcej stron. Musisz dokładnie określić, gdzie się kończy. Koniec utworu jest zwykle oznaczony podwójną kreską taktu lub oznaczeniem "Fine".
4. Zwróć wynik wyłącznie jako tablicę obiektów JSON, zgodnie z podanym schematem. Nie dodawaj żadnych dodatkowych wyjaśnień ani formatowania (np. markdown).`;

const schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Tytuł utworu." },
            startPage: { type: Type.INTEGER, description: "Numer strony, na której utwór się zaczyna (indeksowany od 1)." },
            endPage: { type: Type.INTEGER, description: "Numer strony, na której utwór się kończy (indeksowany od 1)." }
        },
        required: ["title", "startPage", "endPage"]
    }
};

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { API_KEY } = process.env;
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "Klucz API Gemini nie jest skonfigurowany po stronie serwera." }) };
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const { imageParts } = JSON.parse(event.body || '{}');
        if (!imageParts || !Array.isArray(imageParts)) {
            return { statusCode: 400, body: JSON.stringify({ error: "Brakujące lub nieprawidłowe dane obrazów." }) };
        }

        const contents = { parts: [{ text: PROMPT }, ...imageParts] };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }
        
        // Zwracamy czysty JSON do przeglądarki
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText,
        };

    } catch (error: any) {
        console.error("Błąd w funkcji serwerowej:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message || "Wystąpił wewnętrzny błąd serwera." })
        };
    }
};
