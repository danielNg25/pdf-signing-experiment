import "./App.css";
import { useState } from "react";
import { PDFHexString, PDFName, PDFDocument } from "pdf-lib";
import download from "downloadjs";
import { fileToArrayBuffer, extractAttachments } from "./Extract.ts";
import { sha256 } from 'js-sha256';
import * as jsrsasign from "jsrsasign";

const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEoQIBAAKCAQBrkCpm3TxUjPHODTOIyIqzMCc4fwFcWsi74nciMMEpXZg99q07
/A9jTuThBQ6zocVZYwXeFcz8YKTqGeG4Ee3Jtp3xjh0qPeQbjUh/pEk0rhNdn+mG
+8ME3Soc1AiTTejSn5VqAiFcciUlTSqSY/KgY9Sm8utDy2bJblAXOBPsoQhKYMh/
ixhpXNSJ8l5QoAh4Q+0Pi3pFseJs/649dBhgKOxgf+dyKJ/b9xKyJ1XRWGAjS/Fc
iqgS67WQTEdzTleAzcrroh3eTZIF26ksAlBsEBzwuswyO6/EbzKueKmF7oKXnmj4
tNHPC3zG8Rlzm2YWIWIhC6Sf1iFq5t8mDaTxAgMBAAECggEARQ8peiOe4XYgpbeq
F68SBhvrgoVgfUg4SxEKhiQhUIqr/VSMQtABnTQBFUvm9YPurgY6tSzwEDWIjFkT
p9ezAOhDndwtc3qLIvlhy7nR2oXNHzZVe/nWayAIMrwbyV+jFN+q0YYOn0kV+k4C
AD01gK630Hx0enF0S+2MdGvntuuRH7spoeIaR4u8DimuYJt+BOwc32v6UIIDHRzm
1niKcw6WC5dBdK5PtLNCSIHbjo6kYs8kf9bDzEHWkI/PomYkiAsA6BEiB80jkxNb
ZzOBhjNKSgXv8g8LV6EgcBbLmGSoggy51QFd2aMBm0wBVXHazBs4GxvAzdXX8Ql0
aSbqMQKBgQDCdThS/ivlL3IcyScIKydZzb4toCuvHxprOtVJ/kdss63zVtAIs+uJ
jNeVjA+wGiuYLN+7ZeOo9/pDYoVW0SP/MuaXna/vSe5OcmXxZqnnMwfI6+wwXdjr
0DO9D72T968Fs4PKSy3AqAm0TgW/yX8zldV2xQNjTWkHKZMPM80khQKBgQCNmtJ1
UQRmdmLxE/WQFuUN5EQEP7ZfJjNGdKJVYY83Cckg2duxhs7VyYwSVPtG39JMiDNB
fKJpS/VwMWaj0IV6lkUiBOgG6vdCpmG6jdKTNGp0lcC+Rxnsolsbw00BvRgKDLUu
PVFQo8e9TNSRTomWbralJB7Qw0m/0nRoeHiQfQKBgFz/0KsocffPBCUuMqOed9hk
JHMPqjS7jFgCMCWOHbyoBiZdu2qeGaSUHjqgXJRdP8Ism+e05/dUeXUmthx6M1wG
jO+v84dedUFBRu33qoQvDKcT5caP64GD9mqSD5mnmCYC36Gs6Lm9474+nlNF27bh
DtEZkfA5AmTxhip8HL09AoGAfAlHnFexIQdGN6GiEercDMUMByS/3KybcXWs1Fk2
l6FMuifa1rAc8QswVMZ3rGdV0I/lRdGkedN9VB8RpyB6Kx0BxYDCtXyPxaP0KvMb
prHdJe4e/Q1O2gaFA9aY15MJQZRMCArR9W7hASIReI5w2oJ0Hkd7bqYBLbNtIC2W
fgkCgYBLLmr49tauQUqEibhA7WsoXWsbJyPTT3uMRdZ9VBp1FhUf2SEZTrmvWqgl
RueQ2G3lZaIUyixz0bQGSPvSFazB65r4H5FGds+F/jfd53iPecyG+piilyfOuSiN
nHD1vnAuSMMzdtiWQcD2ciPyyezH0ic4zx0wfesBZTkQ7JDVCg==
-----END RSA PRIVATE KEY-----`;
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQBrkCpm3TxUjPHODTOIyIqz
MCc4fwFcWsi74nciMMEpXZg99q07/A9jTuThBQ6zocVZYwXeFcz8YKTqGeG4Ee3J
tp3xjh0qPeQbjUh/pEk0rhNdn+mG+8ME3Soc1AiTTejSn5VqAiFcciUlTSqSY/Kg
Y9Sm8utDy2bJblAXOBPsoQhKYMh/ixhpXNSJ8l5QoAh4Q+0Pi3pFseJs/649dBhg
KOxgf+dyKJ/b9xKyJ1XRWGAjS/FciqgS67WQTEdzTleAzcrroh3eTZIF26ksAlBs
EBzwuswyO6/EbzKueKmF7oKXnmj4tNHPC3zG8Rlzm2YWIWIhC6Sf1iFq5t8mDaTx
AgMBAAE=
-----END PUBLIC KEY-----`;
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
            //console.log(sha256(existingPdfDocBytes));
            // getContent(existingPdfDocBytes)
            const uploadPdfDoc = await PDFDocument.load(existingPdfDocBytes);
            setPdfDoc(uploadPdfDoc);
        });
    };

    const handleImageFile = async (file) => {
        if (!file) {
            return;
        }

        fileToArrayBuffer(file).then(async (dataBuffer) => {
            const imageBytes = new Uint8Array(dataBuffer);
            setSignImage(imageBytes);
        });
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
    const attachImage = () => {
        if (!pdfDoc || !signImage) {
            return;
        }
        pdfDoc.attach(signImage, SIGNATURE_IMAGE_FILE_NAME, {
            mimeType: "image/jpeg",
            description: "Signature image by Truong",
            creationDate: new Date(),
            modificationDate: new Date(),
        });
        alert("Attach successfully!");
    };
    // const getContent = async (src) => {
        
    //     const doc = await pdfjs.getDocument(src).promise;

    //     const page =await doc.getPage(1);
    //     const content = await page.getTextContent();
    //     //const hashedFile = sha256(page);
    //     // console.log(doc)
    //     // console.log(content);
    // }
    const logHash = async () =>{
        let copyDoc = await PDFDocument.create();

        let [copyPage] = await copyDoc.copyPages(pdfDoc, [0]);

        copyDoc.addPage(copyPage)

        copyDoc.setCreationDate(new Date(1995, 11, 17, 3, 24, 0))
        copyDoc.setModificationDate(new Date(1995, 11, 17, 3, 24, 0))
        let copyBytes = await copyDoc.save();
        
        let hashedFile = sha256(copyBytes);
        console.log(hashedFile);
        return hashedFile;
    }
    const sign = async () => {
        //const bytes = await logHash();
        //const key = await importPrivateKey(PRIVATE_KEY);
        doSign();
        //const sign = await window.crypto.subtle.sign(algorithm, PRIVATE_KEY, bytes)
        //console.log(sign);
    };
    //References http://kjur.github.io/jsrsasign/api/symbols/KJUR.crypto.Signature.html#init
    const doSign = async ()=> {
        // var rsa = new jsrsasign.RSAKey();
        // rsa.readPrivateKeyFromPEMString(PRIVATE_KEY);
        //var hashAlg = "SHA256withRSA";
        //var hSig = rsa.sign("hehe", hashAlg);
        //console.log(rsa);
        const hashed = await logHash();
        var sig = new jsrsasign.KJUR.crypto.Signature({"alg": "SHA256withRSA"})
        sig.init(PRIVATE_KEY);
        sig.updateString(hashed);
        const signedHex = sig.sign();
        console.log(signedHex);
        var veri = new jsrsasign.KJUR.crypto.Signature({"alg": "SHA256withRSA"})
        // const pub = jsrsasign.KEYUTIL.getKey(PUBLIC_KEY);
        veri.init(PUBLIC_KEY);
        veri.updateString(hashed);
        console.log(veri.verify(signedHex));
        
    }
    return (
        <div className="App">
            <div id="inputPdf">
                <input type="file" placeholder="input PDF" onChange={(f) => handleFileToPdfDoc(f.target.files[0])} />{" "}
                <input type="text" onChange={(e) => setInputSign(e.target.value)} />{" "}
                <button onClick={() => setSign()}> Set signature </button>{" "}
                <button onClick={() => showSignature()}> Show signature </button>{" "}
            </div>{" "}
            <div id="inputImage">
                <input type="file" placeholder="input image" onChange={(f) => handleImageFile(f.target.files[0])} />{" "}
                <button onClick={() => attachImage()}> Attach Image </button>{" "}
                <button onClick={() => extract()}> Extract Attachments </button>{" "}
            </div>{" "}
            <button onClick={() => downloadFile()}> Download </button>
            <button onClick={() => logHash()}> Hash </button>{" "}
            <div>
                <button onClick={() => sign()}> Sign </button>{" "}
            </div>
        </div>
    );
}

export default App;
