const removeLines = (str) => {
    return str.replace("\n", "");
}

const base64ToArrayBuffer = (b64) => {
    var byteString = window.atob(b64);
    var byteArray = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    return byteArray;
}

const pemToArrayBuffer = (pem) => {
        var b64Lines = removeLines(pem);
        var b64Prefix = b64Lines.replace('-----BEGIN PRIVATE KEY-----', '');
        var b64Final = b64Prefix.replace('-----END PRIVATE KEY-----', '');

        return base64ToArrayBuffer(b64Final);
    }
    // const yourprivatekey = `-----BEGIN PRIVATE KEY-----
    //     MIIBOAIBAAJAUrNPpTe/LCo6MvVTD9gyI7x0hPOkjMTCjbCX4TDpU1c7fjcbN0sK
    //     ZpQnoLfKgyk2vXVoFBBiO2pZzBgLQpxq7wIDAQABAkAgiQjBcCAWyPoiiB9IcX6w
    //     TnjswUmwU8xSn/HwlySEM68XpDTsbJV4cv9MdvxvgUS27YU0L2akre/nDINiDZKB
    //     AiEAo+/mJzcg/GLMJzvCHPaU9nR+PELSmvc5+k4Qcedw/UECIQCBJJQ/FmuMMUV6
    //     I7QMTo4xNfgNtJ6v9k9TcEimU+bsLwIgLcD/2EQPpcEhP3XzOEgtzRc4QDNaOjvz
    //     54MwHco9g8ECIAtiwDc3sM+xYGC+WRdkraClE3OR4xO8cY33rlALwaY9AiB0+xFZ
    //     sggLmI7VWqWUdytmUedSj8M/lOujikelanOXNw==
    //     -----END PRIVATE KEY-----`
export const importPrivateKey = async(yourkey) => {
    return await window.crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(yourkey), {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
                name: "SHA-256"
            },
            modulusLength: 2048,
            extractable: false,
            publicExponent: new Uint8Array([1, 0, 1])
        },
        true, ["sign"]
    )
}