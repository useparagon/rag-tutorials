"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ragTutorialSyncCurrentFiles_1 = tslib_1.__importDefault(require("./workflows/ragTutorialSyncCurrentFiles"));
const ragTutorialSyncFileUpdates_1 = tslib_1.__importDefault(require("./workflows/ragTutorialSyncFileUpdates"));
const ragTutorialSyncNewFiles_1 = tslib_1.__importDefault(require("./workflows/ragTutorialSyncNewFiles"));
const config = {
    description: 'Save files to Google Drive',
    overviewText: `Connect your Google account and sync files from your Google Drive. 
        
Our Google Drive integration enables you to:
       
• Save files to your Google Drive
• Sync files from your Google Drive`,
    showWatermark: false,
    workflowDisplayOrder: [
        ragTutorialSyncCurrentFiles_1.default,
        ragTutorialSyncFileUpdates_1.default,
        ragTutorialSyncNewFiles_1.default,
    ],
};
exports.default = config;
//# sourceMappingURL=config.js.map