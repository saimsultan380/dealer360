'use client';

import { forwardRef } from 'react';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings';

// ─── Shared Types ──────────────────────────────────────────────────────────────
export interface InvoiceParty {
  name: string;
  swdo_name?: string;
  cnic?: string;
  phone?: string;
  address?: string;
  profession?: string;
  image_url?: string;
}

export interface InvoiceVehicle {
  make: string;
  model: string;
  year?: number | string;
  year_of_import?: string;
  variant?: string;
  color?: string;
  registration_number?: string;
  vehicle_reg_no?: string;
  engine_number?: string;
  chassis_number?: string;
  mileage?: number | string;
  fuel_type?: string;
  image_url?: string;
}

export interface InvoicePayment {
  total_payment: number;
  paid_on_spot: number;
  balance_payment: number;
  paid_amount_date?: string;
  balance_payment_date?: string;
}

export interface InvoiceAccessories {
  no_of_keys?: number;
  tool_kit?: 'Present' | 'Missing' | '';
  number_plates?: 'Present' | 'Missing' | '';
  spare_tyre?: 'Present' | 'Missing' | '';
}

export interface InvoiceDocuments {
  registration_cards?: number;
  file_pages?: number;
  biometric?: string;
  token?: number;
}

export interface InvoiceData {
  type: 'sale' | 'exchange' | 'japan_import';
  invoiceNumber: string;
  serialNumber: number;
  date: string;
  time: string;
  invoiceLabel?: string;

  seller: InvoiceParty;
  buyer: InvoiceParty;
  vehicle: InvoiceVehicle;
  payment: InvoicePayment;
  accessories?: InvoiceAccessories;
  documents?: InvoiceDocuments;

  extraRequirements?: string;
  notes?: string;
  settings: InvoiceSettings;
}

// ─── Number to Words (PKR) ─────────────────────────────────────────────────────
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lac' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(Math.abs(Math.round(num)));
}

// ─── Invoice Template ──────────────────────────────────────────────────────────
export const InvoiceTemplate = forwardRef<HTMLDivElement, { data: InvoiceData }>(
  function InvoiceTemplate({ data }, ref) {
    const s = data.settings;
    const color = s.primary_color || '#DC2626';

    const borderStyle = `2px solid ${color}`;
    const cellBorder = `1px solid ${color}`;

    const invoiceLabel = data.invoiceLabel || (
      data.type === 'sale' ? 'Sale Invoice' :
      data.type === 'exchange' ? 'Exchange Invoice' :
      'Import Invoice'
    );

    return (
      <div ref={ref} className="invoice-print-container" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', background: '#fff', width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '8mm' }}>
        <div style={{ border: borderStyle, padding: '0' }}>

          {/* ═══════════════ HEADER ═══════════════ */}
          <div style={{ borderBottom: borderStyle, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo */}
            {s.logo_url && (
              <div style={{ flexShrink: 0, width: '70px', height: '70px' }}>
                <img src={s.logo_url} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
              </div>
            )}

            {/* Center: Business Name + Tagline */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {s.business_name || 'Your Business Name'}
              </div>
              {s.tagline && (
                <div style={{ background: color, color: '#fff', display: 'inline-block', padding: '3px 16px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '2px', textTransform: 'uppercase' }}>
                  {s.tagline}
                </div>
              )}
              {s.ntn_number && (
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  NTN No. ({s.ntn_number})
                </div>
              )}
              {s.slogan && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', marginTop: '2px' }}>
                  &ldquo;{s.slogan}&rdquo;
                </div>
              )}
            </div>

            {/* Right: Serial, Date, CEO */}
            <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '10px', lineHeight: '1.6' }}>
              <div><strong style={{ color }}>Serial No: {String(data.serialNumber).padStart(4, '0')}</strong></div>
              <div style={{ fontSize: '9px' }}>{invoiceLabel} - {data.invoiceNumber}</div>
              <div><strong>Date:</strong> {data.date}</div>
              <div><strong>Time:</strong> {data.time}</div>
              {s.ceo_name && <div><strong>C.E.O</strong></div>}
              {s.ceo_name && <div>{s.ceo_name}</div>}
              {s.phone_numbers?.map((p, i) => (
                <div key={i}>{p}</div>
              ))}
            </div>
          </div>

          {/* ═══════════════ SELLER & BUYER ═══════════════ */}
          <div style={{ display: 'flex', borderBottom: borderStyle }}>
            {/* Seller */}
            <div style={{ flex: 1, borderRight: borderStyle }}>
              <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '12px' }}>SELLER</div>
              <div style={{ padding: '6px 8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <PartyRow label="Name:" value={data.seller.name} color={color} />
                      {s.show_swdo_field && <PartyRow label="S/W/D/O Name:" value={data.seller.swdo_name} color={color} />}
                      <PartyRow label="CNIC:" value={data.seller.cnic} color={color} />
                      <PartyRow label="Phone:" value={data.seller.phone} color={color} />
                      <PartyRow label="Address:" value={data.seller.address} color={color} />
                      {s.show_profession_field && <PartyRow label="Profession:" value={data.seller.profession} color={color} />}
                    </tbody>
                  </table>
                </div>
                {s.show_seller_photo && data.seller.image_url && (
                  <div style={{ flexShrink: 0, width: '80px', height: '90px', border: cellBorder }}>
                    <img src={data.seller.image_url} alt="Seller" style={{ width: '80px', height: '90px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Buyer */}
            <div style={{ flex: 1 }}>
              <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '12px' }}>BUYER</div>
              <div style={{ padding: '6px 8px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <PartyRow label="Name:" value={data.buyer.name} color={color} />
                      {s.show_swdo_field && <PartyRow label="S/W/D/O Name:" value={data.buyer.swdo_name} color={color} />}
                      <PartyRow label="CNIC:" value={data.buyer.cnic} color={color} />
                      <PartyRow label="Phone:" value={data.buyer.phone} color={color} />
                      <PartyRow label="Address:" value={data.buyer.address} color={color} />
                      {s.show_profession_field && <PartyRow label="Profession:" value={data.buyer.profession} color={color} />}
                    </tbody>
                  </table>
                </div>
                {s.show_buyer_photo && data.buyer.image_url && (
                  <div style={{ flexShrink: 0, width: '80px', height: '90px', border: cellBorder }}>
                    <img src={data.buyer.image_url} alt="Buyer" style={{ width: '80px', height: '90px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════ VEHICLE ═══════════════ */}
          <div style={{ borderBottom: borderStyle }}>
            <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '12px' }}>VEHICLE</div>
            <div style={{ padding: '6px 8px', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '110px' }}>Make / Model:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.make} {data.vehicle.model}</td>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '120px' }}>Vehicle Reg. No.:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.vehicle_reg_no || data.vehicle.registration_number || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Year:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.year || '—'}</td>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Year Of Import:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.year_of_import || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Registration:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.registration_number || '—'}</td>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Color:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.color || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Engine #:</td>
                      <td style={{ padding: '2px 4px' }}>{data.vehicle.engine_number || '—'}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Chassis #:</td>
                      <td colSpan={3} style={{ padding: '2px 4px' }}>{data.vehicle.chassis_number || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {s.show_vehicle_photo && data.vehicle.image_url && (
                <div style={{ flexShrink: 0, width: '120px', height: '80px', border: cellBorder }}>
                  <img src={data.vehicle.image_url} alt="Vehicle" style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════ PAYMENT DETAILS ═══════════════ */}
          <div style={{ borderBottom: borderStyle }}>
            <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '12px' }}>PAYMENT DETAILS</div>
            <div style={{ padding: '6px 8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: cellBorder }}>
                <tbody>
                  <tr>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontWeight: 'bold', width: '33%' }}>Total Payment:</td>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontWeight: 'bold', width: '33%' }}>Paid On Spot:</td>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontWeight: 'bold', width: '33%' }}>Balance Payment:</td>
                  </tr>
                  <tr>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontSize: '13px', fontWeight: 'bold' }}>
                      {data.payment.total_payment.toLocaleString()}
                    </td>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontSize: '13px', fontWeight: 'bold' }}>
                      {data.payment.paid_on_spot.toLocaleString()}
                    </td>
                    <td style={{ border: cellBorder, padding: '4px 6px', fontSize: '13px', fontWeight: 'bold' }}>
                      {data.payment.balance_payment.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: cellBorder, padding: '3px 6px', fontSize: '9px' }}>
                      <em>In Words:</em><br />
                      <strong>{numberToWords(data.payment.total_payment)}</strong>
                    </td>
                    <td style={{ border: cellBorder, padding: '3px 6px', fontSize: '9px' }}>
                      <em>In Words:</em><br />
                      <strong>{numberToWords(data.payment.paid_on_spot)}</strong>
                    </td>
                    <td style={{ border: cellBorder, padding: '3px 6px', fontSize: '9px' }}>
                      <em>In Words:</em><br />
                      <strong>{data.payment.balance_payment > 0 ? numberToWords(data.payment.balance_payment) : '—'}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: cellBorder, padding: '4px 6px' }}>
                      <strong>Paid Amount Date:</strong><br />
                      {data.payment.paid_amount_date || '—'}
                    </td>
                    <td colSpan={2} style={{ border: cellBorder, padding: '4px 6px' }}>
                      <strong>Balance Payment Date:</strong><br />
                      {data.payment.balance_payment_date || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════ ACCESSORIES & DOCUMENTS ═══════════════ */}
          {(s.show_accessories_section || s.show_documents_section) && (
            <div style={{ display: 'flex', borderBottom: borderStyle }}>
              {s.show_accessories_section && (
                <div style={{ flex: 1, borderRight: s.show_documents_section ? borderStyle : 'none' }}>
                  <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px' }}>VEHICLE ACCESSORIES</div>
                  <div style={{ padding: '6px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold', width: '100px' }}>No. of Keys:</td>
                          <td style={{ padding: '2px 4px' }}>{data.accessories?.no_of_keys ?? '—'}</td>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold', width: '80px' }}>Tool Kit:</td>
                          <td style={{ padding: '2px 4px' }}>{data.accessories?.tool_kit || '—'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Number Plates:</td>
                          <td style={{ padding: '2px 4px' }}>{data.accessories?.number_plates || '—'}</td>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Spare Tyre:</td>
                          <td style={{ padding: '2px 4px' }}>{data.accessories?.spare_tyre || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {s.show_documents_section && (
                <div style={{ flex: 1 }}>
                  <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px' }}>VEHICLE DOCUMENTS</div>
                  <div style={{ padding: '6px 8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold', width: '120px' }}>Registration Cards:</td>
                          <td style={{ padding: '2px 4px' }}>{data.documents?.registration_cards ?? '—'}</td>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold', width: '80px' }}>File Pages:</td>
                          <td style={{ padding: '2px 4px' }}>{data.documents?.file_pages ?? '—'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Biometric:</td>
                          <td style={{ padding: '2px 4px' }}>{data.documents?.biometric || '—'}</td>
                          <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>Token:</td>
                          <td style={{ padding: '2px 4px' }}>{data.documents?.token ?? '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ EXTRA REQUIREMENTS ═══════════════ */}
          {s.show_extra_requirements && (
            <div style={{ borderBottom: borderStyle }}>
              <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px' }}>Note(Extra Requirements)</div>
              <div style={{ padding: '6px 8px', fontSize: '10px', minHeight: '28px' }}>
                {data.extraRequirements || s.default_extra_requirements || ''}
              </div>
            </div>
          )}

          {/* ═══════════════ NOTE ═══════════════ */}
          {s.show_notes_section && (
            <div style={{ borderBottom: borderStyle }}>
              <div style={{ background: color, color: '#fff', padding: '3px 8px', fontWeight: 'bold', fontSize: '11px' }}>Note</div>
              <div style={{ padding: '6px 8px', fontSize: '9px', lineHeight: '1.5' }}>
                {(data.notes || s.default_note_text || '').split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════ SIGNATURES ═══════════════ */}
          <div style={{ borderBottom: s.show_witness_section ? borderStyle : 'none', padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderTop: `1px solid #000`, paddingTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                  Seller: Signature / Thumb
                </div>
              </div>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderTop: `1px solid #000`, paddingTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                  Showroom Sign &amp; Stamp
                </div>
              </div>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderTop: `1px solid #000`, paddingTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                  Buyer: Signature / Thumb
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ WITNESSES ═══════════════ */}
          {s.show_witness_section && (
            <div style={{ display: 'flex' }}>
              {/* Seller Witness */}
              <div style={{ flex: 1, borderRight: borderStyle, padding: '8px 12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', borderBottom: `1px solid ${color}`, paddingBottom: '4px', marginBottom: '8px' }}>SELLER WITNESS</div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <WitnessRow label="Name:" />
                    <WitnessRow label="CNIC:" />
                    <WitnessRow label="Contact No.:" />
                  </tbody>
                </table>
                <div style={{ marginTop: '24px', borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>Signature:</div>
              </div>

              {/* Buyer Witness */}
              <div style={{ flex: 1, padding: '8px 12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', borderBottom: `1px solid ${color}`, paddingBottom: '4px', marginBottom: '8px' }}>BUYER WITNESS</div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <WitnessRow label="Name:" />
                    <WitnessRow label="CNIC:" />
                    <WitnessRow label="Contact No.:" />
                  </tbody>
                </table>
                <div style={{ marginTop: '24px', borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11px' }}>Signature:</div>
              </div>
            </div>
          )}

        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .invoice-print-container { width: 100% !important; padding: 0 !important; margin: 0 !important; }
            @page { size: A4; margin: 8mm; }
          }
        `}</style>
      </div>
    );
  }
);

// ─── Helper Sub-Components ─────────────────────────────────────────────────────
function PartyRow({ label, value, color }: { label: string; value?: string; color: string }) {
  return (
    <tr>
      <td style={{ padding: '2px 4px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '100px', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '2px 4px', borderBottom: `1px solid ${color}20` }}>{value || '—'}</td>
    </tr>
  );
}

function WitnessRow({ label }: { label: string }) {
  return (
    <tr>
      <td style={{ padding: '3px 4px', fontWeight: 'bold', width: '80px' }}>{label}</td>
      <td style={{ padding: '3px 4px', borderBottom: '1px solid #ccc', minWidth: '120px' }}>&nbsp;</td>
    </tr>
  );
}
