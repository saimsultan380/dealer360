'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BuyerContactActionsProps {
    phone: string;
}

export function BuyerContactActions({ phone }: BuyerContactActionsProps) {
    if (!phone) return null;

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`tel:${phone}`)}
            >
                <Phone className="mr-2 h-4 w-4" />
                Call
            </Button>
            <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                    // Clean phone number for WhatsApp
                    const cleanPhone = phone.replace(/[^0-9]/g, '');
                    // Ensure it has international format if possible, or just raw digits
                    window.open(`https://wa.me/${cleanPhone}`);
                }}
            >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
            </Button>
        </div>
    );
}
