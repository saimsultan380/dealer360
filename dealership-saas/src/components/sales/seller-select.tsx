'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, User, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getClients } from '@/lib/actions/clients';
import { cn } from '@/lib/utils';

interface Client {
    id: string;
    name: string;
    phone: string;
    cnic?: string | null;
    address?: string | null;
    email?: string | null;
}

interface SellerSelectProps {
    defaultSeller?: {
        name?: string;
        phone?: string;
        cnic?: string;
        address?: string;
    } | null;
    onSellerChange: (seller: {
        name: string;
        phone: string;
        cnic?: string;
        address?: string;
    }) => void;
    disabled?: boolean;
}

export function SellerSelect({ defaultSeller, onSellerChange, disabled }: SellerSelectProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'select' | 'new'>('select');
    const [selectedClientId, setSelectedClientId] = useState<string>('');

    // Form state for new seller
    const [newSeller, setNewSeller] = useState({
        name: defaultSeller?.name || '',
        phone: defaultSeller?.phone || '',
        cnic: defaultSeller?.cnic || '',
        address: defaultSeller?.address || '',
    });

    useEffect(() => {
        async function fetchClients() {
            setLoadingClients(true);
            const result = await getClients();
            if (result.data) {
                // Map ClientWithStats to Client format
                setClients(
                    result.data.map((c) => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        cnic: c.cnic || undefined,
                        address: c.address || undefined,
                        email: c.email || undefined,
                    }))
                );
            }
            setLoadingClients(false);
        }
        fetchClients();
    }, []);

    // If default seller exists, try to find matching client
    useEffect(() => {
        if (defaultSeller?.phone && clients.length > 0) {
            const matchingClient = clients.find(
                (c) => c.phone === defaultSeller.phone || c.name === defaultSeller.name
            );
            if (matchingClient) {
                setSelectedClientId(matchingClient.id);
                setMode('select');
            } else {
                setMode('new');
                setNewSeller({
                    name: defaultSeller.name || '',
                    phone: defaultSeller.phone || '',
                    cnic: defaultSeller.cnic || '',
                    address: defaultSeller.address || '',
                });
            }
        }
    }, [defaultSeller, clients]);

    const filteredClients = useMemo(() => {
        if (!searchQuery) return clients;
        const query = searchQuery.toLowerCase();
        return clients.filter(
            (client) =>
                client.name.toLowerCase().includes(query) ||
                client.phone.includes(query) ||
                client.cnic?.toLowerCase().includes(query)
        );
    }, [clients, searchQuery]);

    const handleClientSelect = (clientId: string) => {
        setSelectedClientId(clientId);
        const client = clients.find((c) => c.id === clientId);
        if (client) {
            onSellerChange({
                name: client.name,
                phone: client.phone,
                cnic: client.cnic || '',
                address: client.address || '',
            });
            setOpen(false);
        }
    };

    const handleNewSellerChange = (field: string, value: string) => {
        const updated = { ...newSeller, [field]: value };
        setNewSeller(updated);
        onSellerChange(updated);
    };

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant={mode === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                        setMode('select');
                        if (selectedClient) {
                            onSellerChange({
                                name: selectedClient.name,
                                phone: selectedClient.phone,
                                cnic: selectedClient.cnic || '',
                                address: selectedClient.address || '',
                            });
                        }
                    }}
                    disabled={disabled}
                >
                    <User className="mr-2 h-4 w-4" />
                    Select Existing
                </Button>
                <Button
                    type="button"
                    variant={mode === 'new' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                        setMode('new');
                        onSellerChange(newSeller);
                    }}
                    disabled={disabled}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Seller
                </Button>
            </div>

            {mode === 'select' ? (
                <div className="space-y-2">
                    <Label>Select Seller (Client)</Label>
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search clients by name, phone, or CNIC..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                disabled={disabled || loadingClients}
                            />
                        </div>
                        <Select
                            value={selectedClientId}
                            onValueChange={handleClientSelect}
                            disabled={disabled || loadingClients}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client...">
                                    {selectedClient
                                        ? `${selectedClient.name} (${selectedClient.phone})`
                                        : 'Select a client...'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {loadingClients ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Loading clients...
                                    </div>
                                ) : filteredClients.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No clients found
                                    </div>
                                ) : (
                                    filteredClients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{client.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {client.phone}
                                                    {client.cnic && ` • ${client.cnic}`}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedClient && (
                        <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Selected Seller:</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedClientId('');
                                        onSellerChange({
                                            name: '',
                                            phone: '',
                                            cnic: '',
                                            address: '',
                                        });
                                    }}
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Name: </span>
                                    <span>{selectedClient.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Phone: </span>
                                    <span>{selectedClient.phone}</span>
                                </div>
                                {selectedClient.cnic && (
                                    <div>
                                        <span className="text-muted-foreground">CNIC: </span>
                                        <span>{selectedClient.cnic}</span>
                                    </div>
                                )}
                                {selectedClient.address && (
                                    <div>
                                        <span className="text-muted-foreground">Address: </span>
                                        <span>{selectedClient.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>
                            Seller Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            placeholder="Full name"
                            value={newSeller.name}
                            onChange={(e) => handleNewSellerChange('name', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>
                            Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            placeholder="03XX-XXXXXXX"
                            value={newSeller.phone}
                            onChange={(e) => handleNewSellerChange('phone', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>CNIC (Optional)</Label>
                        <Input
                            placeholder="XXXXX-XXXXXXX-X"
                            value={newSeller.cnic}
                            onChange={(e) => handleNewSellerChange('cnic', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Address (Optional)</Label>
                        <Textarea
                            placeholder="Complete address"
                            value={newSeller.address}
                            onChange={(e) => handleNewSellerChange('address', e.target.value)}
                            rows={2}
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
