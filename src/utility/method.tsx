import {tify} from 'chinese-conv';

declare module 'chinese-conv' {
    export function sify(input: string): string;
    export function tify(input: string): string;
  }

export const SendCurrentPageName = (pageName: string) => {
    const event = new CustomEvent('PageNameUpdate', {
        detail: {
          name: pageName
        }
    });
    document.dispatchEvent(event);
}

export const toTW = (text: string|undefined) => {
    return tify(text ?? '') as string;
}