'use client';

import { useState, useRef, useCallback } from 'react';
import { Printer, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceTemplate, type InvoiceData, type InvoiceParty, type InvoiceVehicle, type InvoicePayment } from './invoice-template';
import {
  getSaleInvoiceData,
  getExchangeInvoiceData,
  getJapanImportInvoiceData,
  type InvoiceSettings,
} from '@/lib/actions/invoice-settings';

interface PrintInvoiceButtonProps {
  entityId: string;
  type: 'sale' | 'exchange' | 'japan_import';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
  label?: string;
}

export function PrintInvoiceButton({
  entityId,
  type,
  variant = 'outline',
  size = 'sm',
  className,
  label,
}: PrintInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: any;

      if (type === 'sale') {
        result = await getSaleInvoiceData(entityId);
      } else if (type === 'exchange') {
        result = await getExchangeInvoiceData(entityId);
      } else {
        result = await getJapanImportInvoiceData(entityId);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const rawData = result.data;
      const settings = rawData.settings as InvoiceSettings;
      const now = new Date();

      let invoiceDataFormatted: InvoiceData;

      if (type === 'sale') {
        const sale = rawData.sale;
        const vehicle = sale.vehicles;
        const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary) || vehicle?.vehicle_images?.[0];

        invoiceDataFormatted = {
          type: 'sale',
          invoiceNumber: rawData.invoiceNumber || '0001',
          serialNumber: rawData.serialNumber || 1,
          date: now.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
          invoiceLabel: 'Sale Invoice',
          seller: {
            name: settings.business_name || settings.ceo_name || '',
            phone: settings.phone_numbers?.[0] || '',
            address: settings.business_address || '',
          },
          buyer: {
            name: sale.customer_name || '',
            cnic: sale.customer_cnic || '',
            phone: sale.customer_phone || '',
            address: sale.customer_address || '',
          },
          vehicle: {
            make: vehicle?.make || '',
            model: vehicle?.model || '',
            year: vehicle?.year,
            color: vehicle?.color || '',
            registration_number: vehicle?.registration_number || '',
            vehicle_reg_no: vehicle?.registration_number || '',
            engine_number: vehicle?.engine_number || '',
            chassis_number: vehicle?.chassis_number || '',
            mileage: vehicle?.mileage,
            fuel_type: vehicle?.fuel_type || '',
            image_url: primaryImage?.url || '',
          },
          payment: {
            total_payment: parseFloat(sale.sale_price) || 0,
            paid_on_spot: parseFloat(sale.down_payment) || 0,
            balance_payment: Math.max(0, (parseFloat(sale.sale_price) || 0) - (parseFloat(sale.down_payment) || 0)),
            paid_amount_date: sale.deal_date ? new Date(sale.deal_date).toLocaleDateString('en-PK') : '',
            balance_payment_date: sale.delivery_date ? new Date(sale.delivery_date).toLocaleDateString('en-PK') : '',
          },
          settings,
        };
      } else if (type === 'exchange') {
        const deal = rawData.deal;
        const meta = rawData.metadata || {};
        const vehicle = deal.vehicles;
        const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary) || vehicle?.vehicle_images?.[0];

        const seller = meta.seller || {};
        const buyer = meta.buyer || {};
        const paymentDetails = meta.paymentDetails || {};
        const tradeIn = meta.tradeIn || {};

        const salePrice = paymentDetails.salePrice || parseFloat(deal.sale_price) || 0;
        const tradeInValue = paymentDetails.tradeInValue || tradeIn.agreed_value || 0;
        const netTotal = paymentDetails.netTotal || Math.max(0, salePrice - tradeInValue);
        const downPayment = paymentDetails.downPayment || parseFloat(deal.down_payment) || 0;

        invoiceDataFormatted = {
          type: 'exchange',
          invoiceNumber: rawData.invoiceNumber || '0001',
          serialNumber: rawData.serialNumber || 1,
          date: now.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
          invoiceLabel: 'Exchange Invoice',
          seller: {
            name: seller.name || deal.customer_name || '',
            swdo_name: seller.swdo_name || '',
            cnic: seller.cnic || deal.customer_cnic || '',
            phone: seller.phone || deal.customer_phone || '',
            address: seller.address || deal.customer_address || '',
            image_url: seller.image_url || '',
          },
          buyer: {
            name: buyer.name || '',
            swdo_name: buyer.swdo_name || '',
            cnic: buyer.cnic || '',
            phone: buyer.phone || '',
            address: buyer.address || '',
            image_url: buyer.image_url || '',
          },
          vehicle: {
            make: vehicle?.make || tradeIn.make || '',
            model: vehicle?.model || tradeIn.model || '',
            year: vehicle?.year || tradeIn.year,
            color: vehicle?.color || tradeIn.color || '',
            registration_number: vehicle?.registration_number || tradeIn.registration || '',
            vehicle_reg_no: vehicle?.registration_number || tradeIn.registration || '',
            engine_number: vehicle?.engine_number || tradeIn.engine_number || '',
            chassis_number: vehicle?.chassis_number || tradeIn.chassis_number || '',
            image_url: primaryImage?.url || '',
          },
          payment: {
            total_payment: salePrice,
            paid_on_spot: downPayment + tradeInValue,
            balance_payment: Math.max(0, netTotal - downPayment),
            paid_amount_date: deal.deal_date ? new Date(deal.deal_date).toLocaleDateString('en-PK') : '',
            balance_payment_date: deal.delivery_date ? new Date(deal.delivery_date).toLocaleDateString('en-PK') : '',
          },
          settings,
        };
      } else {
        // Japan Import
        const importCase = rawData.importCase;
        const costing = rawData.costing;
        const auction = rawData.auction;

        const totalCost = parseFloat(importCase.estimated_total_cost_pkr) || 0;

        invoiceDataFormatted = {
          type: 'japan_import',
          invoiceNumber: rawData.invoiceNumber || '0001',
          serialNumber: rawData.serialNumber || 1,
          date: now.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
          invoiceLabel: 'Import Invoice',
          seller: {
            name: settings.business_name || '',
            phone: settings.phone_numbers?.[0] || '',
            address: settings.business_address || '',
          },
          buyer: {
            name: '',
            phone: '',
          },
          vehicle: {
            make: importCase.make || '',
            model: importCase.model || '',
            year: importCase.year,
            color: importCase.color || '',
            engine_number: importCase.engine_number || '',
            chassis_number: importCase.chassis_number || '',
            registration_number: importCase.stock_code || '',
            vehicle_reg_no: importCase.stock_code || '',
          },
          payment: {
            total_payment: totalCost,
            paid_on_spot: 0,
            balance_payment: totalCost,
            paid_amount_date: '',
            balance_payment_date: importCase.eta_date || '',
          },
          settings,
        };
      }

      setInvoiceData(invoiceDataFormatted);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  }, [entityId, type]);

  const handlePrintAction = useCallback(() => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 8mm; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();

    // Wait for images to load
    const images = printWindow.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(
      (img) => new Promise((resolve) => {
        if (img.complete) resolve(null);
        else {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
        }
      })
    );

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    });
  }, []);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          handlePrint();
        }}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {label && <span className="ml-1.5">{label}</span>}
      </Button>

      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex flex-row items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrintAction} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
            <div className="bg-white mx-auto shadow-lg" style={{ maxWidth: '210mm' }}>
              {invoiceData && <InvoiceTemplate ref={printRef} data={invoiceData} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
