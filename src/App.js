import "./App.css";
import { useState } from "react";
import { PDFHexString, PDFName, PDFDocument } from "pdf-lib";
import download from "downloadjs";
import { fileToArrayBuffer, extractAttachments } from "./Extract.ts";

const SIGNATURE = PDFName.of("Signature");
const SIGNATURE_IMAGE_FILE_NAME = "signature.jpg";
function App() {
    const [pdfDoc, setPdfDoc] = useState();
    const [inputSign, setInputSign] = useState("");
    const [signImage, setSignImage] = useState();

    const handleFileToPdfDoc = async (file) => {
        if (!file) {
            return;
        }

        fileToArrayBuffer(file).then(async (dataBuffer) => {
            const existingPdfDocBytes = new Uint8Array(dataBuffer);
            const uploadPdfDoc = await PDFDocument.load(existingPdfDocBytes);
            setPdfDoc(uploadPdfDoc);
        });
    };

    const handleImageFile = async (file) => {
        if (!file) {
            return;
        }

        fileToArrayBuffer(file).then(async(dataBuffer) =>{
            const imageBytes = new Uint8Array(dataBuffer);
            setSignImage(imageBytes);
        })
    };
    const setSign = async () => {
        //load PDF file
        // const response = await fetch("http://ceur-ws.org/Vol-2753/paper28.pdf");
        // const buffer = await response.arrayBuffer();

        // const existingPdfDocBytes = new Uint8Array(buffer);
        // const pdfDoc = await PDFDocument.load(existingPdfDocBytes);

        //assign signature
        const sign = inputSign;

        pdfDoc.getInfoDict().set(SIGNATURE, PDFHexString.fromText(sign));
        alert("Set signature successfully");
    };
    const showSignature = () => {
        const signature = pdfDoc.getInfoDict().lookup(SIGNATURE);
        if (signature) {
            console.log(signature.decodeText());
        } else {
            alert("Don't have a signature!");
        }
    };
    const downloadFile = async () => {
        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "signed_pdf.pdf", "application/pdf");
    };
    const extract = async () => {
        const attachments = extractAttachments(pdfDoc);
        console.log(attachments);
        const file = attachments.find(({ name }) => name === SIGNATURE_IMAGE_FILE_NAME);
        console.log(file);
        download(file.data, file.name, "image/jpeg");
    };
    const attachImage = () =>{
        if(!pdfDoc || !signImage){
            return;
        }
        pdfDoc.attach(signImage, SIGNATURE_IMAGE_FILE_NAME,{
            mimeType: 'image/jpeg',
            description: 'Signature image by Truong',
            creationDate: new Date(),
            modificationDate: new Date(),
        })
        alert("Attach successfully!")
    }
    return (
        <div className="App">
            <div id="inputPdf">
                <input type="file" placeholder="input PDF" onChange={(f) => handleFileToPdfDoc(f.target.files[0])} />{" "}
                <input type="text" onChange={(e) => setInputSign(e.target.value)} />{" "}
                <button onClick={() => setSign()}> Set signature </button>{" "}
                <button onClick={() => showSignature()}> Show signature </button>{" "}
            </div>
            <div id="inputImage">
                <input type="file" placeholder="input image" onChange={(f) => handleImageFile(f.target.files[0])} />{" "}
                <button onClick={() => attachImage()}> Attach Image </button>{" "}
                <button onClick={() => extract()}> Extract Attachments </button>{" "}
            </div>
            <button onClick={() => downloadFile()}> Download </button>{" "}
        </div>
    );
}

export default App;
