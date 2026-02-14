'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Ship, ShieldCheck, ClipboardCheck, Plus, Loader2, Gavel, Calculator, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { calculateImportCosting } from '@/lib/utils/japan-import-costing';
import type {
  JapanImportAuction,
  JapanImportClearanceStatus,
  JapanImportCosting,
  JapanImportCustoms,
  JapanImportDocument,
  JapanImportDocumentType,
  JapanImportInspection,
  JapanImportShipment,
} from '@/lib/types/database';
import {
  addJapanImportDocument,
  createInventoryVehicleFromImportCase,
  upsertJapanImportAuction,
  upsertJapanImportCustoms,
  upsertJapanImportCosting,
  upsertJapanImportInspection,
  upsertJapanImportShipment,
} from '@/lib/actions/japan-import';

const DOCUMENT_TYPES: { value: JapanImportDocumentType; label: string }[] = [
  { value: 'auction_sheet', label: 'Auction Sheet' },
  { value: 'export_certificate', label: 'Export Certificate' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'inspection_report', label: 'Inspection Report' },
  { value: 'customs_document', label: 'Customs Document' },
  { value: 'other', label: 'Other' },
];

const CLEARANCE_STATUSES: { value: JapanImportClearanceStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'held', label: 'Held' },
];

export function JapanImportCaseTabs(props: {
  importCaseId: string;
  importStatus: string;
  linkedVehicleId: string | null;
  documents: JapanImportDocument[];
  shipment: JapanImportShipment | null;
  customs: JapanImportCustoms | null;
  inspection: JapanImportInspection | null;
  auction: JapanImportAuction | null;
  costing: JapanImportCosting | null;
}) {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const featureFlags = organization?.feature_flags;
  const importDocumentsEnabled = featureFlags?.enable_import_documents ?? true;
  const importShipmentsEnabled = featureFlags?.enable_import_shipments ?? true;
  const importCustomsEnabled = featureFlags?.enable_import_customs ?? true;
  const importInspectionsEnabled = featureFlags?.enable_import_inspections ?? true;

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [doc, setDoc] = useState({
    document_type: 'auction_sheet' as JapanImportDocumentType,
    title: '',
    file_url: '',
    status: 'pending' as 'pending' | 'verified' | 'rejected',
    notes: '',
  });

  const [auction, setAuction] = useState({
    auction_house: props.auction?.auction_house ?? '',
    auction_location: props.auction?.auction_location ?? '',
    auction_date: props.auction?.auction_date ?? '',
    lot_number: props.auction?.lot_number ?? '',
    grade_sheet_url: props.auction?.grade_sheet_url ?? '',
    fob_price_jpy: props.auction?.fob_price_jpy?.toString() ?? '',
    auction_fee_jpy: props.auction?.auction_fee_jpy?.toString() ?? '',
    inland_transport_jpy: props.auction?.inland_transport_jpy?.toString() ?? '',
    notes: props.auction?.notes ?? '',
  });

  const [costing, setCosting] = useState({
    jpy_to_pkr_rate: props.costing?.jpy_to_pkr_rate?.toString() ?? '',
    fob_price_jpy: props.costing?.fob_price_jpy?.toString() ?? (props.auction?.fob_price_jpy?.toString() ?? ''),
    auction_fee_jpy: props.costing?.auction_fee_jpy?.toString() ?? (props.auction?.auction_fee_jpy?.toString() ?? ''),
    inland_transport_jpy: props.costing?.inland_transport_jpy?.toString() ?? (props.auction?.inland_transport_jpy?.toString() ?? ''),
    freight_pkr: props.costing?.freight_pkr?.toString() ?? '',
    duty_pkr: props.costing?.duty_pkr?.toString() ?? '',
    tax_pkr: props.costing?.tax_pkr?.toString() ?? '',
    agent_fee_pkr: props.costing?.agent_fee_pkr?.toString() ?? '',
    port_charges_pkr: props.costing?.port_charges_pkr?.toString() ?? '',
    repairs_pkr: props.costing?.repairs_pkr?.toString() ?? '',
    misc_pkr: props.costing?.misc_pkr?.toString() ?? '',
    profit_margin_pkr: props.costing?.profit_margin_pkr?.toString() ?? '',
    profit_margin_percent: props.costing?.profit_margin_percent?.toString() ?? '',
    notes: props.costing?.notes ?? '',
  });

  const [shipment, setShipment] = useState({
    vessel_name: props.shipment?.vessel_name ?? '',
    voyage_number: props.shipment?.voyage_number ?? '',
    bill_of_lading_number: props.shipment?.bill_of_lading_number ?? '',
    container_number: props.shipment?.container_number ?? '',
    shipping_line: props.shipment?.shipping_line ?? '',
    etd_date: props.shipment?.etd_date ?? '',
    eta_date: props.shipment?.eta_date ?? '',
    notes: props.shipment?.notes ?? '',
  });

  const [customs, setCustoms] = useState({
    clearance_status: (props.customs?.clearance_status ?? 'pending') as JapanImportClearanceStatus,
    clearing_agent: props.customs?.clearing_agent ?? '',
    duty_pkr: props.customs?.duty_pkr?.toString() ?? '',
    tax_pkr: props.customs?.tax_pkr?.toString() ?? '',
    other_fees_pkr: props.customs?.other_fees_pkr?.toString() ?? '',
    clearance_date: props.customs?.clearance_date ?? '',
    notes: props.customs?.notes ?? '',
  });

  const [inspection, setInspection] = useState({
    inspection_date: props.inspection?.inspection_date ?? '',
    inspector_name: props.inspection?.inspector_name ?? '',
    overall_grade: props.inspection?.overall_grade ?? '',
    passed: props.inspection?.passed ?? null,
    notes: props.inspection?.notes ?? '',
  });

  const resetAlerts = () => {
    setMsg(null);
    setErr(null);
  };

  const saveDoc = async () => {
    resetAlerts();
    if (!doc.file_url) {
      setErr('File URL is required');
      return;
    }
    setBusy(true);
    const res = await addJapanImportDocument({
      import_case_id: props.importCaseId,
      input: {
        document_type: doc.document_type,
        title: doc.title || null,
        file_url: doc.file_url,
        status: doc.status,
        notes: doc.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else {
      setMsg('Document added');
      setDoc({ document_type: 'auction_sheet', title: '', file_url: '', status: 'pending', notes: '' });
    }
  };

  const uploadGradeSheet = async (file: File) => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `grade-sheet-${Date.now()}.${fileExt}`;
    const filePath = `${organization?.id ?? 'unknown-org'}/japan-import/${props.importCaseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const saveAuction = async () => {
    resetAlerts();
    setBusy(true);
    const res = await upsertJapanImportAuction({
      import_case_id: props.importCaseId,
      input: {
        auction_house: auction.auction_house || null,
        auction_location: auction.auction_location || null,
        auction_date: auction.auction_date || null,
        lot_number: auction.lot_number || null,
        grade_sheet_url: auction.grade_sheet_url || null,
        fob_price_jpy: auction.fob_price_jpy ? Number(auction.fob_price_jpy) : null,
        auction_fee_jpy: auction.auction_fee_jpy ? Number(auction.auction_fee_jpy) : null,
        inland_transport_jpy: auction.inland_transport_jpy ? Number(auction.inland_transport_jpy) : null,
        notes: auction.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Auction saved');
  };

  const saveCosting = async () => {
    resetAlerts();
    const rate = Number(costing.jpy_to_pkr_rate || 0);
    if (!rate) {
      setErr('JPY→PKR rate is required');
      return;
    }
    setBusy(true);
    const res = await upsertJapanImportCosting({
      import_case_id: props.importCaseId,
      input: {
        jpy_to_pkr_rate: rate,
        fob_price_jpy: costing.fob_price_jpy ? Number(costing.fob_price_jpy) : null,
        auction_fee_jpy: costing.auction_fee_jpy ? Number(costing.auction_fee_jpy) : null,
        inland_transport_jpy: costing.inland_transport_jpy ? Number(costing.inland_transport_jpy) : null,
        freight_pkr: costing.freight_pkr ? Number(costing.freight_pkr) : null,
        duty_pkr: costing.duty_pkr ? Number(costing.duty_pkr) : null,
        tax_pkr: costing.tax_pkr ? Number(costing.tax_pkr) : null,
        agent_fee_pkr: costing.agent_fee_pkr ? Number(costing.agent_fee_pkr) : null,
        port_charges_pkr: costing.port_charges_pkr ? Number(costing.port_charges_pkr) : null,
        repairs_pkr: costing.repairs_pkr ? Number(costing.repairs_pkr) : null,
        misc_pkr: costing.misc_pkr ? Number(costing.misc_pkr) : null,
        profit_margin_pkr: costing.profit_margin_pkr ? Number(costing.profit_margin_pkr) : null,
        profit_margin_percent: costing.profit_margin_percent ? Number(costing.profit_margin_percent) : null,
        notes: costing.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Costing saved');
  };

  const createInventory = async () => {
    resetAlerts();
    setBusy(true);
    const res = await createInventoryVehicleFromImportCase(props.importCaseId);
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Inventory vehicle created');
  };

  const saveShipment = async () => {
    resetAlerts();
    setBusy(true);
    const res = await upsertJapanImportShipment({
      import_case_id: props.importCaseId,
      input: {
        vessel_name: shipment.vessel_name || null,
        voyage_number: shipment.voyage_number || null,
        bill_of_lading_number: shipment.bill_of_lading_number || null,
        container_number: shipment.container_number || null,
        shipping_line: shipment.shipping_line || null,
        etd_date: shipment.etd_date || null,
        eta_date: shipment.eta_date || null,
        notes: shipment.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Shipment saved');
  };

  const saveCustoms = async () => {
    resetAlerts();
    setBusy(true);
    const res = await upsertJapanImportCustoms({
      import_case_id: props.importCaseId,
      input: {
        clearance_status: customs.clearance_status,
        clearing_agent: customs.clearing_agent || null,
        duty_pkr: customs.duty_pkr ? Number(customs.duty_pkr) : null,
        tax_pkr: customs.tax_pkr ? Number(customs.tax_pkr) : null,
        other_fees_pkr: customs.other_fees_pkr ? Number(customs.other_fees_pkr) : null,
        clearance_date: customs.clearance_date || null,
        notes: customs.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Customs saved');
  };

  const saveInspection = async () => {
    resetAlerts();
    setBusy(true);
    const res = await upsertJapanImportInspection({
      import_case_id: props.importCaseId,
      input: {
        inspection_date: inspection.inspection_date || null,
        inspector_name: inspection.inspector_name || null,
        overall_grade: inspection.overall_grade || null,
        passed: inspection.passed,
        notes: inspection.notes || null,
      },
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setMsg('Inspection saved');
  };

  const docCount = useMemo(() => props.documents.length, [props.documents.length]);
  const defaultTab = useMemo(() => {
    if (importDocumentsEnabled) return 'documents';
    if (importShipmentsEnabled) return 'shipment';
    if (importCustomsEnabled) return 'customs';
    if (importInspectionsEnabled) return 'inspection';
    return 'auction';
  }, [
    importCustomsEnabled,
    importDocumentsEnabled,
    importInspectionsEnabled,
    importShipmentsEnabled,
  ]);

  const computed = useMemo(() => {
    const rate = Number(costing.jpy_to_pkr_rate || 0);
    if (!rate) return null;
    return calculateImportCosting({
      jpy_to_pkr_rate: rate,
      fob_price_jpy: costing.fob_price_jpy ? Number(costing.fob_price_jpy) : 0,
      auction_fee_jpy: costing.auction_fee_jpy ? Number(costing.auction_fee_jpy) : 0,
      inland_transport_jpy: costing.inland_transport_jpy ? Number(costing.inland_transport_jpy) : 0,
      freight_pkr: costing.freight_pkr ? Number(costing.freight_pkr) : 0,
      duty_pkr: costing.duty_pkr ? Number(costing.duty_pkr) : 0,
      tax_pkr: costing.tax_pkr ? Number(costing.tax_pkr) : 0,
      agent_fee_pkr: costing.agent_fee_pkr ? Number(costing.agent_fee_pkr) : 0,
      port_charges_pkr: costing.port_charges_pkr ? Number(costing.port_charges_pkr) : 0,
      repairs_pkr: costing.repairs_pkr ? Number(costing.repairs_pkr) : 0,
      misc_pkr: costing.misc_pkr ? Number(costing.misc_pkr) : 0,
      profit_margin_pkr: costing.profit_margin_pkr ? Number(costing.profit_margin_pkr) : null,
      profit_margin_percent: costing.profit_margin_percent ? Number(costing.profit_margin_percent) : null,
    });
  }, [costing]);

  return (
    <div className="space-y-4">
      {(err || msg) && (
        <div
          className={
            err
              ? 'rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'
              : 'rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300'
          }
        >
          {err ?? msg}
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="auction" className="gap-2">
            <Gavel className="h-4 w-4" />
            Auction
          </TabsTrigger>
          <TabsTrigger value="costing" className="gap-2">
            <Calculator className="h-4 w-4" />
            Costing
          </TabsTrigger>
          {importDocumentsEnabled && (
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents ({docCount})
            </TabsTrigger>
          )}
          {importShipmentsEnabled && (
            <TabsTrigger value="shipment" className="gap-2">
              <Ship className="h-4 w-4" />
              Shipment
            </TabsTrigger>
          )}
          {importCustomsEnabled && (
            <TabsTrigger value="customs" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Customs
            </TabsTrigger>
          )}
          {importInspectionsEnabled && (
            <TabsTrigger value="inspection" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Inspection
            </TabsTrigger>
          )}
          <TabsTrigger value="inventory" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auction purchase tracking</CardTitle>
              <CardDescription>Auction house, lot number, grade sheet, and FOB price.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Auction house</Label>
                <Input value={auction.auction_house} onChange={(e) => setAuction({ ...auction, auction_house: e.target.value })} placeholder="USS / TAA / JU" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={auction.auction_location} onChange={(e) => setAuction({ ...auction, auction_location: e.target.value })} placeholder="Tokyo" />
              </div>
              <div className="space-y-2">
                <Label>Auction date</Label>
                <Input type="date" value={auction.auction_date} onChange={(e) => setAuction({ ...auction, auction_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Lot number</Label>
                <Input value={auction.lot_number} onChange={(e) => setAuction({ ...auction, lot_number: e.target.value })} placeholder="12345" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Grade sheet URL</Label>
                <Input value={auction.grade_sheet_url} onChange={(e) => setAuction({ ...auction, grade_sheet_url: e.target.value })} placeholder="https://..." />
                <div className="text-xs text-muted-foreground">
                  Tip: You can paste a link, or upload a file below (stored in Supabase Storage).
                </div>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      resetAlerts();
                      setBusy(true);
                      const url = await uploadGradeSheet(file);
                      setAuction((a) => ({ ...a, grade_sheet_url: url }));
                      // Also add as a document entry
                      await addJapanImportDocument({
                        import_case_id: props.importCaseId,
                        input: {
                          document_type: 'auction_sheet',
                          title: `Auction sheet (${auction.auction_house || 'Auction'})`,
                          file_url: url,
                          status: 'pending',
                        },
                      });
                      setMsg('Grade sheet uploaded');
                    } catch (ex) {
                      setErr(ex instanceof Error ? ex.message : 'Upload failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>FOB price (JPY)</Label>
                <Input type="number" value={auction.fob_price_jpy} onChange={(e) => setAuction({ ...auction, fob_price_jpy: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Auction fee (JPY)</Label>
                <Input type="number" value={auction.auction_fee_jpy} onChange={(e) => setAuction({ ...auction, auction_fee_jpy: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Inland transport (JPY)</Label>
                <Input type="number" value={auction.inland_transport_jpy} onChange={(e) => setAuction({ ...auction, inland_transport_jpy: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={auction.notes} onChange={(e) => setAuction({ ...auction, notes: e.target.value })} rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={saveAuction} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save auction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Costing calculator</CardTitle>
              <CardDescription>JPY→PKR conversion + landed cost + profit + target sale price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>JPY → PKR rate *</Label>
                  <Input type="number" value={costing.jpy_to_pkr_rate} onChange={(e) => setCosting({ ...costing, jpy_to_pkr_rate: e.target.value })} placeholder="2.1" />
                </div>
                <div className="space-y-2">
                  <Label>FOB (JPY)</Label>
                  <Input type="number" value={costing.fob_price_jpy} onChange={(e) => setCosting({ ...costing, fob_price_jpy: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Auction fee (JPY)</Label>
                  <Input type="number" value={costing.auction_fee_jpy} onChange={(e) => setCosting({ ...costing, auction_fee_jpy: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Inland transport (JPY)</Label>
                  <Input type="number" value={costing.inland_transport_jpy} onChange={(e) => setCosting({ ...costing, inland_transport_jpy: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Freight (PKR)</Label>
                  <Input type="number" value={costing.freight_pkr} onChange={(e) => setCosting({ ...costing, freight_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duty (PKR)</Label>
                  <Input type="number" value={costing.duty_pkr} onChange={(e) => setCosting({ ...costing, duty_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax (PKR)</Label>
                  <Input type="number" value={costing.tax_pkr} onChange={(e) => setCosting({ ...costing, tax_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Agent fee (PKR)</Label>
                  <Input type="number" value={costing.agent_fee_pkr} onChange={(e) => setCosting({ ...costing, agent_fee_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Port charges (PKR)</Label>
                  <Input type="number" value={costing.port_charges_pkr} onChange={(e) => setCosting({ ...costing, port_charges_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Repairs (PKR)</Label>
                  <Input type="number" value={costing.repairs_pkr} onChange={(e) => setCosting({ ...costing, repairs_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Misc (PKR)</Label>
                  <Input type="number" value={costing.misc_pkr} onChange={(e) => setCosting({ ...costing, misc_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Profit margin (PKR)</Label>
                  <Input type="number" value={costing.profit_margin_pkr} onChange={(e) => setCosting({ ...costing, profit_margin_pkr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Profit margin (%)</Label>
                  <Input type="number" value={costing.profit_margin_percent} onChange={(e) => setCosting({ ...costing, profit_margin_percent: e.target.value })} />
                </div>
              </div>

              {computed && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Landed cost (PKR)</div>
                    <div className="text-lg font-semibold">PKR {Math.round(computed.landedCost).toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Profit (PKR)</div>
                    <div className="text-lg font-semibold">PKR {Math.round(computed.profitPkr).toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border bg-emerald-500/10 p-3">
                    <div className="text-xs text-muted-foreground">Target sale price (PKR)</div>
                    <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      PKR {Math.round(computed.targetSalePrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={costing.notes} onChange={(e) => setCosting({ ...costing, notes: e.target.value })} rows={3} />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveCosting} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save costing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {importDocumentsEnabled && (
          <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add document</CardTitle>
              <CardDescription>Paste a file URL (Supabase Storage public URL or any link).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Document type</Label>
                  <Select value={doc.document_type} onValueChange={(v) => setDoc({ ...doc, document_type: v as JapanImportDocumentType })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} placeholder="Auction sheet - USS Tokyo" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>File URL *</Label>
                  <Input value={doc.file_url} onChange={(e) => setDoc({ ...doc, file_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={doc.status} onValueChange={(v) => setDoc({ ...doc, status: v as any })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={doc.notes} onChange={(e) => setDoc({ ...doc, notes: e.target.value })} placeholder="Any notes..." />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveDoc} disabled={busy} className="gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add document
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>All documents attached to this import case.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {props.documents.length === 0 ? (
                <div className="text-sm text-muted-foreground">No documents added yet.</div>
              ) : (
                props.documents.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="font-medium">{d.title || d.document_type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.document_type.replace(/_/g, ' ')} • {d.status}
                      </div>
                    </div>
                    <a href={d.file_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">Open</Button>
                    </a>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {importShipmentsEnabled && (
          <TabsContent value="shipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipment</CardTitle>
              <CardDescription>Track vessel and BL details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vessel name</Label>
                <Input value={shipment.vessel_name} onChange={(e) => setShipment({ ...shipment, vessel_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Voyage number</Label>
                <Input value={shipment.voyage_number} onChange={(e) => setShipment({ ...shipment, voyage_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bill of Lading</Label>
                <Input value={shipment.bill_of_lading_number} onChange={(e) => setShipment({ ...shipment, bill_of_lading_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Container number</Label>
                <Input value={shipment.container_number} onChange={(e) => setShipment({ ...shipment, container_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Shipping line</Label>
                <Input value={shipment.shipping_line} onChange={(e) => setShipment({ ...shipment, shipping_line: e.target.value })} />
              </div>
              <div className="space-y-2" />
              <div className="space-y-2">
                <Label>ETD</Label>
                <Input type="date" value={shipment.etd_date} onChange={(e) => setShipment({ ...shipment, etd_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input type="date" value={shipment.eta_date} onChange={(e) => setShipment({ ...shipment, eta_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={shipment.notes} onChange={(e) => setShipment({ ...shipment, notes: e.target.value })} rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={saveShipment} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save shipment
                </Button>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {importCustomsEnabled && (
          <TabsContent value="customs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customs & Clearance</CardTitle>
              <CardDescription>Track duty, tax, and clearance progress.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Clearance status</Label>
                <Select value={customs.clearance_status} onValueChange={(v) => setCustoms({ ...customs, clearance_status: v as JapanImportClearanceStatus })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLEARANCE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clearing agent</Label>
                <Input value={customs.clearing_agent} onChange={(e) => setCustoms({ ...customs, clearing_agent: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duty (PKR)</Label>
                <Input type="number" value={customs.duty_pkr} onChange={(e) => setCustoms({ ...customs, duty_pkr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tax (PKR)</Label>
                <Input type="number" value={customs.tax_pkr} onChange={(e) => setCustoms({ ...customs, tax_pkr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Other fees (PKR)</Label>
                <Input type="number" value={customs.other_fees_pkr} onChange={(e) => setCustoms({ ...customs, other_fees_pkr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Clearance date</Label>
                <Input type="date" value={customs.clearance_date} onChange={(e) => setCustoms({ ...customs, clearance_date: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={customs.notes} onChange={(e) => setCustoms({ ...customs, notes: e.target.value })} rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={saveCustoms} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save customs
                </Button>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {importInspectionsEnabled && (
          <TabsContent value="inspection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection</CardTitle>
              <CardDescription>Condition check before listing the vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Inspection date</Label>
                <Input type="date" value={inspection.inspection_date} onChange={(e) => setInspection({ ...inspection, inspection_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Inspector</Label>
                <Input value={inspection.inspector_name} onChange={(e) => setInspection({ ...inspection, inspector_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Overall grade</Label>
                <Input value={inspection.overall_grade} onChange={(e) => setInspection({ ...inspection, overall_grade: e.target.value })} placeholder="A / B / C" />
              </div>
              <div className="space-y-2">
                <Label>Passed</Label>
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <Switch
                    checked={inspection.passed === true}
                    onCheckedChange={(v) => setInspection({ ...inspection, passed: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {inspection.passed === null ? 'Not set' : inspection.passed ? 'Yes' : 'No'}
                  </span>
                  {inspection.passed === null && (
                    <Button variant="ghost" size="sm" onClick={() => setInspection({ ...inspection, passed: null })}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={inspection.notes} onChange={(e) => setInspection({ ...inspection, notes: e.target.value })} rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={saveInspection} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save inspection
                </Button>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Link to Inventory</CardTitle>
              <CardDescription>
                When the import case is <span className="font-medium">ready for sale</span>, you can create a stock vehicle automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{props.importStatus}</span></div>
                <div><span className="text-muted-foreground">Linked vehicle:</span> <span className="font-medium">{props.linkedVehicleId ?? 'Not created yet'}</span></div>
              </div>
              {props.linkedVehicleId && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      router.push(`/dashboard/inventory/${props.linkedVehicleId}`)
                    }
                  >
                    View linked inventory vehicle
                  </Button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  onClick={createInventory}
                  disabled={busy || props.linkedVehicleId !== null || props.importStatus !== 'ready_for_sale'}
                  className="gap-2 w-full sm:w-auto"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create inventory vehicle
                </Button>
              </div>
              {props.importStatus !== 'ready_for_sale' && (
                <div className="text-xs text-muted-foreground">
                  Set status to <span className="font-medium">ready for sale</span> first.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

