'use client'

import {ReactNode, createContext, useContext, useState} from "react";

type ContextType = {
    pageName: string;
    setPageName: (value: string) => void;
};

const context = createContext<ContextType>({} as ContextType);

export default function PageNameProvider({children}: {children: ReactNode}) {
  const [pageName, setPageName] = useState<string>('');
  return (
    <context.Provider
      value={{
        pageName,
        setPageName,
      }}
    >
      {children}
    </context.Provider>
  );
}

export function usePageNameProvider() {
  const ContextData = useContext(context);

  if (ContextData === undefined) {
    throw new Error("usePageNameProvider 必須在 PageNameProvider 內使用");
  }

  return ContextData;
}
