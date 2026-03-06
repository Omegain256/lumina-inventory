import { useRef, useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function Receipt({ data, type = 'repair', onClose }) {
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

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            padding: 20px; 
                            line-height: 1.2;
                            color: #000;
                            background: #fff;
                            width: 80mm;
                            margin: 0 auto;
                        }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .store-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
                        .details { margin-bottom: 20px; font-size: 14px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
                        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
                        @media print {
                            body { width: 100%; margin: 0; padding: 10px; }
                            .no-print { display: none; }
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

                <div className="p-8 overflow-y-auto max-h-[70vh]" ref={printRef}>
                    <div className="receipt-container">
                        <div className="header">
                            <div className="store-name">{settings.shop_name}</div>
                            <div className="text-[10px] mt-1 uppercase tracking-tighter">{settings.receipt_header}</div>
                            <div className="text-[9px] text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: settings.shop_address.replace(/\n/g, '<br />') }} />
                            <div className="text-[10px] font-bold mt-1">Call/WhatsApp: {settings.shop_phone}</div>
                        </div>

                        <div className="details">
                            <div className="row">
                                <span>Date:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="row">
                                <span>Time:</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="row">
                                <span>Ref No:</span>
                                <span className="font-mono">{data.id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="items">
                            <div className="font-bold mb-3 uppercase text-[10px] tracking-wider border-b border-gray-100 pb-1">Items / Services</div>
                            <div className="item-row">
                                <span className="font-bold">{data.deviceModel || data.itemName}</span>
                                <span className="font-bold">Ksh {(Number(data.estimatedCost) || Number(data.total) || 0).toLocaleString()}</span>
                            </div>
                            {data.repairType && (
                                <div className="text-[10px] text-gray-500 italic ml-2">
                                    - {data.repairType}
                                </div>
                            )}
                        </div>

                        <div className="total">
                            <div className="text-[10px] font-normal text-gray-400">GRAND TOTAL</div>
                            Ksh {(Number(data.estimatedCost) || Number(data.total) || 0).toLocaleString()}
                        </div>

                        <div className="footer">
                            <div className="font-bold mb-1">Fast. Affordable. Trusted</div>
                            <div className="text-[10px]">Professional Repair & Screen Replacement</div>
                            <div className="mt-2 text-[9px] border-t border-dashed border-gray-200 pt-2" dangerouslySetInnerHTML={{ __html: settings.receipt_footer.replace(/\n/g, '<br />') }} />
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
