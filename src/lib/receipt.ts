export type ReceiptData = {
  receiptNo: string;
  date: string;
  plan: string;
  period: string;
  amount: string;
  payer: string;
  method: string;
  lang: "ru" | "en";
};

const TEXT = {
  ru: {
    title: "Чек об оплате",
    company: "ООО «ЩИТ»",
    requisites: "ИНН 7701234567 · 125009, Москва, ул. Тверская, д. 1",
    receiptNo: "Чек №",
    date: "Дата оплаты",
    payer: "Плательщик",
    service: "Назначение платежа",
    serviceVal: "Членский взнос (тариф)",
    plan: "Тариф",
    period: "Период",
    method: "Способ оплаты",
    total: "Итого оплачено",
    note: "Документ сформирован автоматически и не требует подписи и печати.",
    print: "Сохранить в PDF",
  },
  en: {
    title: "Payment receipt",
    company: "SHCHIT LLC",
    requisites: "VAT 7701234567 · 1 Tverskaya St., Moscow, 125009",
    receiptNo: "Receipt No.",
    date: "Payment date",
    payer: "Payer",
    service: "Payment purpose",
    serviceVal: "Membership fee (plan)",
    plan: "Plan",
    period: "Period",
    method: "Payment method",
    total: "Total paid",
    note: "This document is generated automatically and requires no signature or seal.",
    print: "Save as PDF",
  },
};

export function downloadReceipt(data: ReceiptData) {
  const t = TEXT[data.lang];
  const html = `<!DOCTYPE html>
<html lang="${data.lang}">
<head>
<meta charset="utf-8" />
<title>${t.receiptNo}${data.receiptNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1d24; background: #f4f5f7; padding: 32px; }
  .sheet { max-width: 620px; margin: 0 auto; background: #fff; border: 1px solid #e4e6eb; border-radius: 10px; overflow: hidden; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 32px; background: linear-gradient(135deg, #1a1d24, #2a2f3a); color: #fff; }
  .brand { font-weight: 800; font-size: 20px; letter-spacing: -0.5px; }
  .brand span { color: #d4af37; }
  .sub { font-size: 11px; opacity: .65; margin-top: 6px; }
  .title { text-align: right; }
  .title h1 { font-size: 16px; font-weight: 700; }
  .title .no { font-size: 12px; color: #d4af37; margin-top: 4px; }
  .body { padding: 28px 32px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eef0f3; font-size: 14px; }
  .row .k { color: #6b7280; }
  .row .v { font-weight: 600; text-align: right; }
  .total { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 18px 22px; background: #faf7ec; border: 1px solid #ecdfb0; border-radius: 8px; }
  .total .k { font-size: 14px; color: #6b7280; }
  .total .v { font-size: 26px; font-weight: 800; color: #b8901f; }
  .note { margin-top: 22px; font-size: 11px; color: #9aa0ab; line-height: 1.5; }
  .btn { display: block; margin: 22px auto 0; padding: 12px 28px; background: #d4af37; color: #1a1d24; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }
  @media print { body { background: #fff; padding: 0; } .sheet { border: none; } .btn { display: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand" style="letter-spacing:0.2em;">Щ<span>ИТ</span></div>
        <div class="sub">${t.company}<br/>${t.requisites}</div>
      </div>
      <div class="title">
        <h1>${t.title}</h1>
        <div class="no">${t.receiptNo}${data.receiptNo}</div>
      </div>
    </div>
    <div class="body">
      <div class="row"><span class="k">${t.date}</span><span class="v">${data.date}</span></div>
      <div class="row"><span class="k">${t.payer}</span><span class="v">${data.payer}</span></div>
      <div class="row"><span class="k">${t.service}</span><span class="v">${t.serviceVal}</span></div>
      <div class="row"><span class="k">${t.plan}</span><span class="v">${data.plan}</span></div>
      <div class="row"><span class="k">${t.period}</span><span class="v">${data.period}</span></div>
      <div class="row"><span class="k">${t.method}</span><span class="v">${data.method}</span></div>
      <div class="total"><span class="k">${t.total}</span><span class="v">${data.amount}</span></div>
      <div class="note">${t.note}</div>
      <button class="btn" onclick="window.print()">${t.print}</button>
    </div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}