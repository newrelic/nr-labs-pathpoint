import { useEffect } from 'react';
import { useUserStorageQuery } from 'nr1';
import { NERD_STORAGE } from '../../constants';

const useFetchUserConfig = () => {
  const { data: userStorageConfig, error: userStorageError } =
    useUserStorageQuery({
      collection: NERD_STORAGE.USER_COLLECTION,
      documentId: NERD_STORAGE.CONFIG_DOCUMENT_ID,
    });

  useEffect(
    () =>
      userStorageError &&
      console.error('User storage read error: ', userStorageError),
    [userStorageError]
  );

  return { userStorageConfig };
};

export default useFetchUserConfig;
