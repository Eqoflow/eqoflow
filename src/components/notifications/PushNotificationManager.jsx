import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager({ user }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      setIsLoading(true);

      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        alert('Please enable notifications in your browser settings');
        setIsLoading(false);
        return;
      }

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service worker not available. Please contact support to enable push notifications.')), 5000)
        )
      ]);

      const vapidResponse = await base44.functions.invoke('getVapidPublicKey');
      const VAPID_PUBLIC_KEY = vapidResponse?.data?.publicKey;
      
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('Failed to get VAPID public key from server');
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const saveResponse = await base44.functions.invoke('savePushSubscription', {
        subscription: subscription.toJSON()
      });

      if (saveResponse?.data?.success || saveResponse?.data?.message) {
        setIsSubscribed(true);
        alert('Push notifications enabled successfully!');
      } else {
        throw new Error('Failed to save subscription to backend');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      alert('Failed to enable push notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        const subscriptions = await base44.entities.PushSubscription.filter({
          user_email: user.email,
          endpoint: subscription.endpoint
        });

        if (subscriptions.length > 0) {
          await base44.entities.PushSubscription.update(subscriptions[0].id, {
            is_active: false
          });
        }

        setIsSubscribed(false);
        alert('Push notifications disabled');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      alert('Failed to disable push notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported || !user) {
    return null;
  }

  return (
    <Button
      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="border-purple-500/30 text-white hover:bg-purple-500/10"
    >
      {isSubscribed ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
      {isLoading ? 'Processing...' : isSubscribed ? 'Disable Push' : 'Enable Push'}
    </Button>
  );
}