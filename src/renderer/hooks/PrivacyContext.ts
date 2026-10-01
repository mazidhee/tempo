import { createContext, useContext } from 'react';

// Native select menus render outside the DOM blur layer: use safe labels there.
export const PrivacyContext = createContext(false);
export const usePrivacy = () => useContext(PrivacyContext);
