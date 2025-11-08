import React, { useState, useRef } from 'react';
import { Bars3Icon } from './icons';
import Spinner from './Spinner';

interface FileOrdererProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    onConfirm: () => void;
    isProcessing: boolean;
}

const FileOrderer: React.FC<FileOrdererProps> = ({ files, setFiles, onConfirm, isProcessing }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const dragItemNode = useRef<HTMLLIElement | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        setDraggedIndex(index);
        dragItemNode.current = e.currentTarget;
        e.currentTarget.addEventListener('dragend', handleDragEnd);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
        if (draggedIndex !== null && dragItemNode.current !== e.currentTarget) {
            const newFiles = [...files];
            const draggedItem = newFiles.splice(draggedIndex, 1)[0];
            newFiles.splice(targetIndex, 0, draggedItem);
            setDraggedIndex(targetIndex);
            setFiles(newFiles);
        }
    };

    const handleDragEnd = () => {
        if (dragItemNode.current) {
            dragItemNode.current.removeEventListener('dragend', handleDragEnd);
        }
        setDraggedIndex(null);
        dragItemNode.current = null;
    };
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl">
                <h1 className="text-2xl font-bold text-center text-white mb-2">Ustal kolejność plików</h1>
                <p className="text-center text-gray-400 mb-6">Przeciągnij i upuść pliki, aby ułożyć je w odpowiedniej kolejności przed połączeniem.</p>
                
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                    {files.map((file, index) => (
                        <li
                            key={file.name + index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            className={`flex items-center p-3 bg-gray-800 rounded-md cursor-grab transition-all ${draggedIndex === index ? 'opacity-50 scale-105 shadow-lg' : 'opacity-100'}`}
                        >
                            <Bars3Icon className="w-5 h-5 text-gray-500 mr-4 flex-shrink-0" />
                            <span className="text-gray-300 truncate" title={file.name}>{file.name}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-850 focus:ring-indigo-500 transition flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Spinner className="w-5 h-5" />
                                <span>Przetwarzanie...</span>
                            </>
                        ) : (
                            "Połącz i ułóż strony"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileOrderer;
