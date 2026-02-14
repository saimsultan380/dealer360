'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, X, Plus, Trash2, Printer, Eye } from 'lucide-react';
import { getInvoiceSettings, upsertInvoiceSettings, type InvoiceSettings as InvoiceSettingsType } from '@/lib/actions/invoice-settings';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { InvoiceTemplate, type InvoiceData } from '@/components/invoice/invoice-template';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function InvoiceSlipSettings() {
  const { profile, organization } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<InvoiceSettingsType>({
    id: '',
    organization_id: '',
    business_name: '',
    tagline: '',
    slogan: '',
    logo_url: '',
    ntn_number: '',
    ceo_name: '',
    phone_numbers: [],
    business_address: '',
    primary_color: '#DC2626',
    show_seller_photo: true,
    show_buyer_photo: true,
    show_vehicle_photo: true,
    show_accessories_section: true,
    show_documents_section: true,
    show_witness_section: true,
    show_notes_section: true,
    show_extra_requirements: true,
    show_profession_field: true,
    show_swdo_field: true,
    default_note_text: '',
    default_extra_requirements: '',
    invoice_prefix: '',
    next_serial_number: 1,
    created_at: '',
    updated_at: '',
  });

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const result = await getInvoiceSettings();
    if (result.data) {
      setSettings(result.data);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await upsertInvoiceSettings(settings);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Invoice settings saved successfully');
      if (result.data) setSettings(result.data);
      setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Image size must be less than 2MB'); return; }

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-logo-${Date.now()}.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('vehicles').upload(filePath, file, { upsert: true });
      if (uploadError) { setError('Failed to upload image'); setUploading(false); return; }

      const { data: { publicUrl } } = supabase.storage.from('vehicles').getPublicUrl(filePath);
      setSettings((s) => ({ ...s, logo_url: publicUrl }));
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addPhoneNumber = () => {
    setSettings((s) => ({ ...s, phone_numbers: [...(s.phone_numbers || []), ''] }));
  };

  const removePhoneNumber = (index: number) => {
    setSettings((s) => ({
      ...s,
      phone_numbers: s.phone_numbers.filter((_, i) => i !== index),
    }));
  };

  const updatePhoneNumber = (index: number, value: string) => {
    setSettings((s) => ({
      ...s,
      phone_numbers: s.phone_numbers.map((p, i) => (i === index ? value : p)),
    }));
  };

  const previewData: InvoiceData = {
    type: 'sale',
    invoiceNumber: `${settings.invoice_prefix ? settings.invoice_prefix + '-' : ''}${String(settings.next_serial_number).padStart(4, '0')}`,
    serialNumber: settings.next_serial_number,
    date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
    invoiceLabel: 'Sale Invoice',
    seller: { name: 'Muhammad Miskeen', swdo_name: 'Ali Ahmed', cnic: '37405-0678410-5', phone: '0333-5406173', address: 'Range Road, Shalley Valley Chowk, Rawalpindi', profession: settings.business_name || 'Showroom' },
    buyer: { name: 'Fahad Iqbal', swdo_name: 'Muhammad Iqbal', cnic: '42101-1806228-9', phone: '0321-8258776', address: 'DHA Phase 2, Sector B, H. No 11, St No 22, Islamabad', profession: 'Textile Manufacturing' },
    vehicle: { make: 'Jetour', model: 'Dashing', year: 2026, color: 'Gray', registration_number: 'BSK-493', vehicle_reg_no: 'BSK-493', engine_number: 'BTSJ03559', chassis_number: 'NPLUD5AG9SUM00724' },
    payment: { total_payment: 8122260, paid_on_spot: 8122260, balance_payment: 0, paid_amount_date: new Date().toLocaleDateString('en-PK') },
    accessories: { no_of_keys: 1, tool_kit: 'Present', number_plates: 'Missing', spare_tyre: 'Present' },
    documents: { registration_cards: 0, file_pages: 9, biometric: 'Not Required', token: 0 },
    settings,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">
          You don&apos;t have permission to edit invoice settings. Contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">{success}</div>
      )}

      {/* ─── Header & Branding ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Business Header</CardTitle>
          <CardDescription>This information appears at the top of your invoice slip</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {settings.logo_url ? (
              <div className="relative shrink-0">
                <img src={settings.logo_url} alt="Invoice logo" className="h-20 w-20 object-contain rounded-lg border" />
              </div>
            ) : (
              <div className="h-20 w-20 flex items-center justify-center border rounded-lg bg-muted shrink-0">
                <Printer className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="invoice-logo-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </span>
                  </Button>
                </Label>
                <Input id="invoice-logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                {settings.logo_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setSettings((s) => ({ ...s, logo_url: '' }))}>
                    <X className="mr-2 h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB. Recommended: square image.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Business Name *</Label>
              <Input value={settings.business_name} onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))} placeholder="TAQWA MOTORS" />
            </div>
            <div>
              <Label className="mb-2 block">Tagline</Label>
              <Input value={settings.tagline} onChange={(e) => setSettings((s) => ({ ...s, tagline: e.target.value }))} placeholder="DEALS IN ALL KIND OF NEW AND JAPANESE CARS" />
            </div>
            <div>
              <Label className="mb-2 block">Slogan</Label>
              <Input value={settings.slogan} onChange={(e) => setSettings((s) => ({ ...s, slogan: e.target.value }))} placeholder="Serving You With Trust and Commitment" />
            </div>
            <div>
              <Label className="mb-2 block">NTN Number</Label>
              <Input value={settings.ntn_number} onChange={(e) => setSettings((s) => ({ ...s, ntn_number: e.target.value }))} placeholder="7473927-3" />
            </div>
            <div>
              <Label className="mb-2 block">CEO / Owner Name</Label>
              <Input value={settings.ceo_name} onChange={(e) => setSettings((s) => ({ ...s, ceo_name: e.target.value }))} placeholder="Malik Qaisar Mehmood" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Business Address</Label>
              <Input value={settings.business_address} onChange={(e) => setSettings((s) => ({ ...s, business_address: e.target.value }))} placeholder="Range Road, Shalley Valley Chowk, Rawalpindi" />
            </div>
          </div>

          {/* Phone Numbers */}
          <div>
            <Label className="mb-2 block">Phone Numbers</Label>
            <div className="space-y-2">
              {(settings.phone_numbers || []).map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => updatePhoneNumber(index, e.target.value)}
                    placeholder="+92 333 5406173"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePhoneNumber(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPhoneNumber} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Phone
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Styling ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Styling</CardTitle>
          <CardDescription>Customize colors and serial number format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings((s) => ({ ...s, primary_color: e.target.value }))}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings((s) => ({ ...s, primary_color: e.target.value }))}
                  placeholder="#DC2626"
                  className="w-28"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Invoice Prefix</Label>
              <Input value={settings.invoice_prefix} onChange={(e) => setSettings((s) => ({ ...s, invoice_prefix: e.target.value }))} placeholder="BSK" />
              <p className="text-xs text-muted-foreground mt-1">E.g. &ldquo;BSK&rdquo; → BSK-0001</p>
            </div>
            <div>
              <Label className="mb-2 block">Next Serial Number</Label>
              <Input type="number" min={1} value={settings.next_serial_number} onChange={(e) => setSettings((s) => ({ ...s, next_serial_number: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Section Visibility ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Section Visibility</CardTitle>
          <CardDescription>Toggle which sections appear on the invoice slip</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleRow label="Seller Photo" checked={settings.show_seller_photo} onChange={(v) => setSettings((s) => ({ ...s, show_seller_photo: v }))} />
            <ToggleRow label="Buyer Photo" checked={settings.show_buyer_photo} onChange={(v) => setSettings((s) => ({ ...s, show_buyer_photo: v }))} />
            <ToggleRow label="Vehicle Photo" checked={settings.show_vehicle_photo} onChange={(v) => setSettings((s) => ({ ...s, show_vehicle_photo: v }))} />
            <ToggleRow label="S/W/D/O Field" checked={settings.show_swdo_field} onChange={(v) => setSettings((s) => ({ ...s, show_swdo_field: v }))} />
            <ToggleRow label="Profession Field" checked={settings.show_profession_field} onChange={(v) => setSettings((s) => ({ ...s, show_profession_field: v }))} />
            <ToggleRow label="Accessories Section" checked={settings.show_accessories_section} onChange={(v) => setSettings((s) => ({ ...s, show_accessories_section: v }))} />
            <ToggleRow label="Documents Section" checked={settings.show_documents_section} onChange={(v) => setSettings((s) => ({ ...s, show_documents_section: v }))} />
            <ToggleRow label="Witness Section" checked={settings.show_witness_section} onChange={(v) => setSettings((s) => ({ ...s, show_witness_section: v }))} />
            <ToggleRow label="Extra Requirements" checked={settings.show_extra_requirements} onChange={(v) => setSettings((s) => ({ ...s, show_extra_requirements: v }))} />
            <ToggleRow label="Legal Note Section" checked={settings.show_notes_section} onChange={(v) => setSettings((s) => ({ ...s, show_notes_section: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Default Texts ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Default Texts</CardTitle>
          <CardDescription>Pre-fill text that appears on every invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Extra Requirements Default Text</Label>
            <Textarea
              value={settings.default_extra_requirements}
              onChange={(e) => setSettings((s) => ({ ...s, default_extra_requirements: e.target.value }))}
              rows={2}
              placeholder="Vehicle and documents, along with the original slip and number plates, have been handed over to the client."
            />
          </div>
          <div>
            <Label className="mb-2 block">Legal Note Default Text</Label>
            <Textarea
              value={settings.default_note_text}
              onChange={(e) => setSettings((s) => ({ ...s, default_note_text: e.target.value }))}
              rows={6}
              placeholder="Note: Seller is liable to clear all documents..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Actions ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
          <Eye className="h-4 w-4" />
          Preview Invoice
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Invoice Settings
        </Button>
      </div>

      {/* ─── Preview Dialog ──────────────────────────────────── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogTitle>Invoice Preview (Sample Data)</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
            <div className="bg-white mx-auto shadow-lg" style={{ maxWidth: '210mm' }}>
              <InvoiceTemplate ref={printRef} data={previewData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
