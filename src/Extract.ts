//import fs from 'fs';

import {
    PDFDocument,
    PDFName,
    PDFDict,
    PDFArray,
    PDFHexString,
    PDFString,
    PDFStream,
    decodePDFRawStream,
    PDFRawStream,
} from 'pdf-lib';

const extractRawAttachments = (pdfDoc: PDFDocument) => {
    if (!pdfDoc.catalog.has(PDFName.of('Names'))) return [];
    const Names = pdfDoc.catalog.lookup(PDFName.of('Names'), PDFDict);

    if (!Names.has(PDFName.of('EmbeddedFiles'))) return [];
    const EmbeddedFiles = Names.lookup(PDFName.of('EmbeddedFiles'), PDFDict);

    if (!EmbeddedFiles.has(PDFName.of('Names'))) return [];
    const EFNames = EmbeddedFiles.lookup(PDFName.of('Names'), PDFArray);

    const rawAttachments = [];
    for (let idx = 0, len = EFNames.size(); idx < len; idx += 2) {
        const fileName = EFNames.lookup(idx) as PDFHexString | PDFString;
        const fileSpec = EFNames.lookup(idx + 1, PDFDict);
        rawAttachments.push({ fileName, fileSpec });
    }

    return rawAttachments;
};

export const extractAttachments = (pdfDoc: PDFDocument) => {
    const rawAttachments = extractRawAttachments(pdfDoc);
    return rawAttachments.map(({ fileName, fileSpec }) => {
        const stream = fileSpec
            .lookup(PDFName.of('EF'), PDFDict)
            .lookup(PDFName.of('F'), PDFStream) as PDFRawStream;
        return {
            name: fileName.decodeText(),
            data: decodePDFRawStream(stream).decode(),
        };
    });
};
export const fileToArrayBuffer = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.readAsArrayBuffer(file);
    });
// (async() => {
//     const pdfWithAttachments = await fetch(
//         'https://github.com/Hopding/pdf-lib/files/4963252/with_attachment.pdf',
//     ).then((res) => res.arrayBuffer());

//     const pdfDoc = await PDFDocument.load(pdfWithAttachments);

//     const attachments = extractAttachments(pdfDoc);

//     const csv = attachments.find((attachment) => attachment.name === 'cars.csv') !;
//     fs.writeFileSync('cars.csv', csv.data);
//     console.log('CSV file written to ./cars.csv');

//     const jpg = attachments.find((attachment) => attachment.name === 'mini.jpg') !;
//     fs.writeFileSync('mini.jpg', jpg.data);
//     console.log('JPG file written to ./mini.jpg');
// })();