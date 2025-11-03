'use client'

import { useEffect, useState, useCallback, useMemo } from "react"
import { collection, query } from 'firebase/firestore'
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import type { InventoryItem } from "@/lib/types"
import { InventoryClient } from "@/components/dashboard/inventory-client"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"


export default function InventoryPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!user && !isUserLoading) {
        initiateAnonymousSignIn(auth);
        }
    }, [user, isUserLoading, auth]);

    const inventoryQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'inventoryItems'))
    }, [firestore, user]);

    const { data: inventory = [], isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryQuery);
    
    const loading = isUserLoading || isInventoryLoading;

    const handleDataChange = useCallback(() => {
        // Data is now handled by the realtime listener, so this can be a no-op
        // or used for other side-effects if needed.
    }, []);

    if (loading) {
        return <div className="container mx-auto py-10">Loading...</div>
    }
    
    if (!user) {
        return <div className="container mx-auto py-10">Please sign in to view your inventory.</div>
    }

    return (
        <InventoryClient 
            initialData={inventory} 
            onDataChange={handleDataChange}
        />
    )
}
