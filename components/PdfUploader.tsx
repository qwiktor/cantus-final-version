import React, { useCallback, useState } from 'react';

interface PdfUploaderProps {
    onFilesSelect: (files: File[]) => void;
    isLoading: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFilesSelect, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            onFilesSelect(Array.from(files));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            // Fix: Explicitly type 'file' as 'File' to resolve type inference issue.
            const pdfFiles = Array.from(files).filter((file: File) => file.type === 'application/pdf');
            if (pdfFiles.length > 0) {
                onFilesSelect(pdfFiles);
            }
        }
    }, [onFilesSelect]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                Przygotuj nuty do druku w mgnieniu oka
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-400">
                Narzędzie inteligentnie analizuje utwory, dodaje puste strony i układa wszystko tak, aby druk dwustronny był idealny. Koniec z ręcznym przekładaniem kartek!
            </p>
            <div className="mt-12 w-full">
                <label
                    htmlFor="pdf-upload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    className={`w-full max-w-lg mx-auto p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'}`}
                >
                    <input
                        id="pdf-upload"
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        multiple
                    />
                    <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p className="text-lg font-semibold text-gray-300">Przeciągnij i upuść pliki PDF tutaj</p>
                        <p className="text-sm text-gray-500 mt-1">lub kliknij, aby wybrać pliki</p>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default PdfUploader;