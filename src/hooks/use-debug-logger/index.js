import { useCallback } from 'react';

const useDebugLogger = ({ allowDebug = false }) => {
  const debugLogJson = useCallback(
    (obj, title = 'Debug json') => {
      if (allowDebug && obj) {
        try {
          const jsonString = JSON.stringify(obj, null, 2);
          console.groupCollapsed(title);
          console.debug(jsonString);
          console.groupEnd();
        } catch (e) {
          console.error(
            `Error [${title}]: Unable to convert debug output to JSON string`,
            e
          );
        }
      }
    },
    [allowDebug]
  );

  const debugString = useCallback(
    (str, title = 'Debug info') => {
      if (allowDebug && str) {
        console.groupCollapsed(title);
        console.debug(str);
        console.groupEnd();
      }
    },
    [allowDebug]
  );

  const debugTable = useCallback(
    (data, title = 'Debug table') => {
      if (allowDebug && data) {
        console.groupCollapsed(title);
        if (console.table) {
          console.table(data);
        } else {
          console.debug(data);
        }
        console.groupEnd();
      }
    },
    [allowDebug]
  );

  return { debugLogJson, debugString, debugTable };
};

export default useDebugLogger;
