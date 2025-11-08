import { SongInfo } from "../types";

export const analyzeSheetMusic = async (pageImages: string[]): Promise<SongInfo[]> => {
    try {
        const imageParts = pageImages.map((dataUrl) => {
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) {
                throw new Error(`Nieprawidłowy format danych obrazu: ${dataUrl.substring(0, 50)}...`);
            }
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg',
                },
            };
        });

        // Wywołaj naszą bezpieczną funkcję serwerową zamiast bezpośrednio API Gemini
        const response = await fetch('/.netlify/functions/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageParts: imageParts }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
        }

        const songs: SongInfo[] = await response.json();
        
        if (!Array.isArray(songs)) {
            console.error("Odpowiedź serwera nie jest tablicą:", songs);
            throw new Error("Otrzymano nieprawidłowy format danych z serwera.");
        }
        
        return songs;

    } catch (error: any) {
        console.error("Błąd podczas analizy AI:", error);
        
        let errorMessage = "Analiza AI nie powiodła się. Spróbuj ponownie.";
        if (error.message) {
            errorMessage = `Błąd analizy AI: ${error.message}`;
        }
        
        throw new Error(errorMessage);
    }
};
