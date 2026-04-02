import { useRef, useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function Receipt({ data, onClose }) {
    const previewRef = useRef();
    const [settings, setSettings] = useState({
        shop_name: 'AKISA LIMITED',
        shop_address: 'Simara Mall, 1st Floor, Shop No. 1, Behind National Archives',
        shop_phone: '0768 888 661',
        receipt_header: 'We Sell Mobile Phone Spares & Accessories.',
        receipt_footer: 'Fast. Affordable. Trusted. Goods once sold are not returnable.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'global').single();
            if (settingsData) setSettings(settingsData);
        };
        fetchSettings();
    }, []);

    const DIVIDER = '-----------------------------------';

    // Shared print styles injected into the popup window
    const getPrintStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap');
        @page { size: 80mm auto; margin: 4mm 3mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Inconsolata', 'Courier New', Courier, monospace;
            font-size: 16px;
            line-height: 1.5;
            color: #000;
            background: #fff;
            margin: 0; padding: 0;
            width: 74mm;
        }
        .receipt { width: 100%; }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .divider { color: #000; margin: 3px 0; }
        .row {
            display: flex;
            justify-content: space-between;
            width: 100%;
        }
        .row .left { flex: 1; padding-right: 4px; }
        .row .right { text-align: right; white-space: nowrap; }
        .grand-total-label { font-weight: 700; font-size: 18px; text-align: center; margin-top: 4px; }
        .grand-total-value { font-weight: 900; font-size: 22px; text-align: center; }
        .section-title { font-weight: 700; font-size: 15px; text-align: center; text-transform: uppercase; }
        .store-name { font-weight: 900; font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .spacer { height: 4px; }
    `;

    // Build the receipt as an HTML string for printing
    const buildPrintHTML = () => {
        const d = new Date(data.created_at || data.createdAt || new Date());
        const sDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        const sRef = (data.id || '').substring(0, 8).toUpperCase();
        const totalAmount = Number(data.total_amount || data.total || data.cost || data.estimatedCost || 0).toLocaleString();

        // Always show a single Call/WhatsApp line

        const itemsHTML = data.items && data.items.length > 0
            ? data.items.map(item => `
                <div class="row">
                    <span class="left bold">${item.name} x${item.quantity}</span>
                    <span class="right bold">Ksh ${(item.price * item.quantity).toLocaleString()}</span>
                </div>
            `).join('')
            : (() => {
                const name = data.device_name || data.deviceModel || 'General Repair';
                const rtype = data.repair_type || data.repairType || 'Service Fee';
                const cost = (Number(data.cost) || Number(data.estimatedCost) || 0).toLocaleString();
                return `
                    <div class="row">
                        <span class="left bold">${name}<br><small>${rtype}</small></span>
                        <span class="right bold">Ksh ${cost}</span>
                    </div>
                    ${data.issue_description ? `<div>Issue: ${data.issue_description}</div>` : ''}
                `;
            })();

        const paymentHTML = settings.paybill_number ? `
            <div class="section-title">PAYMENT OPTIONS</div>
            <div class="row">
                <span class="left">M-Pesa Paybill:</span>
                <span class="right bold">${settings.paybill_number}</span>
            </div>
            <div class="row">
                <span class="left">Account:</span>
                <span class="right bold">${settings.account_number}</span>
            </div>
            <div class="row">
                <span class="left">Account Name:</span>
                <span class="right">${settings.account_name || ''}.</span>
            </div>
        ` : '';

        return `
            <div class="receipt">
                <div class="center store-name">${settings.shop_name}</div>
                <div class="center">${settings.receipt_header}</div>
                <div class="center">${(settings.shop_address || '').replace(/\n/g, '<br>')}</div>
                <div class="center bold">Call/WhatsApp: ${settings.shop_phone}</div>
                ${settings.kra_pin ? `<div class="center bold">PIN: ${settings.kra_pin}</div>` : ''}
                <div class="divider">${DIVIDER}</div>

                <div class="row"><span class="left">Date:</span><span class="right">${sDate}</span></div>
                <div class="row"><span class="left">Ref No:</span><span class="right">${sRef}</span></div>
                ${data.customer_name || data.customerName ? `<div class="row"><span class="left">Customer:</span><span class="right">${data.customer_name || data.customerName}</span></div>` : ''}
                <div class="row"><span class="left">Payment:</span><span class="right">${data.payment_method || data.paymentMethod || 'Cash'}</span></div>
                ${data.payment_reference || data.paymentReference ? `<div class="row"><span class="left">Tx Code:</span><span class="right">${data.payment_reference || data.paymentReference}</span></div>` : ''}

                <div class="spacer"></div>
                <div class="bold" style="font-size:14px;">Items / Services</div>
                ${itemsHTML}
                <div class="divider">${DIVIDER}</div>

                <div class="grand-total-label">GRAND TOTAL</div>
                <div class="grand-total-value">KSH ${totalAmount}</div>
                <div class="spacer"></div>

                ${paymentHTML}
                <div class="divider">${DIVIDER}</div>
                <div class="center">${(settings.receipt_footer || '').replace(/\n/g, '<br>')}</div>
                <div class="center">Professional Repair &amp; Screen Replacement</div>
            </div>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>${getPrintStyles()}</style>
                </head>
                <body>
                    ${buildPrintHTML()}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Preview HTML rendered in modal
    const previewHTML = buildPrintHTML();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-gray-800">
                        <Printer className="w-5 h-5" /> Receipt Preview
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[65vh] bg-gray-50 flex justify-center">
                    <div
                        ref={previewRef}
                        style={{
                            fontFamily: "'Inconsolata', 'Courier New', Courier, monospace",
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: '#000',
                            background: '#fff',
                            padding: '16px',
                            width: '100%',
                            maxWidth: '320px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }}
                        dangerouslySetInnerHTML={{ __html: `<style>${getPrintStyles().replace(/@page[^}]+}/, '').replace(/body\s*{[^}]+}/, '')}</style>` + previewHTML }}
                    />
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
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
