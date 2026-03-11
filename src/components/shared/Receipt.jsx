import { useRef, useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function Receipt({ data, onClose }) {
    const printRef = useRef();
    const [settings, setSettings] = useState({
        shop_name: 'AKISA LIMITED',
        shop_address: 'Simara Mall, 1st Floor, Shop No. 1, Behind National Archives',
        shop_phone: '0768 888 661',
        receipt_header: 'AKISA LIMITED: We Sell Mobile Phone Spares & Accessories.',
        receipt_footer: 'Fast. Affordable. Trusted. Goods once sold are not returnable.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'global').single();
            if (settingsData) setSettings(settingsData);
        };
        fetchSettings();
    }, []);

    const printStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .receipt-wrapper { 
            font-family: 'Courier New', Courier, monospace; 
            line-height: 1.2;
            color: #000;
            background: #fff;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
        }
        .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .receipt-store-name { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .receipt-details { margin-bottom: 15px; font-size: 12px; }
        .receipt-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .receipt-items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .receipt-item-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
        .receipt-total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; text-transform: uppercase; }
        .receipt-payment-info { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; }
        .receipt-payment-title { font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 5px; }
        .receipt-payment-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .receipt-footer { text-align: center; margin-top: 15px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; }
    `;

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        ${printStyles}
                        body { margin: 0; padding: 0; background: #fff; display: flex; justify-content: center; }
                        @media print {
                            body { width: 80mm; margin: 0; padding: 0; }
                            @page { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center no-print">
                    <h3 className="font-bold flex items-center gap-2 text-gray-800">
                        <Printer className="w-5 h-5" /> Receipt Preview
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[70vh] bg-gray-100 flex justify-center" ref={printRef}>
                    <style>{printStyles}</style>
                    <div className="receipt-wrapper shadow-sm">
                        <div className="receipt-header">
                            <div className="receipt-store-name">{settings.shop_name}</div>
                            <div className="text-[10px] mt-1 uppercase tracking-tighter">{settings.receipt_header}</div>
                            <div className="text-[9px] text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: settings.shop_address.replace(/\n/g, '<br />') }} />
                            {settings.shop_phone === settings.whatsapp_phone ? (
                                <div className="text-[10px] font-bold mt-1">Call / WhatsApp: {settings.shop_phone}</div>
                            ) : (
                                <>
                                    <div className="text-[10px] font-bold mt-1">Call: {settings.shop_phone}</div>
                                    {settings.whatsapp_phone && <div className="text-[10px] font-bold">WhatsApp: {settings.whatsapp_phone}</div>}
                                </>
                            )}
                            {settings.kra_pin && <div className="text-[10px] uppercase font-bold text-gray-700 mt-1">PIN: {settings.kra_pin}</div>}
                        </div>

                        <div className="receipt-details">
                            <div className="receipt-row">
                                <span>Date:</span>
                                <span>{new Date(data.created_at || data.createdAt || new Date()).toLocaleDateString()}</span>
                            </div>
                            <div className="receipt-row">
                                <span>Ref No:</span>
                                <span className="font-mono">{data.id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                            {data.customer_name || data.customerName ? (
                                <div className="receipt-row">
                                    <span>Customer:</span>
                                    <span>{data.customer_name || data.customerName}</span>
                                </div>
                            ) : null}
                            <div className="receipt-row">
                                <span>Payment:</span>
                                <span>{data.payment_method || data.paymentMethod || 'Cash'}</span>
                            </div>
                            {(data.payment_reference || data.paymentReference) && (
                                <div className="receipt-row">
                                    <span>Tx Code:</span>
                                    <span className="font-mono">{data.payment_reference || data.paymentReference}</span>
                                </div>
                            )}
                        </div>

                        <div className="receipt-items">
                            <div className="font-bold mb-3 uppercase text-[10px] tracking-wider border-b border-gray-100 pb-1">Items / Services</div>

                            {/* List items for POS Sales */}
                            {data.items ? (
                                data.items.map((item, idx) => (
                                    <div key={idx} className="mb-2">
                                        <div className="receipt-item-row">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>Ksh {(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Single Repair Job */
                                <div className="mb-2">
                                    <div className="receipt-item-row">
                                        <span className="font-bold">{data.device_name || data.deviceModel || 'General Repair'}</span>
                                        <span className="font-bold">Ksh {(Number(data.cost) || Number(data.estimatedCost) || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 italic ml-2">
                                        - {data.repair_type || data.repairType || 'Service Fee'}
                                    </div>
                                    {data.issue_description && (
                                        <div className="text-[9px] text-gray-400 ml-2 mt-1">
                                            Issue: {data.issue_description}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="receipt-total">
                            <div className="text-[10px] font-normal text-gray-400">GRAND TOTAL</div>
                            Ksh {Number(data.total_amount || data.total || data.cost || data.estimatedCost || 0).toLocaleString()}
                        </div>

                        {settings.paybill_number && (
                            <div className="receipt-payment-info mt-6 border-t border-dashed border-gray-200 pt-4">
                                <div className="receipt-payment-title font-bold text-[10px] uppercase mb-2 text-center text-gray-800">Payment Options</div>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                    <div className="receipt-payment-row flex justify-between text-[10px]">
                                        <span className="text-gray-500">M-Pesa Paybill:</span>
                                        <span className="font-bold font-mono">{settings.paybill_number}</span>
                                    </div>
                                    <div className="receipt-payment-row flex justify-between text-[10px]">
                                        <span className="text-gray-500">Account:</span>
                                        <span className="font-bold font-mono">{settings.account_number}</span>
                                    </div>
                                    <div className="receipt-payment-row flex justify-between text-[10px]">
                                        <span className="text-gray-500">Account Name:</span>
                                        <span className="font-bold">{settings.account_name}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="receipt-footer">
                            <div className="text-[10px]">Professional Repair & Screen Replacement</div>
                            <div className="mt-2 text-[9px] border-t border-dashed border-gray-200 pt-2" dangerouslySetInnerHTML={{ __html: (settings.receipt_footer || '').replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
                    >
                        <Printer className="w-5 h-5" /> Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
}
