# Componentes compartidos

## Organizacion por dominio

- `payments/`: registro y visualizacion de pagos
  - `RegisterPayment.tsx`
  - `RegisterSupplierPayment.tsx`
  - `PaymentHistoryList.tsx`

- `exports/`: exportaciones a XLSX/CSV para operaciones
  - `ExportAllCustomersMovementsButton.tsx`
  - `ExportAllOrdersWithCustomerButton.tsx`
  - `ExportCustomerMovementsButton.tsx`

- `pdf/`: documentos PDF y botones de descarga
  - `InvoiceDownloadButton.tsx`
  - `InvoicePDFDocument.tsx`
  - `OrderPDFDocument.tsx`
  - `SalePDFDocument.tsx`
  - `ThermalOrderPDFDocument.tsx`
  - `ThermalSalePDFDocument.tsx`
  - `PDFDownloadButton.tsx`
  - `SaleTicketDownloadButton.tsx`

## Regla practica

Si el componente tiene dependencia funcional fuerte con pagos, exportacion o PDF, debe vivir en su subcarpeta de dominio.
Si es UI transversal (layout, navbar, sidebar, theme), se mantiene en `src/components/`.
