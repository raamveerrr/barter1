"use strict";
/**
 * Types for the economy system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["LISTING_FEE"] = "LISTING_FEE";
    TransactionType["ITEM_PURCHASE"] = "ITEM_PURCHASE";
    TransactionType["ADMIN_CREDIT"] = "ADMIN_CREDIT";
    TransactionType["ADMIN_DEBIT"] = "ADMIN_DEBIT";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["DEPOSIT"] = "DEPOSIT";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["REFUNDED"] = "REFUNDED";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
//# sourceMappingURL=economy.js.map