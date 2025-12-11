
"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

import type { Row, ApiKey } from '@/lib/b16/types';
import { platforms, initialRows } from '@/lib/b16/data';
import { Card } from '@/components/ui/card';
import KeyStep from '@/components/b16/KeyStep';
import UserPlatformStep from '@/components/b16/UserPlatformStep';
import GalleryStep from '@/components/b16/GalleryStep';
import BroadcastOverlay from '@/components/b16/BroadcastOverlay';
import { useToast } from '@/hooks/use-toast';

type Step = 'key' | 'id' | 'gallery';

const AppContent = () => {
  const [step, setStep] = useState<Step>('key');
  const [appKeyInput, setAppKeyInput] = useState('');
  const [activeKey, setActiveKey] = useState<ApiKey | null>(null);
  
  const [userId, setUserId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(0);

  const { toast } = useToast();
  const firestore = useFirestore();

  const handleKeyCheck = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Service Not Ready', description: 'Please wait a moment and try again.' });
      return;
    }
    if (!appKeyInput.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Key', description: 'Please enter a key.' });
      return;
    }

    setIsVerifyingKey(true);

    try {
      const keysRef = collection(firestore, "passwords");
      const q = query(keysRef, where("password", "==", appKeyInput.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'Invalid Key', description: 'The key is incorrect or has been used.' });
        setIsVerifyingKey(false);
        return;
      }

      const keyDoc = querySnapshot.docs[0];
      const keyData = keyDoc.data();
      
      const uses = keyData.uses || 0;
      
      if (uses <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Key', description: 'This key has no uses left.' });
        setIsVerifyingKey(false);
        return;
      }

      const validity = keyData.validity || '0m';
      const validityValue = parseInt(validity.slice(0, -1));

      const currentKey: ApiKey = {
        id: keyDoc.id,
        key: keyData.password,
        uses: uses,
        attempts: validityValue,
      };
      
      setActiveKey(currentKey);
      setAttemptsLeft(validityValue);
      setStep('id');

    } catch (error) {
      console.error("Error verifying key:", error);
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not connect to the service.' });
    } finally {
      setIsVerifyingKey(false);
    }
  };
  
  const handleGoToGallery = () => {
    if (!userId.trim()) {
      toast({ variant: 'destructive', title: 'Missing ID', description: 'Please enter your ID.' });
      return;
    }
    const idRegex = /^\d{9,11}$/;
    if (!idRegex.test(userId.trim())) {
      toast({ variant: 'destructive', title: 'Invalid ID', description: 'ID must be between 9 and 11 digits.' });
      return;
    }
    if (!selectedPlatform) {
      toast({ variant: 'destructive', title: 'Missing Platform', description: 'Please select a platform.' });
      return;
    }
    setStep('gallery');
  };

  const startSequence = async () => {
    if (attemptsLeft <= 0) {
       toast({ title: "No attempts left", description: "This key has no attempts remaining." });
       return;
    }
    
    if (activeKey && firestore) {
        const keyDocRef = doc(firestore, "passwords", activeKey.id);
        const newAttempts = attemptsLeft - 1;
        await updateDoc(keyDocRef, {
            validity: `${newAttempts}m`
        });
        setAttemptsLeft(newAttempts);
    }

    setIsBroadcasting(true);
  };
  
  const randomizeRows = () => {
    const newRows = initialRows.map(r => {
      const newPos = Math.floor(Math.random() * 5);
      const newSeq = ['-', '-', '-', '-', '-'];
      newSeq[newPos] = '+';
      return { ...r, seq: newSeq.join('') };
    });
    setRows(newRows);
  };

  const onBroadcastComplete = useCallback(() => {
    setIsBroadcasting(false);
    randomizeRows();
    if (!hasStarted) {
      setHasStarted(true); 
    }
  }, [hasStarted]);

  const handleResetToKey = useCallback(() => {
    setStep('key');
    setAppKeyInput('');
    setUserId('');
    setSelectedPlatform('');
    setHasStarted(false);
    setAttemptsLeft(0);
    setActiveKey(null);
    setRows(initialRows);
  }, []);

   // Effect to handle key deletion and auto-logout
  useEffect(() => {
    if (hasStarted && attemptsLeft <= 0 && activeKey && firestore) {
      toast({ title: "No attempts left", description: "You will be logged out in 30 seconds." });

      const deleteAndLogout = async () => {
        try {
          const keyDocRef = doc(firestore, "passwords", activeKey.id);
          const currentUses = activeKey.uses -1;
          if(currentUses <= 0) {
             await deleteDoc(keyDocRef);
          } else {
             await updateDoc(keyDocRef, { uses: currentUses, validity: '0m' });
          }
        } catch (error) {
          console.error("Error updating/deleting key:", error);
        } finally {
          // Log out regardless of deletion success
          handleResetToKey();
        }
      };

      const timer = setTimeout(deleteAndLogout, 30000);
      return () => clearTimeout(timer);
    }
  }, [hasStarted, attemptsLeft, activeKey, firestore, handleResetToKey]);


  const handleReset = () => {
     if (activeKey) {
        setAttemptsLeft(activeKey.attempts);
        setHasStarted(false);
        setRows(initialRows);
     }
  };

  const renderStep = () => {
    switch (step) {
      case 'key':
        return (
          <KeyStep
            appKey={appKeyInput}
            setAppKey={setAppKeyInput}
            onVerify={handleKeyCheck}
            isVerifying={isVerifyingKey}
          />
        );
      case 'id':
        return (
          <UserPlatformStep
            userId={userId}
            setUserId={setUserId}
            platforms={platforms}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            onContinue={handleGoToGallery}
            onBack={handleResetToKey}
          />
        );
      case 'gallery':
        return (
          <GalleryStep
            rows={rows}
            hasStarted={hasStarted}
            onStart={startSequence}
            onReset={handleReset}
            attemptsLeft={attemptsLeft}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <main className="relative z-0 min-h-screen w-full flex items-center justify-center p-3 bg-black">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{backgroundImage: "url('https://media.giphy.com/media/3o7btXkbs7i2Lz2dYk/giphy.gif')"}} />
        <Card id="screen" className="relative z-10 w-full max-w-4xl bg-card/80 border-border/50 shadow-2xl shadow-black/50 p-4 md:p-6 backdrop-blur-sm">
          {renderStep()}
        </Card>
      </main>
      {isBroadcasting && (
        <BroadcastOverlay
          userId={userId}
          platformName={platforms.find(p => p.id === selectedPlatform)?.name || ''}
          onComplete={onBroadcastComplete}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
      <AppContent />
  );
}
