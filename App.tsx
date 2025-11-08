import React, { useState, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import saveAs from 'file-saver';
import { AppStep, PageInfo, SongInfo } from './types';
import { getPdfDocument, mergePdfs, extractAllPagesAsImages } from './services/pdfService';
import { analyzeSheetMusic } from './services/geminiService';
import PdfUploader from './components/PdfUploader';
import FileOrderer from './components/FileOrderer';
import PdfPreview from './components/PdfPreview';
import ActionToolbar from './components/ActionToolbar';
import Spinner from './components/Spinner';
import { PDFDocument } from 'pdf-lib';


const App: React.FC = () => {
    const [appStep, setAppStep] = useState<AppStep>('upload');
    const [files, setFiles] = useState<File[]>([]);
    const [combinedPdfDocProxy, setCombinedPdfDocProxy] = useState<PDFDocumentProxy | null>(null);
    const [combinedPdfBytes, setCombinedPdfBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [songs, setSongs] = useState<SongInfo[]>([]);
    
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadFileName, setDownloadFileName] = useState('Uklad-Cantusow');
    const [isProcessing, setIsProcessing] = useState(false);


    const handleReset = () => {
        setAppStep('upload');
        setFiles([]);
        setCombinedPdfDocProxy(null);
        setCombinedPdfBytes(null);
        setPages([]);
        setSongs([]);
        setLoadingMessage('');
        setError('');
        setIsDownloading(false);
        setIsProcessing(false);
        setDownloadFileName('Uklad-Cantusow');
    };

    const handleFilesSelect = (selectedFiles: File[]) => {
        setFiles(selectedFiles);
        setAppStep('order');
        setError('');
    };

    const handleOrderConfirm = useCallback(async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setAppStep('process');
        setError('');

        try {
            setLoadingMessage('Łączenie plików PDF...');
            const mergedBytes = await mergePdfs(files);
            setCombinedPdfBytes(mergedBytes);

            setLoadingMessage('Analizowanie dokumentu...');
            const pdfDocProxy = await getPdfDocument(mergedBytes.buffer.slice(0));
            setCombinedPdfDocProxy(pdfDocProxy);
            
            setLoadingMessage('Rozpoznawanie utworów (AI)...');
            const images = await extractAllPagesAsImages(pdfDocProxy);
            const detectedSongs = await analyzeSheetMusic(images);
            setSongs(detectedSongs);

            setLoadingMessage('Układanie stron...');
            const newPages: PageInfo[] = [];
            const processedPages = new Set<number>();
            const twoPageSongMap = new Map(detectedSongs.filter(s => s.endPage - s.startPage === 1).map(s => [s.startPage, s]));

            for (let i = 1; i <= pdfDocProxy.numPages; i++) {
                if (processedPages.has(i)) continue;

                if (twoPageSongMap.has(i)) {
                    // Utwór dwustronicowy musi zaczynać się od lewej strony. W książce lewe strony mają parzyste numery (2, 4, ...),
                    // co odpowiada nieparzystym indeksom w naszej tablicy `newPages` (1, 3, ...).
                    // Jeśli aktualna długość `newPages` jest parzysta (0, 2, ...), następna strona byłaby prawą stroną.
                    // Aby temu zapobiec, wstawiamy pusty separator, aby przesunąć początek utworu na lewą stronę.
                    if (newPages.length % 2 === 0) {
                         newPages.push({ type: 'separator', id: `sep-before-${i}` });
                    }
                    newPages.push({ type: 'original', originalPageNum: i, id: `page-${i}` });
                    newPages.push({ type: 'original', originalPageNum: i + 1, id: `page-${i + 1}` });
                    processedPages.add(i);
                    processedPages.add(i + 1);
                } else {
                    newPages.push({ type: 'original', originalPageNum: i, id: `page-${i}` });
                    processedPages.add(i);
                }
            }
            
            setPages(newPages);
            setAppStep('preview');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Wystąpił nieoczekiwany błąd.');
            setAppStep('upload');
        } finally {
            setLoadingMessage('');
            setIsProcessing(false);
        }
    }, [files]);
    
    const generateFinalPdf = async (): Promise<Uint8Array> => {
        if (!combinedPdfBytes) throw new Error("Missing combined PDF data");
    
        const finalPdfDoc = await PDFDocument.create();
        const sourcePdfDoc = await PDFDocument.load(combinedPdfBytes);
    
        for (const pageInfo of pages) {
            if (pageInfo.type === 'separator') {
                const { width, height } = sourcePdfDoc.getPage(0).getSize();
                finalPdfDoc.addPage([width, height]);
            } else if (pageInfo.originalPageNum) {
                const [copiedPage] = await finalPdfDoc.copyPages(sourcePdfDoc, [pageInfo.originalPageNum - 1]);
                finalPdfDoc.addPage(copiedPage);
            }
        }
    
        return finalPdfDoc.save();
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const pdfBytes = await generateFinalPdf();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            let filename = downloadFileName.trim() || 'Uklad-Cantusow';
            if (!filename.toLowerCase().endsWith('.pdf')) {
                filename += '.pdf';
            }
            saveAs(blob, filename);
        } catch (err: any) {
             console.error(err);
             setError(err.message || 'Nie udało się wygenerować pliku PDF.');
        } finally {
            setIsDownloading(false);
        }
    };


    const renderContent = () => {
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-xl font-semibold text-red-400 mb-4">Wystąpił błąd</h2>
                    <p className="text-gray-400 max-w-md mb-6">{error}</p>
                    <button onClick={handleReset} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">
                        Spróbuj ponownie
                    </button>
                </div>
            )
        }
        
        switch (appStep) {
            case 'upload':
                return <PdfUploader onFilesSelect={handleFilesSelect} isLoading={isProcessing} />;
            case 'order':
                return <FileOrderer files={files} setFiles={setFiles} onConfirm={handleOrderConfirm} isProcessing={isProcessing} />;
            case 'process':
                 return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Spinner className="w-12 h-12 text-indigo-400" />
                        <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
                    </div>
                );
            case 'preview':
                return (
                    <div className="w-full h-full pt-32">
                        <ActionToolbar 
                            songs={songs} 
                            onDownload={handleDownload}
                            onReset={handleReset}
                            isDownloading={isDownloading}
                            downloadFileName={downloadFileName}
                            setDownloadFileName={setDownloadFileName}
                        />
                        <PdfPreview pages={pages} pdfDoc={combinedPdfDocProxy} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-850">
           <header className="p-4 bg-gray-950 shadow-md z-30 w-full border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl font-bold text-white">Układanie stron dla Cantusów</h1>
                </div>
           </header>
           <main className="flex-grow relative overflow-y-auto">
                {renderContent()}
           </main>
           <footer className="p-4 bg-gray-950 text-center text-xs text-gray-500 w-full border-t border-gray-700/50">
                © {new Date().getFullYear()} Układanie Stron dla Cantusów. Wszelkie prawa zastrzeżone.
           </footer>
        </div>
    );
};

export default App;