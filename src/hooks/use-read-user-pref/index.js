import { useEffect, useState } from 'react';
import { useUserStorageQuery } from 'nr1';

import { NERD_STORAGE } from '../../constants';

const useReadUserPreferences = () => {
  const [userPreferences, setUserPreferences] = useState({});
  const { data, error, loading } = useUserStorageQuery({
    collection: NERD_STORAGE.USER_COLLECTION,
  });

  useEffect(() => {
    if (!loading && data && Array.isArray(data))
      setUserPreferences(
        data.reduce((acc, { id, document }) => ({ ...acc, [id]: document }), {})
      );
  }, [data, loading]);

  useEffect(() => {
    if (error) console.error('Error fetching user preferences', error);
  }, [error]);

  return { userPreferences, loading };
};

export default useReadUserPreferences;
