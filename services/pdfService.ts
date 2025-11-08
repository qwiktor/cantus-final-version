
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
}

export const getPdfDocument = (source: File | ArrayBuffer): Promise<PDFDocumentProxy> => {
    return new Promise((resolve, reject) => {
        const processSource = (data: ArrayBuffer) => {
            const typedArray = new Uint8Array(data);
            pdfjsLib.getDocument(typedArray).promise.then(resolve).catch(reject);
        };

        if (source instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    processSource(e.target.result as ArrayBuffer);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = () => reject(new Error("FileReader error"));
            reader.readAsArrayBuffer(source);
        } else {
            processSource(source);
        }
    });
};

export const mergePdfs = async (files: File[]): Promise<Uint8Array> => {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }
    return mergedPdf.save();
};


export const renderPageToCanvas = async (page: PDFPageProxy, scale: number = 1.5): Promise<string> => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas.toDataURL('image/jpeg');
};

export const extractAllPagesAsImages = async (pdfDoc: PDFDocumentProxy): Promise<string[]> => {
    const pageImages: string[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const dataUrl = await renderPageToCanvas(page, 1.0); 
        pageImages.push(dataUrl);
    }
    return pageImages;
};