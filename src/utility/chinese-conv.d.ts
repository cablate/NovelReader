declare module 'chinese-conv' {
    import * as TongwenSt from '../../node_modules/chinese-conv/tongwen/tongwen-st';
    import * as TongwenTs from '../../node_modules/chinese-conv/tongwen/tongwen-ts';
  
    export interface YourModule {
      sify: typeof TongwenTs.default;
      tify: typeof TongwenSt.default;
    }
  
    const yourModule: YourModule;
  
    export default yourModule;
  }