// esc-pos-encoder.d.ts
declare module 'esc-pos-encoder' {
    export class EscPosEncoder {
      initialize(): void;
      text(text: string): void;
      bold(isBold: boolean): void;
      size(width: number, height: number): void;
      align(position: 'left' | 'center' | 'right'): void;
      encode(): any;
      reset(): void;
      underline(isUnderlined: boolean): void;
    }
  }
  