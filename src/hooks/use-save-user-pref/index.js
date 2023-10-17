import { useEffect } from 'react';
import { useUserStorageMutation } from 'nr1';

import { NERD_STORAGE } from '../../constants';

const useSaveUserPreferences = () => {
  const [save, { error: saveError }] = useUserStorageMutation({
    actionType: useUserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection: NERD_STORAGE.USER_COLLECTION,
  });
  const [remove, { error: removeError }] = useUserStorageMutation({
    actionType: useUserStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
    collection: NERD_STORAGE.USER_COLLECTION,
  });

  useEffect(() => {
    if (saveError) console.error('Error saving user preference', saveError);
  }, [saveError]);

  useEffect(() => {
    if (removeError)
      console.error('Error removing user preference', removeError);
  }, [removeError]);

  return { save, remove };
};

export default useSaveUserPreferences;
