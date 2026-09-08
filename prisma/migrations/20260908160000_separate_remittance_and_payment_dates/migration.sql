-- A client Gutschrift can arrive before the money. Keep the document date
-- separately and do not require a cash date until the payment reaches the bank.
ALTER TABLE "TaxCashEntry" ADD COLUMN "documentDate" TIMESTAMP(3);
ALTER TABLE "TaxCashEntry" ALTER COLUMN "paymentDate" DROP NOT NULL;
