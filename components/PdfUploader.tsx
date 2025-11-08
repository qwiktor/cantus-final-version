import React, { useState, DragEvent, useCallback } from 'react';
import Spinner from './Spinner';

interface PdfUploaderProps {
    onFilesSelect: (files: File[]) => void;
    isLoading: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFilesSelect, isLoading }) => {
    const [error, setError] = useState<string>('');
    const [isDragActive, setIsDragActive] = useState(false);

    const handleFileSelect = useCallback((files: FileList | null) => {
        setError('');
        if (!files || files.length === 0) {
            return;
        }

        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');

        if (pdfFiles.length !== files.length) {
            setError('Niektóre pliki zostały odrzucone. Akceptowane są tylko pliki PDF.');
        }

        if (pdfFiles.length > 0) {
            onFilesSelect(pdfFiles);
        }
    }, [onFilesSelect]);

    const handleDrag = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    }, [handleFileSelect]);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        handleFileSelect(e.target.files);
    }, [handleFileSelect]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-lg text-center">
                <h1 className="text-3xl font-bold text-white mb-4">Uporządkuj swoje nuty</h1>
                <p className="text-lg text-gray-400 mb-8">
                    Połącz wiele plików PDF z nutami w jeden dokument i automatycznie rozłóż utwory dwustronicowe na sąsiednich stronach, aby ułatwić ich czytanie.
                </p>

                <label
                    htmlFor="file-input"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors duration-300 ease-in-out
                        ${isDragActive ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-900/30'}`}
                >
                    <input id="file-input" type="file" multiple accept=".pdf,application/pdf" className="hidden" onChange={handleChange} disabled={isLoading} />

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center">
                            <Spinner className="w-8 h-8 text-indigo-400" />
                            <p className="mt-4 text-lg text-gray-300">Przetwarzanie...</p>
                        </div>
                    ) : isDragActive ? (
                        <p className="text-indigo-300 font-semibold">Upuść pliki tutaj...</p>
                    ) : (
                        <div className="flex flex-col items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-300">
                                Przeciągnij i upuść pliki PDF tutaj, lub <span className="font-semibold text-indigo-400">kliknij, aby wybrać</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Dozwolone tylko pliki *.pdf</p>
                        </div>
                    )}
                </label>

                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            </div>
        </div>
    );
};

export default PdfUploader;
