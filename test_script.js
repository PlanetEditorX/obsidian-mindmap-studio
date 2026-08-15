import assert from "assert/strict";

const run = async () => {
    try {
        await assert.rejects(
            async () => { throw new Error("安全限制：为防止任意命令执行，OCR 引擎必须使用 tesseract 基础命令或完整的绝对路径"); },
            /为防止任意命令执行，OCR 引擎文件名必须为 tesseract 或 tesseract\.exe/
        );
        console.log("PASS");
    } catch(e) {
        console.log("FAIL", e);
    }
};

run();
