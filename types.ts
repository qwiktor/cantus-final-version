
export type AppStep = 'upload' | 'order' | 'process' | 'preview';

export interface PageInfo {
  type: 'original' | 'separator';
  originalPageNum?: number;
  id: string;
}

export interface SongInfo {
    title: string;
    startPage: number;
    endPage: number;
}