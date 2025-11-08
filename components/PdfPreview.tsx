import React, { useMemo, useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageInfo } from '../types';
import { renderPageToCanvas } from '../services/pdfService';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';
import Spinner from './Spinner';

interface PageProps {
    pageInfo: PageInfo | null;
    pdfDoc: PDFDocumentProxy | null;
    isPlaceholder?: boolean;
}

const Page: React.FC<PageProps> = ({ pageInfo, pdfDoc, isPlaceholder }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const renderPage = React.useCallback(async () => {
        if (!pageInfo || pageInfo.type === 'separator' || !pdfDoc || !canvasRef.current || !pageInfo.originalPageNum) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const page = await pdfDoc.getPage(pageInfo.originalPageNum);
            const dataUrl = await renderPageToCanvas(page, 1.2);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    setIsLoading(false);
                };
                img.src = dataUrl;
            }
        } catch (error) {
            console.error('Failed to render page:', error);
            setIsLoading(false);
        }
    }, [pageInfo, pdfDoc]);

    useEffect(() => {
        if (!isPlaceholder) {
            renderPage();
        } else {
            setIsLoading(false);
        }
    }, [renderPage, isPlaceholder, pageInfo]);

    const pageStyle = "w-full aspect-[8.5/11] rounded-md shadow-lg transition-all bg-gray-800";
    const placeholderStyle = "w-full aspect-[8.5/11] rounded-md bg-transparent";

    if (isPlaceholder) {
        return <div className={placeholderStyle} />;
    }
    
    if (pageInfo?.type === 'separator') {
        return (
            <div className={`relative ${pageStyle} flex items-center justify-center bg-gray-900`}>
                <p className="text-gray-600 text-sm font-medium">Pusta strona</p>
            </div>
        );
    }

    return (
        <div className={`relative ${pageStyle}`}>
            {(isLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-md">
                    <Spinner className="w-8 h-8 text-white"/>
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-full rounded-md" />
            {pageInfo && <div className="absolute bottom-2 right-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                {pageInfo.originalPageNum}
            </div>}
        </div>
    );
};


interface PdfPreviewProps {
  pages: PageInfo[];
  pdfDoc: PDFDocumentProxy | null;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ pages, pdfDoc }) => {
    const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

    const spreads = useMemo(() => {
        const layoutPages: (PageInfo | null)[] = [null, ...pages];
        if (layoutPages.length % 2 !== 0) {
            layoutPages.push(null);
        }

        const result: (PageInfo | null)[][] = [];
        for (let i = 0; i < layoutPages.length; i += 2) {
            result.push([layoutPages[i], layoutPages[i + 1]]);
        }
        return result;
    }, [pages]);

    useEffect(() => {
        setCurrentSpreadIndex(0);
    }, [pages]);
    
    const handleNext = () => {
        setCurrentSpreadIndex(prev => Math.min(prev + 1, spreads.length - 1));
    };

    const handlePrev = () => {
        setCurrentSpreadIndex(prev => Math.max(0, prev - 1));
    };

    const currentSpread = spreads[currentSpreadIndex];
    if (!currentSpread) return null;

    const [leftPage, rightPage] = currentSpread;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center h-full">
            <div className="relative w-full max-w-7xl mx-auto flex items-center justify-center">
                {/* Prev Button */}
                <button 
                    onClick={handlePrev} 
                    disabled={currentSpreadIndex === 0}
                    className="absolute left-0 -translate-x-full top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/80 disabled:opacity-0 disabled:cursor-default transition-all"
                    aria-label="Poprzednia strona"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-white"/>
                </button>

                {/* Spread Content */}
                <div className="flex justify-center items-start gap-8 w-full">
                    <div className="w-1/2">
                         <Page
                            pageInfo={leftPage}
                            pdfDoc={pdfDoc}
                            isPlaceholder={!leftPage}
                         />
                    </div>
                    
                    <div className="w-1/2">
                         <Page
                            pageInfo={rightPage}
                            pdfDoc={pdfDoc}
                            isPlaceholder={!rightPage}
                         />
                    </div>
                </div>

                 {/* Next Button */}
                 <button 
                    onClick={handleNext}
                    disabled={currentSpreadIndex === spreads.length - 1}
                    className="absolute right-0 translate-x-full top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/80 disabled:opacity-0 disabled:cursor-default transition-all"
                    aria-label="Następna strona"
                >
                    <ArrowRightIcon className="w-6 h-6 text-white"/>
                </button>
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                    Rozkładówka {currentSpreadIndex + 1} z {spreads.length}
                </p>
            </div>
        </div>
    );
};

export default PdfPreview;