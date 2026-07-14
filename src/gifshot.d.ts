declare module "gifshot" {
  export interface GIFOptions {
    images?: string[];
    gifWidth?: number;
    gifHeight?: number;
    interval?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
    filter?: string;
    text?: string;
    fontWeight?: string;
    fontSize?: string;
    fontFamily?: string;
    fontColor?: string;
    textAlign?: string;
    textBaseline?: string;
    textXCoordinate?: number;
    textYCoordinate?: number;
    watermark?: string;
    watermarkHeight?: number;
    watermarkWidth?: number;
    watermarkXCoordinate?: number;
    watermarkYCoordinate?: number;
  }

  export interface GIFResult {
    error: boolean;
    errorCode?: string;
    errorMsg?: string;
    image: string;
  }

  export function createGIF(
    options: GIFOptions,
    callback: (result: GIFResult) => void
  ): void;
}
