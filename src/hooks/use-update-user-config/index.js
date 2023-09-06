import { useCallback, useEffect } from 'react';
import { useUserStorageMutation } from 'nr1';
import { NERD_STORAGE } from '../../constants';

const useUpdateUserConfig = () => {
  const [hhUserConfig, { error: userStorageWriteError }] =
    useUserStorageMutation({
      actionType: useUserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: NERD_STORAGE.USER_COLLECTION,
    });

  useEffect(
    () =>
      userStorageWriteError &&
      console.error('User storage write error: ', userStorageWriteError),
    [userStorageWriteError]
  );

  const userStorageHandler = useCallback((updatedUserConfig) => {
    hhUserConfig({
      documentId: NERD_STORAGE.CONFIG_DOCUMENT_ID,
      document: {
        ...updatedUserConfig,
      },
    });
  }, []);

  return { userStorageHandler };
};

export default useUpdateUserConfig;
