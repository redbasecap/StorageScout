'use client';

import { useState, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type BoxLabel = {
  id: string; // document ID = boxId
  name: string;
  userId: string;
};

export function useBoxLabels() {
  const { user } = useUser();
  const firestore = useFirestore();

  const labelsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'boxLabels'),
      where('userId', '==', user.uid)
    );
  }, [user, firestore]);

  const { data: labels, isLoading } = useCollection<BoxLabel>(labelsQuery);

  const labelMap = new Map<string, string>();
  if (labels) {
    for (const label of labels) {
      labelMap.set(label.id, label.name);
    }
  }

  const setLabel = useCallback(
    async (boxId: string, name: string) => {
      if (!firestore || !user) return;
      const trimmed = name.trim();
      if (!trimmed) {
        // Delete the label if empty
        await deleteDoc(doc(firestore, 'boxLabels', boxId));
      } else {
        await setDoc(doc(firestore, 'boxLabels', boxId), {
          name: trimmed,
          userId: user.uid,
        });
      }
    },
    [firestore, user]
  );

  const getLabel = useCallback(
    (boxId: string): string | undefined => labelMap.get(boxId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels]
  );

  return { labels: labelMap, getLabel, setLabel, isLoading };
}
