"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugPrint = void 0;
const debugPrint = (obj) => {
    const d = new Date;
    const jdt = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    console.log(jdt.toISOString(), obj);
};
exports.debugPrint = debugPrint;
