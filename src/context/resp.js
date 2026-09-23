import { createContext, useContext } from 'react';

export const RespCtx = createContext({ isMob: false, isTab: false, w: 1200 });
export const useResp = () => useContext(RespCtx);
