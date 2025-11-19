import { createDocument, generateInvoice } from "./PDFGenerator.java";

const doc = createDocument("My Document");
doc.addHeading("Chapter 1");
doc.addParagraph("Content here");
console.log("PDF:", doc.generate());

const invoice = generateInvoice({ number: "INV-123", total: 1500.00 });
console.log("Invoice:", invoice);
