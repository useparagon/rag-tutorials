"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const paragonTutorialSendNotionContentsToApi_1 = tslib_1.__importDefault(require("./workflows/paragonTutorialSendNotionContentsToApi"));
const config = {
    description: 'Connect your Notion workspace',
    overviewText: `Connect to your Notion account to manage your pages and databases in Notion. Increase your team’s productivity by keeping your Notion account up to date - without manual data entry.
              
Our notion integration enables you to:
           
• Sync data in pages and databases in your Notion workspace
• Create and update page content in your Notion workspace`,
    showWatermark: false,
    workflowDisplayOrder: [
        paragonTutorialSendNotionContentsToApi_1.default
    ],
};
exports.default = config;
//# sourceMappingURL=config.js.map